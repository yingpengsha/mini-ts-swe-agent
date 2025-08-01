export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Tool function parameters should be compatible with OpenAI's schema
export type JsonSchema = Record<string, unknown>;

export interface ToolArguments {
  [key: string]: string | number | boolean | undefined;
}

export interface Tool {
  name: string;
  description: string;
  schema?: JsonSchema;
  execute: (args: ToolArguments) => Promise<string>;
}

export interface Environment {
  execute(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: ToolArguments;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
}

export interface Model {
  complete(messages: Message[], tools?: Tool[]): Promise<ModelResponse>;
}

export interface Agent {
  run(task: string): Promise<void>;
}

export interface AgentConfig {
  maxIterations?: number;
  temperature?: number;
  verbose?: boolean;
}