import chalk from 'chalk';
import { Agent, AgentConfig, Environment, Message, Model, Tool } from '../types';
import { bashTool, editorTool } from '../tools';

export class DefaultAgent implements Agent {
  private model: Model;
  private environment: Environment;
  private config: AgentConfig;
  private tools: Tool[];
  private messages: Message[];

  constructor(model: Model, environment: Environment, config: AgentConfig = {}) {
    this.model = model;
    this.environment = environment;
    this.config = {
      maxIterations: config.maxIterations || 30,
      temperature: config.temperature || 0.7,
      verbose: config.verbose ?? true,
    };
    this.tools = [bashTool(environment), editorTool(environment)];
    this.messages = [];
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

  private addMessage(message: Message) {
    this.messages.push(message);
    if (this.config.verbose) {
      const roleColor = {
        system: chalk.gray,
        user: chalk.cyan,
        assistant: chalk.yellow,
      }[message.role];
      console.log(`\n${roleColor(`[${message.role.toUpperCase()}]`)}`);
      console.log(message.content);
    }
  }

  async run(task: string): Promise<void> {
    this.log(`Starting task: ${task}`, 'info');
    
    // System prompt
    this.addMessage({
      role: 'system',
      content: `You are a software engineering AI agent. Your task is to solve the given problem by:
1. Understanding the requirements
2. Writing code to implement the solution
3. Testing your implementation
4. Making corrections if needed

You have access to the following tools:
- bash: Execute shell commands
- editor: Read, write, and edit files

Work step by step and think carefully about each action.`,
    });

    // User task
    this.addMessage({
      role: 'user',
      content: task,
    });

    let iterations = 0;
    while (iterations < (this.config.maxIterations || 30)) {
      iterations++;
      this.log(`Iteration ${iterations}/${this.config.maxIterations || 30}`, 'info');

      try {
        // Get model response
        const response = await this.model.complete(this.messages, this.tools);
        
        if (response.content) {
          this.addMessage({
            role: 'assistant',
            content: response.content,
          });
        }

        // Handle tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            const tool = this.tools.find((t) => t.name === toolCall.name);
            if (!tool) {
              this.log(`Unknown tool: ${toolCall.name}`, 'error');
              continue;
            }

            this.log(`Executing tool: ${toolCall.name}`, 'info');
            try {
              const result = await tool.execute(toolCall.arguments);
              this.addMessage({
                role: 'user',
                content: `Tool ${toolCall.name} result:\n${result}`,
              });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.log(`Tool error: ${errorMessage}`, 'error');
              this.addMessage({
                role: 'user',
                content: `Tool ${toolCall.name} error: ${errorMessage}`,
              });
            }
          }
        } else {
          // No tool calls, check if task is complete
          if (response.content.toLowerCase().includes('task complete') || 
              response.content.toLowerCase().includes('done')) {
            this.log('Task completed successfully!', 'success');
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Error: ${errorMessage}`, 'error');
        this.addMessage({
          role: 'user',
          content: `Error occurred: ${errorMessage}. Please continue or try a different approach.`,
        });
      }
    }

    if (iterations >= (this.config.maxIterations || 30)) {
      this.log('Maximum iterations reached', 'error');
    }
  }
}