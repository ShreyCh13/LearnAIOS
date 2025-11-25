import { prisma } from '@lms/db';
import { callChatModel } from './modelGateway';

export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  permissionsRequired: string;
  contextTypes: string;
  latencyClass: string;
}

export type ToolExecutionContext = {
  userId: string;
  tenantId: string;
  role: string; // global user role, e.g. "student" | "instructor" | "admin"
};

// Hard-coded tool definition for MVP
const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'search_course_content',
    name: 'search_course_content',
    displayName: 'Search course content',
    description: 'Searches pages in the current course by query and returns snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'The ID of the course to search within',
        },
        query: {
          type: 'string',
          description: 'The search query to find relevant pages',
        },
      },
      required: ['courseId', 'query'],
    },
    outputSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pageId: { type: 'string' },
          title: { type: 'string' },
          snippet: { type: 'string' },
        },
      },
    },
    permissionsRequired: 'student,instructor',
    contextTypes: 'course_page',
    latencyClass: 'sync',
  },
  {
    id: 'generate_practice_questions',
    name: 'generate_practice_questions',
    displayName: 'Generate practice questions',
    description: 'Generate practice questions based on pages in a module.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'The ID of the course',
        },
        moduleId: {
          type: 'string',
          description: 'The ID of the module to generate questions for',
        },
        questionCount: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          description: 'Number of practice questions to generate',
          default: 5,
        },
      },
      required: ['courseId', 'moduleId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              answer: { type: 'string' },
            },
            required: ['prompt', 'answer'],
          },
        },
      },
      required: ['questions'],
    },
    permissionsRequired: 'instructor',
    contextTypes: 'course_page,module_page',
    latencyClass: 'sync',
  },
  {
    id: 'summarize_module',
    name: 'summarize_module',
    displayName: 'Summarize Module',
    description: 'Summarize the pages and assignments in a module into a study guide.',
    inputSchema: {
      type: 'object',
      properties: {
        moduleId: {
          type: 'string',
          description: 'The ID of the module to summarize',
        },
      },
      required: ['moduleId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'The generated study guide summary',
        },
      },
      required: ['summary'],
    },
    permissionsRequired: 'student,instructor',
    contextTypes: 'module_page',
    latencyClass: 'sync',
  },
];

/**
 * Get tool definitions available for a given agent
 */
export function getToolDefinitionsForAgent(agentName: string): ToolDefinition[] {
  // For MVP, content_helper gets all tools (search, question generation, and summarization)
  if (agentName === 'content_helper') {
    return TOOL_DEFINITIONS;
  }
  return [];
}

/**
 * List all available tool definitions
 */
export function listTools(): ToolDefinition[] {
  return TOOL_DEFINITIONS;
}

/**
 * Get contextual tools filtered by agent, role, and optional context type
 */
export function getContextualTools(params: {
  agentName: string;
  role: string;
  contextType?: string;
}): ToolDefinition[] {
  const { agentName, role, contextType } = params;

  // Start with tools allowed for the given agent
  let tools = getToolDefinitionsForAgent(agentName);

  // Filter by role permissions
  tools = tools.filter((tool) => {
    const allowedRoles = tool.permissionsRequired
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    return allowedRoles.length === 0 || allowedRoles.includes(role);
  });

  // Filter by context type if provided
  if (contextType) {
    tools = tools.filter((tool) => {
      const toolContextTypes = tool.contextTypes
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      return toolContextTypes.includes(contextType);
    });
  }

  return tools;
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  toolName: string,
  args: any,
  context: ToolExecutionContext
): Promise<any> {
  // Find the tool definition
  const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Enforce permissions
  const allowedRoles = tool.permissionsRequired
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (allowedRoles.length > 0 && !allowedRoles.includes(context.role)) {
    const err = new Error('FORBIDDEN_TOOL') as any;
    err.statusCode = 403;
    throw err;
  }

  // Execute the tool
  if (toolName === 'search_course_content') {
    return await executeSearchCourseContent(args, context);
  }

  if (toolName === 'generate_practice_questions') {
    return await executeGeneratePracticeQuestions(args, context);
  }

  if (toolName === 'summarize_module') {
    return await executeSummarizeModule(args, context);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Execute the search_course_content tool
 */
async function executeSearchCourseContent(
  args: any,
  context: ToolExecutionContext
): Promise<any> {
  const { courseId, query } = args;

  // Validate arguments
  if (!courseId || typeof courseId !== 'string') {
    throw new Error('courseId is required and must be a string');
  }
  if (!query || typeof query !== 'string') {
    throw new Error('query is required and must be a string');
  }

  // Verify course exists and belongs to tenant
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      tenantId: context.tenantId,
    },
  });

  if (!course) {
    throw new Error('Course not found or access denied');
  }

  // Search pages using ILIKE (case-insensitive pattern matching)
  const pages = await prisma.page.findMany({
    where: {
      courseId,
      bodyMarkdown: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      bodyMarkdown: true,
    },
    take: 3,
  });

  // Extract snippets around the match
  const results = pages.map((page) => {
    const lowerBody = page.bodyMarkdown.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerBody.indexOf(lowerQuery);

    let snippet = '';
    if (matchIndex >= 0) {
      // Extract ~100 chars before and after the match
      const start = Math.max(0, matchIndex - 100);
      const end = Math.min(page.bodyMarkdown.length, matchIndex + query.length + 100);
      snippet = page.bodyMarkdown.substring(start, end);

      // Add ellipsis if truncated
      if (start > 0) snippet = '...' + snippet;
      if (end < page.bodyMarkdown.length) snippet = snippet + '...';
    } else {
      // Fallback: just return first 200 chars
      snippet = page.bodyMarkdown.substring(0, 200);
      if (page.bodyMarkdown.length > 200) snippet += '...';
    }

    return {
      pageId: page.id,
      title: page.title,
      snippet,
    };
  });

  return results;
}

/**
 * Execute the generate_practice_questions tool
 */
async function executeGeneratePracticeQuestions(
  args: any,
  context: ToolExecutionContext
): Promise<any> {
  const { courseId, moduleId, questionCount = 5 } = args;

  // Validate arguments
  if (!courseId || typeof courseId !== 'string') {
    throw new Error('courseId is required and must be a string');
  }
  if (!moduleId || typeof moduleId !== 'string') {
    throw new Error('moduleId is required and must be a string');
  }
  if (typeof questionCount !== 'number' || questionCount < 1 || questionCount > 20) {
    throw new Error('questionCount must be a number between 1 and 20');
  }

  // Verify course exists and belongs to tenant
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      tenantId: context.tenantId,
    },
  });

  if (!course) {
    throw new Error('Course not found or access denied');
  }

  // Verify module exists and belongs to the course
  const module = await prisma.module.findFirst({
    where: {
      id: moduleId,
      courseId: courseId,
    },
    include: {
      pages: {
        select: {
          id: true,
          title: true,
          bodyMarkdown: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
  });

  if (!module) {
    throw new Error('Module not found or does not belong to the specified course');
  }

  if (!module.pages || module.pages.length === 0) {
    throw new Error('No pages found in this module');
  }

  // Build context from module and pages
  let contentContext = `Module: ${module.name}\n\n`;
  
  for (const page of module.pages) {
    contentContext += `Page Title: ${page.title}\n`;
    contentContext += `Content:\n${page.bodyMarkdown}\n\n`;
    contentContext += '---\n\n';
  }

  // Call LLM to generate practice questions
  const systemPrompt = `You are an assistant that generates practice questions for a course module.
Given the module content below, generate ${questionCount} question-answer pairs that help a student practice the material.
Return ONLY JSON of the form { "questions": [ { "prompt": "...", "answer": "..." }, ... ] }.
Make the questions specific, relevant, and educational. The answers should be clear and concise.`;

  const userMessage = contentContext;

  try {
    const response = await callChatModel({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Parse the response as JSON
    const content = response.content.trim();
    
    // Try to extract JSON from the response
    let jsonContent = content;
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.startsWith('```')) {
      jsonContent = content.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonContent);

    // Validate the structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('INVALID_TOOL_OUTPUT: Response must contain a questions array');
    }

    for (const q of parsed.questions) {
      if (!q.prompt || typeof q.prompt !== 'string') {
        throw new Error('INVALID_TOOL_OUTPUT: Each question must have a prompt string');
      }
      if (!q.answer || typeof q.answer !== 'string') {
        throw new Error('INVALID_TOOL_OUTPUT: Each question must have an answer string');
      }
    }

    return parsed;
  } catch (error: any) {
    if (error.message && error.message.startsWith('INVALID_TOOL_OUTPUT')) {
      throw error;
    }
    throw new Error(`Failed to generate practice questions: ${error.message}`);
  }
}

/**
 * Execute the summarize_module tool
 */
async function executeSummarizeModule(
  args: any,
  context: ToolExecutionContext
): Promise<any> {
  const { moduleId } = args;

  // Validate arguments
  if (!moduleId || typeof moduleId !== 'string') {
    throw new Error('moduleId is required and must be a string');
  }

  // Fetch the module with its course to verify tenant
  const module = await prisma.module.findFirst({
    where: {
      id: moduleId,
    },
    include: {
      course: {
        select: {
          id: true,
          tenantId: true,
          title: true,
        },
      },
      pages: {
        select: {
          id: true,
          title: true,
          bodyMarkdown: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
      assignments: {
        select: {
          id: true,
          name: true,
          description: true,
          dueAt: true,
        },
        orderBy: {
          dueAt: 'asc',
        },
      },
    },
  });

  if (!module) {
    throw new Error('Module not found');
  }

  // Verify module belongs to tenant
  if (module.course.tenantId !== context.tenantId) {
    throw new Error('Module not found or access denied');
  }

  // Verify user has CourseMembership on the module's course
  const membership = await prisma.courseMembership.findFirst({
    where: {
      courseId: module.course.id,
      userId: context.userId,
    },
  });

  if (!membership) {
    throw new Error('You must be enrolled in this course to access this module');
  }

  // Build text block with module content
  let textBlock = `Module: ${module.name}\nCourse: ${module.course.title}\n\n`;

  // Add pages
  if (module.pages && module.pages.length > 0) {
    textBlock += '=== PAGES ===\n\n';
    for (const page of module.pages) {
      textBlock += `Page Title: ${page.title}\n`;
      textBlock += `Content:\n${page.bodyMarkdown}\n\n`;
      textBlock += '---\n\n';
    }
  } else {
    textBlock += 'No pages in this module.\n\n';
  }

  // Add assignments
  if (module.assignments && module.assignments.length > 0) {
    textBlock += '=== ASSIGNMENTS ===\n\n';
    for (const assignment of module.assignments) {
      textBlock += `Assignment: ${assignment.name}\n`;
      textBlock += `Description: ${assignment.description}\n`;
      textBlock += `Due Date: ${assignment.dueAt.toISOString()}\n\n`;
      textBlock += '---\n\n';
    }
  } else {
    textBlock += 'No assignments in this module.\n\n';
  }

  // Call model to generate summary
  const systemPrompt = `You are an assistant summarizing a course module. Create a concise study guide covering the key points and assignments. Use clear paragraphs and bullet points where appropriate.`;

  try {
    const response = await callChatModel({
      systemPrompt,
      messages: [{ role: 'user', content: textBlock }],
    });

    return {
      summary: response.content.trim(),
    };
  } catch (error: any) {
    throw new Error(`Failed to generate module summary: ${error.message}`);
  }
}

