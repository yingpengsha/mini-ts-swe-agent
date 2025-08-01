import { Environment, Tool, ToolArguments } from '../types';

export function bashTool(environment: Environment): Tool {
  return {
    name: 'bash',
    description: 'Execute a bash command in the environment',
    schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
      },
      required: ['command'],
    },
    async execute(args: ToolArguments): Promise<string> {
      const { command } = args;
      if (!command) {
        throw new Error('Command is required');
      }

      const result = await environment.execute(String(command));
      let output = '';
      
      if (result.stdout) {
        output += result.stdout;
      }
      
      if (result.stderr) {
        output += `\nSTDERR:\n${result.stderr}`;
      }
      
      if (result.exitCode !== 0) {
        output += `\nExit code: ${result.exitCode}`;
      }
      
      return output || 'Command executed successfully with no output';
    },
  };
}