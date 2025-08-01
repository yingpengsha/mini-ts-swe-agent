import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Environment, Tool as CustomTool } from '../types';
import { bashTool, editorTool } from '../tools';

// 将自定义工具转换为 LangChain 工具
class CustomToolAdapter extends StructuredTool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  private customTool: CustomTool;

  constructor(customTool: CustomTool) {
    super();
    this.name = customTool.name;
    this.description = customTool.description;
    this.customTool = customTool;
    
    // 根据自定义工具的 schema 创建 zod schema
    this.schema = this.createZodSchema(customTool.schema);
  }

  private createZodSchema(schema?: Record<string, unknown>): z.ZodSchema {
    if (!schema || !schema.properties) {
      return z.object({});
    }

    const properties = schema.properties as Record<string, any>;
    const required = (schema.required as string[]) || [];
    
    const zodFields: Record<string, z.ZodTypeAny> = {};
    
    for (const [key, prop] of Object.entries(properties)) {
      if (typeof prop === 'object' && prop.type) {
        switch (prop.type) {
          case 'string':
            zodFields[key] = required.includes(key) ? z.string() : z.string().optional();
            if (prop.enum) {
              zodFields[key] = z.enum(prop.enum);
            }
            break;
          case 'number':
            zodFields[key] = required.includes(key) ? z.number() : z.number().optional();
            break;
          case 'boolean':
            zodFields[key] = required.includes(key) ? z.boolean() : z.boolean().optional();
            break;
          default:
            zodFields[key] = required.includes(key) ? z.string() : z.string().optional();
        }
      } else {
        zodFields[key] = required.includes(key) ? z.string() : z.string().optional();
      }
    }

    return z.object(zodFields);
  }

  async _call(input: Record<string, unknown>): Promise<string> {
    try {
      // Convert unknown values to our expected types
      const convertedInput: Record<string, string | number | boolean | undefined> = {};
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined) {
          convertedInput[key] = value;
        } else {
          convertedInput[key] = String(value);
        }
      }
      return await this.customTool.execute(convertedInput);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Tool ${this.name} failed: ${errorMessage}`);
    }
  }
}

// 创建 LangChain 兼容的工具
export function createLangChainTools(environment: Environment): StructuredTool[] {
  const bash = bashTool(environment);
  const editor = editorTool(environment);

  return [
    new CustomToolAdapter(bash),
    new CustomToolAdapter(editor),
  ];
}

// 用于直接创建 LangChain 工具的辅助类
class SimpleBashTool extends StructuredTool {
  name = 'bash';
  description = 'Execute a bash command in the environment';
  schema = z.object({
    command: z.string().describe('The bash command to execute'),
  });

  async _call(): Promise<string> {
    return ''; // 占位符
  }
}

class SimpleEditorTool extends StructuredTool {
  name = 'editor';
  description = 'Read, write, and edit files';
  schema = z.object({
    command: z.enum(['view', 'create', 'str_replace']).describe('The editor command to execute'),
    path: z.string().describe('The file path'),
    content: z.string().optional().describe('Content for create command'),
    old_str: z.string().optional().describe('String to replace (for str_replace)'),
    new_str: z.string().optional().describe('Replacement string (for str_replace)'),
  });

  async _call(): Promise<string> {
    return ''; // 占位符
  }
}

export const BashTool = new SimpleBashTool();
export const EditorTool = new SimpleEditorTool();