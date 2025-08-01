#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { LangGraphAgent } from './langgraph';
import { LocalEnvironment } from './environment';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

const program = new Command();

// Try to read package.json for version
let version = '0.1.0';
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  version = packageJson.version;
} catch {
  // Use default version if package.json cannot be read
}

program
  .name('mini-ts-swe-agent')
  .description('A minimal TypeScript implementation of an AI agent for solving software engineering tasks')
  .version(version);

program
  .command('run <task>')
  .description('Run the agent with a specific task')
  .option('-m, --model <model>', 'Model to use (default: gpt-4-turbo-preview)', 'gpt-4-turbo-preview')
  .option('--api-key <key>', 'API key (can also use OPENAI_API_KEY env var)')
  .option('--max-iterations <n>', 'Maximum iterations', parseInt, 30)
  .option('--no-verbose', 'Disable verbose output')
  .option('-d, --directory <dir>', 'Working directory', process.cwd())
  .action(async (task, options) => {
    try {
      console.log(chalk.blue('\n🤖 Mini TypeScript SWE Agent (LangGraph)\n'));

      // Check API key
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error(chalk.red('Error: API key is required. Set OPENAI_API_KEY or use --api-key'));
        process.exit(1);
      }

      // Initialize environment
      const environment = new LocalEnvironment(options.directory);

      // Create and run agent
      const agent = new LangGraphAgent(environment, {
        maxIterations: options.maxIterations,
        verbose: options.verbose,
        model: options.model,
      });

      await agent.run(task);
      
      console.log(chalk.green('\n✨ Task completed!\n'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n❌ Error: ${errorMessage}\n`));
      process.exit(1);
    }
  });

program
  .command('interactive')
  .description('Run the agent in interactive mode')
  .option('-m, --model <model>', 'Model to use', 'gpt-4-turbo-preview')
  .option('--api-key <key>', 'API key (can also use OPENAI_API_KEY env var)')
  .action(async (options) => {
    console.log(chalk.blue('\n🤖 Mini TypeScript SWE Agent - Interactive Mode (LangGraph)\n'));
    console.log(chalk.gray('Type your task and press Enter. Type "exit" to quit.\n'));

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('Task> '),
    });

    // Check API key
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error(chalk.red('Error: API key is required. Set OPENAI_API_KEY or use --api-key'));
      process.exit(1);
    }

    const environment = new LocalEnvironment(process.cwd());

    rl.prompt();

    rl.on('line', async (line: string) => {
      const task = line.trim();
      
      if (task.toLowerCase() === 'exit') {
        console.log(chalk.yellow('\nGoodbye! 👋\n'));
        process.exit(0);
      }

      if (task) {
        try {
          const agent = new LangGraphAgent(environment, {
            verbose: true,
            model: options.model,
          });
          await agent.run(task);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(chalk.red(`Error: ${errorMessage}`));
        }
      }

      rl.prompt();
    });
  });

// Export for programmatic use
export { LangGraphAgent as Agent } from './langgraph';
export { LocalEnvironment } from './environment';
export * from './types';
export * from './langgraph/types';

// Re-export tools
export { bashTool, editorTool } from './tools';

// Run CLI if called directly
if (require.main === module) {
  program.parse();
}