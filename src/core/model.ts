import OpenAI from 'openai';
import { Model, Message, Tool, ModelResponse, ToolArguments } from '../types';

export class OpenAIModel implements Model {
  private client: OpenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gpt-4-turbo-preview') {
    this.client = new OpenAI({ apiKey });
    this.modelName = modelName;
  }

  async complete(
    messages: Message[],
    tools?: Tool[],
  ): Promise<ModelResponse> {
    const openAITools = tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema || {
          type: 'object',
          properties: {},
        },
      },
    }));

    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: openAITools,
      tool_choice: tools ? 'auto' : undefined,
      temperature: 0.7,
    });

    const message = completion.choices[0].message;
    const toolCalls = message.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments) as ToolArguments,
    }));

    return {
      content: message.content || '',
      toolCalls,
    };
  }
}

export class LiteLLMModel implements Model {
  private baseUrl: string;
  private apiKey: string;
  private modelName: string;

  constructor(baseUrl: string, apiKey: string, modelName: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async complete(
    messages: Message[],
    tools?: Tool[],
  ): Promise<ModelResponse> {
    const client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
    });

    const openAITools = tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema || {
          type: 'object',
          properties: {},
        },
      },
    }));

    const completion = await client.chat.completions.create({
      model: this.modelName,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: openAITools,
      tool_choice: tools ? 'auto' : undefined,
      temperature: 0.7,
    });

    const message = completion.choices[0].message;
    const toolCalls = message.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments) as ToolArguments,
    }));

    return {
      content: message.content || '',
      toolCalls,
    };
  }
}