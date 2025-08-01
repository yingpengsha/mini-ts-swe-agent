import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalEnvironment } from '../src/core/environment';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('LocalEnvironment', () => {
  let tempDir: string;
  let env: LocalEnvironment;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(join(tmpdir(), 'test-env-'));
    env = new LocalEnvironment(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('execute', () => {
    it('should execute commands successfully', async () => {
      const result = await env.execute('echo "Hello, World!"');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('Hello, World!');
      expect(result.stderr).toBe('');
    });

    it('should capture stderr', async () => {
      const result = await env.execute('echo "Error" >&2');
      expect(result.exitCode).toBe(0);
      expect(result.stderr.trim()).toBe('Error');
    });

    it('should handle command failures', async () => {
      const result = await env.execute('nonexistentcommand');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toBeTruthy();
    });
  });

  describe('file operations', () => {
    it('should write and read files', async () => {
      const content = 'Test content';
      await env.writeFile('test.txt', content);
      const readContent = await env.readFile('test.txt');
      expect(readContent).toBe(content);
    });

    it('should list files', async () => {
      await env.writeFile('file1.txt', 'content1');
      await env.writeFile('file2.txt', 'content2');
      const files = await env.listFiles('.');
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });
  });
});