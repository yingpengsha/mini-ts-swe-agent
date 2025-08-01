import { ChatOpenAI } from '@langchain/openai';
import { AgentState, LangGraphAgentConfig } from './types';
import { 
  createInitializeNode,
  createModelNode,
  createToolNode,
  createCompletionCheckNode,
  createRouterNode,
  mergeStates
} from './nodes';
import { Environment } from '../types';

/**
 * 简化版本的工作流执行器
 * 保持 LangGraph 的概念但不依赖复杂的库 API
 */
export class SimpleWorkflowGraph {
  private environment: Environment;
  private config: LangGraphAgentConfig;
  private model: ChatOpenAI;
  private nodes: Map<string, (state: AgentState) => Promise<AgentState>>;

  constructor(environment: Environment, config: LangGraphAgentConfig = {}) {
    this.environment = environment;
    this.config = config;
    this.model = new ChatOpenAI({
      modelName: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
    });

    // 初始化节点
    this.nodes = new Map();
    this.setupNodes();
  }

  private setupNodes() {
    const initializeNode = createInitializeNode();
    const modelNode = createModelNode(this.model, this.environment);
    const toolNode = createToolNode(this.environment);
    const completionCheckNode = createCompletionCheckNode();
    const routerNode = createRouterNode();

    // 包装节点以返回完整状态
    this.nodes.set('initialize', async (state: AgentState) => {
      const result = await initializeNode({ state });
      return mergeStates(state, result);
    });

    this.nodes.set('model', async (state: AgentState) => {
      const result = await modelNode({ state });
      return mergeStates(state, result);
    });

    this.nodes.set('tools', async (state: AgentState) => {
      const result = await toolNode({ state });
      return mergeStates(state, result);
    });

    this.nodes.set('completion_check', async (state: AgentState) => {
      const result = await completionCheckNode({ state });
      return mergeStates(state, result);
    });

    this.nodes.set('router', async (state: AgentState) => {
      const nextNode = await routerNode({ state });
      return { ...state, _nextNode: nextNode } as AgentState & { _nextNode: string };
    });
  }

  async invoke(initialState: AgentState): Promise<AgentState> {
    let currentState = initialState;
    let currentNode = 'initialize';

    while (currentNode !== 'end') {
      const nodeFunction = this.nodes.get(currentNode);
      if (!nodeFunction) {
        throw new Error(`Unknown node: ${currentNode}`);
      }

      // 执行节点
      currentState = await nodeFunction(currentState);

      // 决定下一个节点
      currentNode = await this.getNextNode(currentNode, currentState);

      // 防止无限循环
      if (currentState.iterations >= currentState.maxIterations) {
        break;
      }

      if (currentState.error) {
        break;
      }

      if (currentState.isComplete) {
        break;
      }
    }

    return currentState;
  }

  async *stream(initialState: AgentState): AsyncGenerator<Record<string, AgentState>> {
    let currentState = initialState;
    let currentNode = 'initialize';

    while (currentNode !== 'end') {
      const nodeFunction = this.nodes.get(currentNode);
      if (!nodeFunction) {
        throw new Error(`Unknown node: ${currentNode}`);
      }

      // 执行节点
      currentState = await nodeFunction(currentState);

      // 产出当前状态
      yield { [currentNode]: currentState };

      // 决定下一个节点
      currentNode = await this.getNextNode(currentNode, currentState);

      // 防止无限循环
      if (currentState.iterations >= currentState.maxIterations) {
        break;
      }

      if (currentState.error) {
        break;
      }

      if (currentState.isComplete) {
        break;
      }
    }
  }

  private async getNextNode(currentNode: string, state: AgentState): Promise<string> {
    switch (currentNode) {
      case 'initialize':
        return 'model';

      case 'model':
        // 使用路由节点决定
        const routerState = await this.nodes.get('router')!(state);
        return (routerState as any)._nextNode;

      case 'tools':
        return 'completion_check';

      case 'completion_check':
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
        
        // 继续执行
        return 'model';

      default:
        return 'end';
    }
  }
}

/**
 * 创建简化的工作流图
 */
export function createAgentGraph(
  environment: Environment,
  config: LangGraphAgentConfig = {}
): SimpleWorkflowGraph {
  return new SimpleWorkflowGraph(environment, config);
}

/**
 * 工作流程图的可视化表示
 */
export const WORKFLOW_DESCRIPTION = `
LangGraph Agent 工作流程 (简化版本)：

START
  ↓
initialize (设置系统提示词和初始状态)
  ↓
model (调用 LLM 生成响应)
  ↓
[路由决策]
  ├─ 有工具调用 → tools (执行工具)
  ├─ 无工具调用 → completion_check
  └─ 错误/超限 → END
  
tools (执行工具调用)
  ↓
completion_check (检查任务完成状态)
  ↓
[条件路由]
  ├─ 未完成且未超限 → model (继续循环)
  └─ 完成/超限/错误 → END

核心改进：
- 状态化的工作流管理
- 明确的节点职责分离
- 支持流式执行
- 错误恢复和状态追踪
- 保持与原始 Agent 相同的行为
`;