import { BaseMessage } from '@langchain/core/messages';

// LangGraph 状态定义
export interface AgentState {
  messages: BaseMessage[];
  task: string;
  iterations: number;
  maxIterations: number;
  isComplete: boolean;
  lastToolResult?: string;
  error?: string;
}

// 节点输入输出类型
export interface NodeInput {
  state: AgentState;
}

export interface NodeOutput {
  messages?: BaseMessage[];
  isComplete?: boolean;
  lastToolResult?: string;
  error?: string;
  iterations?: number;
}

// 工具执行结果
export interface ToolExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
}

// LangGraph Agent 配置
export interface LangGraphAgentConfig {
  maxIterations?: number;
  temperature?: number;
  verbose?: boolean;
  model?: string;
}