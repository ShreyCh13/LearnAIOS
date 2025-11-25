export interface AgentDefinition {
  name: string;
  description: string;
  defaultModel: string;
  contextPolicy: {
    maxContextTokens: number;
    retrievalTopK: number;
  };
  uiSurfaces?: string;
  targetRoles?: string;
}

// Hard-coded agent definitions for MVP
const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  content_helper: {
    name: 'content_helper',
    description:
      'Helps students and instructors understand course pages, answer questions using course content, generate practice questions, and summarize modules.',
    defaultModel: 'gpt-4-turbo',
    contextPolicy: {
      maxContextTokens: 8000,
      retrievalTopK: 3,
    },
    uiSurfaces: 'side_panel',
    targetRoles: 'student,instructor',
  },
};

/**
 * Get agent definition by name
 */
export function getAgentDefinition(name: string): AgentDefinition | null {
  return AGENT_DEFINITIONS[name] || null;
}

/**
 * List all available agent definitions
 */
export function listAgents(): AgentDefinition[] {
  return Object.values(AGENT_DEFINITIONS);
}

