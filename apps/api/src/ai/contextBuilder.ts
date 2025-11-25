import { prisma } from '@lms/db';
import { getAgentDefinition } from './agentRegistry';

export async function buildContext(params: {
  userId: string;
  tenantId: string;
  agentName: string;
  courseId?: string;
  pageId?: string;
  moduleId?: string;
  userQuestion: string;
}): Promise<{ systemPrompt: string; contextText: string }> {
  const { userId, tenantId, agentName, courseId, pageId, moduleId, userQuestion } = params;

  const agent = getAgentDefinition(agentName);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const retrievalTopK = agent.contextPolicy.retrievalTopK;

  // Build context from course pages
  let contextPages: Array<{ id: string; title: string; bodyMarkdown: string }> = [];

  // If pageId is provided, fetch that specific page
  if (pageId) {
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        courseId: courseId || undefined,
      },
      select: {
        id: true,
        title: true,
        bodyMarkdown: true,
        courseId: true,
      },
    });

    if (page) {
      // Verify course belongs to tenant
      const course = await prisma.course.findFirst({
        where: {
          id: page.courseId,
          tenantId,
        },
      });

      if (course) {
        contextPages.push(page);
      }
    }
  }

  // If courseId is provided, search for relevant pages using keywords from userQuestion
  if (courseId) {
    // Verify course belongs to tenant
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId,
      },
    });

    if (course) {
      // Extract keywords from userQuestion (simple approach: split by spaces, filter short words)
      const keywords = userQuestion
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);

      // Search for pages containing any of these keywords
      if (keywords.length > 0) {
        // Build OR query for keywords
        const keywordQuery = keywords.map((kw) => ({
          bodyMarkdown: {
            contains: kw,
            mode: 'insensitive' as const,
          },
        }));

        const relevantPages = await prisma.page.findMany({
          where: {
            courseId,
            OR: keywordQuery,
            // Exclude the page we already fetched (if any)
            id: pageId ? { not: pageId } : undefined,
          },
          select: {
            id: true,
            title: true,
            bodyMarkdown: true,
          },
          take: retrievalTopK,
        });

        contextPages.push(...relevantPages);
      }
    }
  }

  // Build contextText from pages
  let contextText = '';
  if (contextPages.length > 0) {
    contextText = contextPages
      .map((page, idx) => {
        return `--- Page ${idx + 1}: ${page.title} ---\n${page.bodyMarkdown}\n`;
      })
      .join('\n');
  } else {
    contextText = 'No course content available for context.';
  }

  // Build system prompt
  const systemPrompt = `You are the ${agentName} agent for a learning management system.

Your role: ${agent.description}

Instructions:
- Use ONLY the provided course content below to answer the user's questions.
- Do not make up information or use external knowledge.
- When answering, cite the page titles (not URLs) where you found the information.
- If the provided content does not contain the answer, say so clearly.
- Be concise and helpful.

Course Content:
${contextText}
`;

  return {
    systemPrompt,
    contextText,
  };
}

