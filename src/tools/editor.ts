import { Environment, Tool, ToolArguments } from '../types';
import { dirname } from 'path';
import { promises as fs } from 'fs';

export function editorTool(environment: Environment): Tool {
  return {
    name: 'editor',
    description: 'Read, write, and edit files',
    schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['view', 'create', 'str_replace'],
          description: 'The editor command to execute',
        },
        path: {
          type: 'string',
          description: 'The file path',
        },
        content: {
          type: 'string',
          description: 'Content for create command',
        },
        old_str: {
          type: 'string',
          description: 'String to replace (for str_replace)',
        },
        new_str: {
          type: 'string',
          description: 'Replacement string (for str_replace)',
        },
      },
      required: ['command', 'path'],
    },
    async execute(args: ToolArguments): Promise<string> {
      const command = String(args.command);
      const path = args.path ? String(args.path) : '';
      const content = args.content ? String(args.content) : '';
      const old_str = args.old_str ? String(args.old_str) : '';
      const new_str = args.new_str ? String(args.new_str) : '';

      switch (command) {
        case 'view': {
          try {
            const fileContent = await environment.readFile(path);
            const lines = fileContent.split('\n');
            const numberedLines = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
            return `File: ${path}\n${numberedLines}`;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error reading file: ${errorMessage}`;
          }
        }

        case 'create': {
          if (!content) {
            throw new Error('Content is required for create command');
          }
          try {
            // Ensure directory exists
            const dir = dirname(path);
            if (dir && dir !== '.') {
              await fs.mkdir(dir, { recursive: true });
            }
            await environment.writeFile(path, content);
            return `File created: ${path}`;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error creating file: ${errorMessage}`;
          }
        }

        case 'str_replace': {
          if (!old_str || !new_str) {
            throw new Error('old_str and new_str are required for str_replace command');
          }
          try {
            const fileContent = await environment.readFile(path);
            if (!fileContent.includes(old_str)) {
              return `Error: old_str not found in ${path}`;
            }
            const newContent = fileContent.replace(old_str, new_str);
            await environment.writeFile(path, newContent);
            const occurrences = (fileContent.match(new RegExp(old_str, 'g')) || []).length;
            return `Replaced ${occurrences} occurrence(s) in ${path}`;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error editing file: ${errorMessage}`;
          }
        }

        default:
          return `Unknown command: ${command}`;
      }
    },
  };
}