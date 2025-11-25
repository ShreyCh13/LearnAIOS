import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Export types for use in other packages
export type {
  Tenant,
  User,
  Course,
  Module,
  Page,
  CourseMembership,
  Assignment,
  CalendarEvent,
  Tool,
  Agent,
  AgentTool,
  AIConversation,
  AIConversationMessage,
} from '@prisma/client';
