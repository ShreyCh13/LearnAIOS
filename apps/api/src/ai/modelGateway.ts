import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set; AI features will not work.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface ChatToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ChatToolCall[];
  modelVersion: string;
}

export async function callChatModel(params: {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  tools?: any[]; // JSON schema definitions for tools
}): Promise<ChatResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const { systemPrompt, messages, tools } = params;

  // Build messages array with system prompt first
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  // Prepare OpenAI chat completion request
  const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: 'gpt-4-turbo',
    messages: apiMessages,
    temperature: 0.7,
    max_tokens: 2000,
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestParams.tools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
    requestParams.tool_choice = 'auto';
  }

  // Call OpenAI API
  const response = await openai.chat.completions.create(requestParams);

  const choice = response.choices[0];
  const message = choice.message;

  // Extract content and tool calls
  const content = message.content || '';
  const toolCalls: ChatToolCall[] = [];

  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const tc of message.tool_calls) {
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      });
    }
  }

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    modelVersion: response.model,
  };
}


