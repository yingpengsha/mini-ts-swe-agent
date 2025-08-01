import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { Environment } from './types';

const execAsync = promisify(exec);

export class LocalEnvironment implements Environment {
  private workingDirectory: string;

  constructor(workingDirectory: string = process.cwd()) {
    this.workingDirectory = workingDirectory;
  }

  async execute(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDirectory,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      const execError = error as NodeJS.ErrnoException & {
        stdout?: string;
        stderr?: string;
        code?: number;
      };
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message || 'Unknown error',
        exitCode: execError.code || 1,
      };
    }
  }

  async readFile(path: string): Promise<string> {
    const fullPath = join(this.workingDirectory, path);
    return await fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fullPath = join(this.workingDirectory, path);
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async listFiles(path: string): Promise<string[]> {
    const fullPath = join(this.workingDirectory, path);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  }
}