import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { AgentState, NodeInput, NodeOutput, ToolExecutionResult } from './types';
import { createLangChainTools } from './tools';
import { Environment } from '../types';

/**
 * 初始化节点 - 设置系统提示词和初始状态
 */
export function createInitializeNode() {
  return async (input: NodeInput): Promise<NodeOutput> => {
    const { state } = input;
    
    const systemPrompt = `You are a software engineering AI agent. Your task is to solve the given problem by:
1. Understanding the requirements
2. Writing code to implement the solution
3. Testing your implementation
4. Making corrections if needed

You have access to the following tools:
- bash: Execute shell commands
- editor: Read, write, and edit files

Work step by step and think carefully about each action.`;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(state.task),
    ];

    return {
      messages,
      iterations: 0,
      isComplete: false,
    };
  };
}

/**
 * 模型调用节点 - 调用 LLM 生成响应和工具调用
 */
export function createModelNode(model: ChatOpenAI, environment: Environment) {
  const tools = createLangChainTools(environment);
  
  return async (input: NodeInput): Promise<NodeOutput> => {
    const { state } = input;
    
    try {
      // 绑定工具到模型
      const modelWithTools = model.bindTools(tools);
      
      // 调用模型
      const response = await modelWithTools.invoke(state.messages);
      
      return {
        messages: [response],
        iterations: state.iterations + 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: `Model invocation failed: ${errorMessage}`,
        iterations: state.iterations + 1,
      };
    }
  };
}

/**
 * 工具执行节点 - 执行工具调用
 */
export function createToolNode(environment: Environment) {
  const tools = createLangChainTools(environment);
  const toolMap = new Map(tools.map(tool => [tool.name, tool]));
  
  return async (input: NodeInput): Promise<NodeOutput> => {
    const { state } = input;
    
    // 获取最后一条消息，应该是 AI 消息包含工具调用
    const lastMessage = state.messages[state.messages.length - 1];
    
    if (!lastMessage || lastMessage._getType() !== 'ai') {
      return {
        error: 'Expected AI message with tool calls',
      };
    }
    
    const aiMessage = lastMessage as AIMessage;
    const toolCalls = aiMessage.tool_calls;
    
    if (!toolCalls || toolCalls.length === 0) {
      return {
        error: 'No tool calls found in AI message',
      };
    }
    
    const toolResults: BaseMessage[] = [];
    let lastResult = '';
    
    // 执行所有工具调用
    for (const toolCall of toolCalls) {
      const tool = toolMap.get(toolCall.name);
      
      if (!tool) {
        const errorMsg = `Unknown tool: ${toolCall.name}`;
        toolResults.push(new HumanMessage(`Tool error: ${errorMsg}`));
        lastResult = errorMsg;
        continue;
      }
      
      try {
        const result = await (tool as any).invoke(toolCall.args);
        const resultMsg = `Tool ${toolCall.name} result:\n${result}`;
        toolResults.push(new HumanMessage(resultMsg));
        lastResult = result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorMsg = `Tool ${toolCall.name} error: ${errorMessage}`;
        toolResults.push(new HumanMessage(errorMsg));
        lastResult = errorMsg;
      }
    }
    
    return {
      messages: toolResults,
      lastToolResult: lastResult,
    };
  };
}

/**
 * 完成检查节点 - 检查任务是否完成
 */
export function createCompletionCheckNode() {
  return async (input: NodeInput): Promise<NodeOutput> => {
    const { state } = input;
    
    // 获取最后的 AI 响应
    const lastAIMessage = state.messages
      .slice()
      .reverse()
      .find(msg => msg._getType() === 'ai') as AIMessage;
    
    if (!lastAIMessage) {
      return { isComplete: false };
    }
    
    const content = lastAIMessage.content as string;
    const isComplete = 
      content.toLowerCase().includes('task complete') ||
      content.toLowerCase().includes('done') ||
      content.toLowerCase().includes('finished') ||
      content.toLowerCase().includes('completed');
    
    return { isComplete };
  };
}

/**
 * 路由节点 - 决定下一步行动
 */
export function createRouterNode() {
  return async (input: NodeInput): Promise<string> => {
    const { state } = input;
    
    // 检查是否达到最大迭代次数
    if (state.iterations >= state.maxIterations) {
      return 'end';
    }
    
    // 检查是否有错误
    if (state.error) {
      return 'end';
    }
    
    // 检查是否完成
    if (state.isComplete) {
      return 'end';
    }
    
    // 获取最后一条消息
    const lastMessage = state.messages[state.messages.length - 1];
    
    if (!lastMessage) {
      return 'model';
    }
    
    // 如果最后一条消息是 AI 消息且包含工具调用
    if (lastMessage._getType() === 'ai') {
      const aiMessage = lastMessage as AIMessage;
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        return 'tools';
      }
    }
    
    // 默认继续到模型节点
    return 'model';
  };
}

/**
 * 状态更新辅助函数
 */
export function mergeStates(currentState: AgentState, update: NodeOutput): AgentState {
  return {
    ...currentState,
    messages: update.messages ? [...currentState.messages, ...update.messages] : currentState.messages,
    iterations: update.iterations ?? currentState.iterations,
    isComplete: update.isComplete ?? currentState.isComplete,
    lastToolResult: update.lastToolResult ?? currentState.lastToolResult,
    error: update.error ?? currentState.error,
  };
}