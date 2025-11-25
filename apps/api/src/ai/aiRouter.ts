import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '@lms/db';
import { getAgentDefinition, listAgents } from './agentRegistry';
import { buildContext } from './contextBuilder';
import { callChatModel } from './modelGateway';
import { getToolDefinitionsForAgent, executeTool, listTools, getContextualTools } from './toolRegistry';

const router = Router();

/**
 * POST /ai/chat
 * Main chat endpoint for AI agents
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { agentName, message, courseId, pageId, moduleId, conversationId } = req.body;
    const user = req.user!;

    // Validate request
    if (!agentName || typeof agentName !== 'string') {
      res.status(400).json({ error: 'agentName is required' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    // Resolve agent definition
    const agentDef = getAgentDefinition(agentName);
    if (!agentDef) {
      res.status(400).json({ error: `Unknown agent: ${agentName}` });
      return;
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      // Fetch existing conversation
      conversation = await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          userId: user.userId,
        },
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
    } else {
      // Create new conversation
      // First, ensure agent exists in DB (or use a placeholder agentId)
      // For MVP, we'll use agentName as agentId (in real system, we'd look up the Agent record)
      let agent = await prisma.agent.findFirst({
        where: { name: agentName },
      });

      if (!agent) {
        // Create agent record if it doesn't exist
        agent = await prisma.agent.create({
          data: {
            name: agentName,
            description: agentDef.description,
            defaultModel: agentDef.defaultModel,
            contextPolicy: agentDef.contextPolicy,
            uiSurfaces: 'side_panel',
            targetRoles: 'student,instructor',
          },
        });
      }

      conversation = await prisma.aIConversation.create({
        data: {
          userId: user.userId,
          agentId: agent.id,
          modelVersion: agentDef.defaultModel,
          contextSnapshot: {
            courseId,
            pageId,
            moduleId,
          },
        },
      });
    }

    // Fetch conversation history (last 10 messages)
    const historyMessages = await prisma.aIMessage.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });

    // Build context
    const { systemPrompt, contextText } = await buildContext({
      userId: user.userId,
      tenantId: user.tenantId,
      agentName,
      courseId,
      pageId,
      moduleId,
      userQuestion: message,
    });

    // Build messages array for chat model
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Add conversation history
    for (const msg of historyMessages) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Get tool definitions
    const toolDefs = getToolDefinitionsForAgent(agentName);
    const tools = toolDefs.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));

    // Call chat model
    let response = await callChatModel({
      systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    let assistantContent = response.content;
    const toolCallsSummary: any[] = [];

    // Handle tool calls (if any)
    if (response.toolCalls && response.toolCalls.length > 0) {
      // MVP: Execute only the first tool call to avoid complexity
      // In a production system, we would handle multiple tool calls or iterative tool use
      const toolCall = response.toolCalls[0];

      try {
        // Execute the tool with user context including role for permission checks
        const toolResult = await executeTool(toolCall.name, toolCall.arguments, {
          userId: user.userId,
          tenantId: user.tenantId,
          role: user.role,
        });

        // Add tool call summary
        toolCallsSummary.push({
          name: toolCall.name,
          arguments: toolCall.arguments,
          result: toolResult,
        });

        // Append tool result to messages and call model again
        messages.push({
          role: 'assistant',
          content: `[Tool call: ${toolCall.name}]`,
        });

        messages.push({
          role: 'user',
          content: `Tool result: ${JSON.stringify(toolResult)}`,
        });

        // Call model again without tools to get final answer
        const finalResponse = await callChatModel({
          systemPrompt,
          messages,
          tools: undefined, // No tools in second call to avoid recursion
        });

        assistantContent = finalResponse.content;
        response.modelVersion = finalResponse.modelVersion;
      } catch (toolError: any) {
        console.error('Tool execution error:', toolError);
        assistantContent = `I encountered an error while using a tool: ${toolError.message}`;
      }
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'user',
        content: message,
      },
    });

    // Save assistant message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'agent',
        content: assistantContent,
      },
    });

    // Update conversation with model version
    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { modelVersion: response.modelVersion },
    });

    // Log AI usage for observability
    console.log(JSON.stringify({
      event: 'ai_chat',
      userId: user.userId,
      tenantId: user.tenantId,
      agentName,
      conversationId: conversation.id,
      usedTool: toolCallsSummary.length > 0,
      modelVersion: response.modelVersion,
      timestamp: new Date().toISOString(),
    }));

    // Return response
    res.json({
      conversationId: conversation.id,
      reply: assistantContent,
      toolCalls: toolCallsSummary.length > 0 ? toolCallsSummary : undefined,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /ai/agents
 * List all available AI agents
 */
router.get('/agents', requireAuth, async (req, res) => {
  try {
    const agents = listAgents();

    // Return only client-safe fields
    const clientAgents = agents.map((agent) => ({
      name: agent.name,
      description: agent.description,
      uiSurfaces: agent.uiSurfaces || '',
      targetRoles: agent.targetRoles || '',
    }));

    res.json({ agents: clientAgents });
  } catch (error: any) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /ai/tools
 * List available tools with optional filtering by agent and context type
 */
router.get('/tools', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { agentName, contextType } = req.query;

    let tools;

    if (agentName && typeof agentName === 'string') {
      // Get contextual tools for the specified agent
      tools = getContextualTools({
        agentName,
        role: user.role,
        contextType: typeof contextType === 'string' ? contextType : undefined,
      });
    } else {
      // Return all tools filtered by user role
      const allTools = listTools();
      tools = allTools.filter((tool) => {
        const allowedRoles = tool.permissionsRequired
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        return allowedRoles.length === 0 || allowedRoles.includes(user.role);
      });
    }

    // Return only client-safe fields
    const clientTools = tools.map((tool) => ({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      contextTypes: tool.contextTypes,
      latencyClass: tool.latencyClass,
    }));

    res.json({ tools: clientTools });
  } catch (error: any) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

