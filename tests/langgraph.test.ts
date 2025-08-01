import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LangGraphAgent } from '../src/langgraph';
import { LocalEnvironment } from '../src/core/environment';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock OpenAI API
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    bindTools: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockResolvedValue({
      _getType: () => 'ai',
      content: 'Task completed successfully!',
      tool_calls: [],
    }),
  })),
}));

describe('LangGraphAgent', () => {
  let tempDir: string;
  let environment: LocalEnvironment;
  let agent: LangGraphAgent;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(join(tmpdir(), 'test-langgraph-'));
    environment = new LocalEnvironment(tempDir);
    
    // Create agent with mocked dependencies
    agent = new LangGraphAgent(environment, {
      verbose: false,
      maxIterations: 5,
      model: 'gpt-4-turbo-preview',
    });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should create agent with default config', () => {
      const defaultAgent = new LangGraphAgent(environment);
      expect(defaultAgent).toBeInstanceOf(LangGraphAgent);
    });

    it('should create agent with custom config', () => {
      const customAgent = new LangGraphAgent(environment, {
        maxIterations: 10,
        temperature: 0.5,
        verbose: true,
        model: 'gpt-3.5-turbo',
      });
      expect(customAgent).toBeInstanceOf(LangGraphAgent);
    });
  });

  describe('task execution', () => {
    it('should execute simple task', async () => {
      const task = 'Create a test file';
      
      // This will use the mocked ChatOpenAI
      await expect(agent.run(task)).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      // Create agent with error-prone config
      const errorAgent = new LangGraphAgent(environment, {
        verbose: false,
        maxIterations: 1, // Very low to trigger max iterations
      });
      
      const task = 'Complex task that might fail';
      await expect(errorAgent.run(task)).resolves.not.toThrow();
    });
  });

  describe('state management', () => {
    it('should return final state', async () => {
      const task = 'Simple test task';
      const state = await agent.getState(task);
      
      expect(state).toHaveProperty('messages');
      expect(state).toHaveProperty('task', task);
      expect(state).toHaveProperty('iterations');
      expect(state).toHaveProperty('maxIterations');
      expect(state).toHaveProperty('isComplete');
    });

    it('should support streaming execution', async () => {
      const task = 'Streaming test task';
      const states: any[] = [];
      
      for await (const state of agent.runStream(task)) {
        states.push(state);
      }
      
      expect(states.length).toBeGreaterThan(0);
      expect(states[0]).toHaveProperty('messages');
      expect(states[0]).toHaveProperty('task');
    });
  });

  describe('workflow integration', () => {
    it('should maintain workflow state consistency', async () => {
      const task = 'State consistency test';
      const state = await agent.getState(task);
      
      // Verify state structure matches our defined interface
      expect(typeof state.task).toBe('string');
      expect(typeof state.iterations).toBe('number');
      expect(typeof state.maxIterations).toBe('number');
      expect(typeof state.isComplete).toBe('boolean');
      expect(Array.isArray(state.messages)).toBe(true);
    });
  });
});