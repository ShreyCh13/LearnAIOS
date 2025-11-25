import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create Tenant (idempotent)
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Organization',
        slug: 'demo',
      },
    });
    console.log('✓ Created tenant:', tenant.name);
  } else {
    console.log('✓ Tenant already exists:', tenant.name);
  }

  // Create Users (idempotent)
  let instructor = await prisma.user.findUnique({
    where: { email: 'instructor@example.com' },
  });

  if (!instructor) {
    instructor = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'instructor@example.com',
        name: 'Jane Instructor',
        role: 'instructor',
      },
    });
    console.log('✓ Created instructor user:', instructor.email);
  } else {
    console.log('✓ Instructor user already exists:', instructor.email);
  }

  let student = await prisma.user.findUnique({
    where: { email: 'student@example.com' },
  });

  if (!student) {
    student = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'student@example.com',
        name: 'John Student',
        role: 'student',
      },
    });
    console.log('✓ Created student user:', student.email);
  } else {
    console.log('✓ Student user already exists:', student.email);
  }

  // Create Course with Modules and Pages (idempotent)
  let course = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      title: 'Introduction to AI-Powered Learning',
    },
    include: {
      modules: {
        include: {
          pages: true,
        },
      },
    },
  });

  if (!course) {
    // First create course and modules without pages
    course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: 'Introduction to AI-Powered Learning',
        description: 'Learn how AI can enhance your learning experience with personalized assistance and intelligent content navigation.',
        modules: {
          create: [
            {
              name: 'Getting Started',
              position: 1,
            },
            {
              name: 'AI Fundamentals',
              position: 2,
            },
          ],
        },
      },
      include: {
        modules: {
          include: {
            pages: true,
          },
        },
      },
    });

    // Now create pages with proper courseId and moduleId
    const module1 = course.modules.find((m) => m.position === 1)!;
    const module2 = course.modules.find((m) => m.position === 2)!;

    await prisma.page.createMany({
      data: [
        {
          courseId: course.id,
          moduleId: module1.id,
          title: 'Welcome to the Course',
          bodyMarkdown: `# Welcome!

Welcome to **Introduction to AI-Powered Learning**. This course will help you understand how AI can transform the learning experience.

## What You'll Learn

- How to use AI assistants effectively
- Personalized learning strategies
- Interactive content exploration

Let's get started!`,
        },
        {
          courseId: course.id,
          moduleId: module1.id,
          title: 'Course Overview',
          bodyMarkdown: `# Course Overview

This course is structured into modules, each covering important aspects of AI-powered learning.

## Course Structure

1. **Getting Started** - Introduction and setup
2. **AI Fundamentals** - Core concepts and tools

Each module contains multiple pages with rich content and interactive elements.`,
        },
        {
          courseId: course.id,
          moduleId: module1.id,
          title: 'How to Use the AI Assistant',
          bodyMarkdown: `# Using the AI Assistant

Our intelligent assistant is available throughout the course to help you learn more effectively.

## Key Features

- **Content Search**: Quickly find information across all course materials
- **Question Answering**: Get instant answers to your questions
- **Personalized Recommendations**: Receive suggestions based on your progress

Try asking the assistant a question about the course content!`,
        },
        {
          courseId: course.id,
          moduleId: module2.id,
          title: 'What is AI?',
          bodyMarkdown: `# What is Artificial Intelligence?

Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence.

## Core Concepts

- **Machine Learning**: Systems that learn from data
- **Natural Language Processing**: Understanding human language
- **Neural Networks**: Brain-inspired computing models

These technologies power the AI assistant you're using right now!`,
        },
        {
          courseId: course.id,
          moduleId: module2.id,
          title: 'AI in Education',
          bodyMarkdown: `# AI in Education

AI is revolutionizing how we learn and teach.

## Benefits

- **Personalization**: Adapt to individual learning styles
- **24/7 Availability**: Get help whenever you need it
- **Instant Feedback**: Receive immediate responses to questions
- **Scale**: Support unlimited learners simultaneously

The future of education is adaptive, intelligent, and personalized.`,
        },
        {
          courseId: course.id,
          moduleId: module2.id,
          title: 'Best Practices',
          bodyMarkdown: `# Best Practices for AI-Assisted Learning

Maximize your learning with these tips:

## Tips for Success

1. **Ask Specific Questions**: The more specific, the better the AI can help
2. **Iterate**: Refine your questions based on responses
3. **Verify Information**: Cross-reference important facts
4. **Use Context**: Reference specific course materials in your questions

Remember: AI is a tool to enhance learning, not replace critical thinking!`,
        },
      ],
    });

    // Reload course with pages
    const reloadedCourse = await prisma.course.findFirst({
      where: { id: course.id },
      include: {
        modules: {
          include: {
            pages: true,
          },
        },
      },
    });
    if (reloadedCourse) {
      course = reloadedCourse;
    }

    console.log('✓ Created course with modules and pages:', course.title);
    console.log(`  - ${course.modules.length} modules created`);
    console.log(`  - ${course.modules.reduce((acc, m) => acc + m.pages.length, 0)} pages created`);
  } else {
    console.log('✓ Course already exists:', course.title);
  }

  // Ensure course is not null for the rest of the seed
  if (!course) {
    throw new Error('Course creation or retrieval failed');
  }

  // Create Course Memberships (idempotent)
  const instructorMembership = await prisma.courseMembership.findUnique({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: instructor.id,
      },
    },
  });

  if (!instructorMembership) {
    await prisma.courseMembership.create({
      data: {
        courseId: course.id,
        userId: instructor.id,
        role: 'instructor',
      },
    });
    console.log('✓ Created instructor membership for:', instructor.email);
  } else {
    console.log('✓ Instructor membership already exists');
  }

  const studentMembership = await prisma.courseMembership.findUnique({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: student.id,
      },
    },
  });

  if (!studentMembership) {
    await prisma.courseMembership.create({
      data: {
        courseId: course.id,
        userId: student.id,
        role: 'student',
      },
    });
    console.log('✓ Created student membership for:', student.email);
  } else {
    console.log('✓ Student membership already exists');
  }

  // Create Assignments (idempotent)
  const module1 = course.modules.find((m) => m.position === 1);
  const module2 = course.modules.find((m) => m.position === 2);

  let assignment1 = await prisma.assignment.findFirst({
    where: {
      courseId: course.id,
      name: 'Getting Started Quiz',
    },
  });

  if (!assignment1 && module1) {
    // Due date 7 days from now
    const dueDate1 = new Date();
    dueDate1.setDate(dueDate1.getDate() + 7);

    assignment1 = await prisma.assignment.create({
      data: {
        courseId: course.id,
        moduleId: module1.id,
        name: 'Getting Started Quiz',
        description: 'Complete this quiz to test your understanding of the course introduction and AI assistant features.',
        dueAt: dueDate1,
        points: 100,
      },
    });
    console.log('✓ Created assignment:', assignment1.name);
  } else {
    console.log('✓ Assignment "Getting Started Quiz" already exists');
  }

  let assignment2 = await prisma.assignment.findFirst({
    where: {
      courseId: course.id,
      name: 'AI Fundamentals Assignment',
    },
  });

  if (!assignment2 && module2) {
    // Due date 14 days from now
    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() + 14);

    assignment2 = await prisma.assignment.create({
      data: {
        courseId: course.id,
        moduleId: module2.id,
        name: 'AI Fundamentals Assignment',
        description: 'Write a short essay describing how AI can be applied in educational settings. Include at least three practical examples.',
        dueAt: dueDate2,
        points: 150,
      },
    });
    console.log('✓ Created assignment:', assignment2.name);
  } else {
    console.log('✓ Assignment "AI Fundamentals Assignment" already exists');
  }

  // Create Calendar Events (idempotent)
  if (assignment1) {
    const event1 = await prisma.calendarEvent.findFirst({
      where: {
        courseId: course.id,
        assignmentId: assignment1.id,
      },
    });

    if (!event1) {
      await prisma.calendarEvent.create({
        data: {
          courseId: course.id,
          title: assignment1.name,
          description: assignment1.description,
          startAt: assignment1.dueAt,
          endAt: assignment1.dueAt,
          assignmentId: assignment1.id,
        },
      });
      console.log('✓ Created calendar event for assignment:', assignment1.name);
    } else {
      console.log('✓ Calendar event for "Getting Started Quiz" already exists');
    }
  }

  if (assignment2) {
    const event2 = await prisma.calendarEvent.findFirst({
      where: {
        courseId: course.id,
        assignmentId: assignment2.id,
      },
    });

    if (!event2) {
      await prisma.calendarEvent.create({
        data: {
          courseId: course.id,
          title: assignment2.name,
          description: assignment2.description,
          startAt: assignment2.dueAt,
          endAt: assignment2.dueAt,
          assignmentId: assignment2.id,
        },
      });
      console.log('✓ Created calendar event for assignment:', assignment2.name);
    } else {
      console.log('✓ Calendar event for "AI Fundamentals Assignment" already exists');
    }
  }

  // Create standalone calendar event (idempotent)
  const webinarEvent = await prisma.calendarEvent.findFirst({
    where: {
      courseId: course.id,
      title: 'Welcome Webinar',
    },
  });

  if (!webinarEvent) {
    // Event scheduled for 3 days from now, 1 hour duration
    const webinarStart = new Date();
    webinarStart.setDate(webinarStart.getDate() + 3);
    webinarStart.setHours(14, 0, 0, 0); // 2 PM

    const webinarEnd = new Date(webinarStart);
    webinarEnd.setHours(15, 0, 0, 0); // 3 PM

    await prisma.calendarEvent.create({
      data: {
        courseId: course.id,
        title: 'Welcome Webinar',
        description: 'Join us for an interactive orientation session where we\'ll introduce the course, demonstrate the AI assistant, and answer your questions live!',
        startAt: webinarStart,
        endAt: webinarEnd,
        assignmentId: null,
      },
    });
    console.log('✓ Created standalone calendar event: Welcome Webinar');
  } else {
    console.log('✓ Calendar event "Welcome Webinar" already exists');
  }

  // Create Tools (idempotent)
  let searchTool = await prisma.tool.findUnique({
    where: { name: 'search_course_content' },
  });

  if (!searchTool) {
    searchTool = await prisma.tool.create({
      data: {
        name: 'search_course_content',
        displayName: 'Search Course Content',
        description: 'Semantic search across all course materials including pages, modules, and course descriptions. Returns relevant content snippets with context.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query from the user',
            },
            courseId: {
              type: 'string',
              description: 'Optional course ID to limit search scope',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5,
            },
          },
          required: ['query'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pageId: { type: 'string' },
                  title: { type: 'string' },
                  snippet: { type: 'string' },
                  relevanceScore: { type: 'number' },
                },
              },
            },
          },
        },
        implementationRef: 'lms-core:/tools/search_course_content',
        permissionsRequired: 'read:courses,read:pages',
        contextTypes: 'course_page,module_page,dashboard',
        latencyClass: 'async',
        version: '1.0.0',
      },
    });
    console.log('✓ Created tool:', searchTool.displayName);
  } else {
    console.log('✓ Tool already exists:', searchTool.displayName);
  }

  let summarizeModuleTool = await prisma.tool.findUnique({
    where: { name: 'summarize_module' },
  });

  if (!summarizeModuleTool) {
    summarizeModuleTool = await prisma.tool.create({
      data: {
        name: 'summarize_module',
        displayName: 'Summarize Module',
        description: 'Generate a comprehensive study guide summarizing all content in a module.',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: {
              type: 'string',
              description: 'The ID of the course',
            },
            moduleId: {
              type: 'string',
              description: 'The ID of the module to summarize',
            },
          },
          required: ['courseId', 'moduleId'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Comprehensive summary of the module content',
            },
            keyPoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of key takeaways',
            },
          },
          required: ['summary'],
        },
        implementationRef: 'lms-core:/tools/summarize_module',
        permissionsRequired: 'read:courses,read:pages',
        contextTypes: 'course_page,module_page',
        latencyClass: 'async',
        version: '1.0.0',
      },
    });
    console.log('✓ Created tool:', summarizeModuleTool.displayName);
  } else {
    console.log('✓ Tool already exists:', summarizeModuleTool.displayName);
  }

  let generateQuestionsTool = await prisma.tool.findUnique({
    where: { name: 'generate_practice_questions' },
  });

  if (!generateQuestionsTool) {
    generateQuestionsTool = await prisma.tool.create({
      data: {
        name: 'generate_practice_questions',
        displayName: 'Generate Practice Questions',
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
        implementationRef: 'lms-core:/tools/generate_practice_questions',
        permissionsRequired: 'instructor',
        contextTypes: 'course_page,module_page',
        latencyClass: 'sync',
        version: '1.0.0',
      },
    });
    console.log('✓ Created tool:', generateQuestionsTool.displayName);
  } else {
    console.log('✓ Tool already exists:', generateQuestionsTool.displayName);
  }

  // Create Agent (idempotent)
  let agent = await prisma.agent.findUnique({
    where: { name: 'content_helper' },
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        name: 'content_helper',
        description: 'An intelligent assistant that helps students and instructors navigate course content, answer questions, and provide contextual guidance throughout the learning experience.',
        defaultModel: 'gpt-4-turbo',
        contextPolicy: {
          maxTokens: 8000,
          includeUserHistory: true,
          includeCourseContext: true,
          contextWindow: 'sliding',
          prioritizeRecent: true,
        },
        uiSurfaces: 'side_panel,command_palette,inline_chat',
        targetRoles: 'student,instructor',
      },
    });
    console.log('✓ Created agent:', agent.name);
  } else {
    console.log('✓ Agent already exists:', agent.name);
  }

  // Link Agent and Tools (idempotent)
  const existingSearchLink = await prisma.agentTool.findUnique({
    where: {
      agentId_toolId: {
        agentId: agent.id,
        toolId: searchTool.id,
      },
    },
  });

  if (!existingSearchLink) {
    await prisma.agentTool.create({
      data: {
        agentId: agent.id,
        toolId: searchTool.id,
      },
    });
    console.log('✓ Linked agent and search_course_content tool');
  } else {
    console.log('✓ Agent-search_course_content link already exists');
  }

  const existingQuestionsLink = await prisma.agentTool.findUnique({
    where: {
      agentId_toolId: {
        agentId: agent.id,
        toolId: generateQuestionsTool.id,
      },
    },
  });

  if (!existingQuestionsLink) {
    await prisma.agentTool.create({
      data: {
        agentId: agent.id,
        toolId: generateQuestionsTool.id,
      },
    });
    console.log('✓ Linked agent and generate_practice_questions tool');
  } else {
    console.log('✓ Agent-generate_practice_questions link already exists');
  }

  const existingSummarizeLink = await prisma.agentTool.findUnique({
    where: {
      agentId_toolId: {
        agentId: agent.id,
        toolId: summarizeModuleTool.id,
      },
    },
  });

  if (!existingSummarizeLink) {
    await prisma.agentTool.create({
      data: {
        agentId: agent.id,
        toolId: summarizeModuleTool.id,
      },
    });
    console.log('✓ Linked agent and summarize_module tool');
  } else {
    console.log('✓ Agent-summarize_module link already exists');
  }

  console.log('\n🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

