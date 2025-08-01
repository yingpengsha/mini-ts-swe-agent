import chalk from 'chalk';
import { BaseMessage } from '@langchain/core/messages';
import { AgentState, LangGraphAgentConfig } from './types';
import { createAgentGraph } from './simple-graph';
import { Environment, Agent } from '../types';

/**
 * LangGraph 版本的 Agent 实现
 * 
 * 这个实现保持了原始 Agent 的核心逻辑，但使用 LangGraph 来管理状态和工作流程：
 * 1. 状态管理通过 LangGraph 的状态图处理
 * 2. 工具调用和响应通过节点处理
 * 3. 条件路由替代了原来的简单循环
 * 4. 保持相同的用户接口和行为
 */
export class LangGraphAgent implements Agent {
  private environment: Environment;
  private config: LangGraphAgentConfig;
  private graph: any; // 简化的工作流图

  constructor(environment: Environment, config: LangGraphAgentConfig = {}) {
    this.environment = environment;
    this.config = {
      maxIterations: config.maxIterations || 30,
      temperature: config.temperature || 0.7,
      verbose: config.verbose ?? true,
      model: config.model || 'gpt-4-turbo-preview',
    };
    
    // 创建并编译工作流图
    this.graph = createAgentGraph(environment, this.config);
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info') {
    if (!this.config.verbose) return;
    
    const prefix = {
      info: chalk.blue('ℹ'),
      error: chalk.red('✗'),
      success: chalk.green('✓'),
    }[type];
    
    console.log(`${prefix} ${message}`);
  }

  private logMessage(message: BaseMessage) {
    if (!this.config.verbose) return;
    
    const type = message._getType();
    const roleColorMap: Record<string, any> = {
      system: chalk.gray,
      human: chalk.cyan,
      ai: chalk.yellow,
    };
    const roleColor = roleColorMap[type] || chalk.white;
    
    console.log(`\n${roleColor(`[${type.toUpperCase()}]`)}`);
    
    if (typeof message.content === 'string') {
      console.log(message.content);
    } else {
      console.log(JSON.stringify(message.content, null, 2));
    }
    
    // 显示工具调用信息
    if (type === 'ai' && 'tool_calls' in message && message.tool_calls) {
      const toolCalls = message.tool_calls as any[];
      for (const toolCall of toolCalls) {
        console.log(chalk.blue(`🔧 Tool Call: ${toolCall.name}`));
        console.log(chalk.gray(`   Args: ${JSON.stringify(toolCall.args)}`));
      }
    }
  }

  async run(task: string): Promise<void> {
    this.log(`Starting task: ${task}`, 'info');
    
    // 初始化状态
    const initialState: AgentState = {
      messages: [],
      task,
      iterations: 0,
      maxIterations: this.config.maxIterations || 30,
      isComplete: false,
    };

    try {
      // 执行工作流
      let currentState = initialState;
      
      // 使用流式执行来获取中间状态
      const stream = await this.graph.stream(initialState);
      
      for await (const chunk of stream) {
        // chunk 包含每个节点的输出
        const nodeNames = Object.keys(chunk);
        for (const nodeName of nodeNames) {
          const nodeOutput = chunk[nodeName];
          currentState = nodeOutput;
          
          this.log(`Node: ${nodeName} (Iteration ${currentState.iterations})`, 'info');
          
          // 显示新消息
          if (nodeOutput.messages) {
            const newMessages = nodeOutput.messages.slice(currentState.messages.length - nodeOutput.messages.length);
            for (const message of newMessages) {
              this.logMessage(message);
            }
          }
          
          // 检查错误
          if (currentState.error) {
            this.log(`Error: ${currentState.error}`, 'error');
          }
          
          // 检查是否完成
          if (currentState.isComplete) {
            this.log('Task completed successfully!', 'success');
            return;
          }
          
          // 检查是否达到最大迭代次数
          if (currentState.iterations >= (this.config.maxIterations || 30)) {
            this.log('Maximum iterations reached', 'error');
            return;
          }
        }
      }
      
      // 如果到达这里，工作流已完成
      if (currentState.isComplete) {
        this.log('Task completed successfully!', 'success');
      } else if (currentState.error) {
        this.log(`Task failed: ${currentState.error}`, 'error');
      } else {
        this.log('Task execution completed', 'info');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Execution error: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * 获取最终状态（用于调试和测试）
   */
  async getState(task: string): Promise<AgentState> {
    const initialState: AgentState = {
      messages: [],
      task,
      iterations: 0,
      maxIterations: this.config.maxIterations || 30,
      isComplete: false,
    };

    const result = await this.graph.invoke(initialState);
    return result;
  }

  /**
   * 流式执行（返回中间状态）
   */
  async *runStream(task: string): AsyncGenerator<AgentState> {
    const initialState: AgentState = {
      messages: [],
      task,
      iterations: 0,
      maxIterations: this.config.maxIterations || 30,
      isComplete: false,
    };

    const stream = await this.graph.stream(initialState);
    
    for await (const chunk of stream) {
      const nodeNames = Object.keys(chunk);
      for (const nodeName of nodeNames) {
        yield chunk[nodeName];
      }
    }
  }
}