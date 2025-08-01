# Mini TypeScript SWE Agent

A minimal TypeScript implementation of an AI agent for solving software engineering tasks, built with LangChain/LangGraph for advanced state management and workflow control.

## Features

- 🤖 AI-powered software engineering agent
- 🛠️ Built-in tools for bash commands and file editing
- 🔄 LangChain/LangGraph workflow engine
- 📝 TypeScript with full type safety
- 🌊 Streaming execution with real-time state monitoring
- 📊 Advanced state management and debugging
- 🔧 Modular node-based architecture
- 🚀 CLI and programmatic API

## Installation

```bash
npm install mini-ts-swe-agent
# or
pnpm add mini-ts-swe-agent
```

## Quick Start

### CLI Usage

```bash
# Set your API key
export OPENAI_API_KEY=your-api-key

# Run a task
npx mini-ts-swe-agent run "Create a simple TODO app with add and list functionality"

# Interactive mode
npx mini-ts-swe-agent interactive
```

### Programmatic Usage

```typescript
import { Agent, LocalEnvironment } from 'mini-ts-swe-agent';

const environment = new LocalEnvironment();
const agent = new Agent(environment, {
  model: 'gpt-4-turbo-preview',
  maxIterations: 30,
  verbose: true,
});

await agent.run('Write a function to calculate fibonacci numbers');
```

### Streaming Execution

```typescript
// Monitor execution in real-time
for await (const state of agent.runStream(task)) {
  console.log(`Step ${state.iterations}: ${state.messages.length} messages`);
  if (state.isComplete) {
    console.log('Task completed!');
  }
}
```

## Configuration

### CLI Options

- `-m, --model <model>`: Model to use (default: gpt-4-turbo-preview)
- `--api-key <key>`: API key (can also use OPENAI_API_KEY env var)
- `--max-iterations <n>`: Maximum iterations (default: 30)
- `--no-verbose`: Disable verbose output
- `-d, --directory <dir>`: Working directory

## Architecture

The agent uses a node-based workflow powered by LangGraph:

### Workflow Nodes

- **Initialize**: Sets up system prompt and initial state
- **Model**: Calls LLM to generate responses and tool calls
- **Tools**: Executes bash commands or file operations
- **Completion Check**: Determines if the task is complete
- **Router**: Decides the next node based on current state

### State Management

```typescript
interface AgentState {
  messages: BaseMessage[];      // Full conversation history
  task: string;                // Current task
  iterations: number;          // Iteration count
  maxIterations: number;       // Maximum allowed iterations
  isComplete: boolean;         // Task completion flag
  lastToolResult?: string;     // Last tool execution result
  error?: string;              // Error information
}
```

### Built-in Tools

1. **Bash Tool**: Execute shell commands
   - Run scripts
   - Manage packages
   - System operations

2. **Editor Tool**: File operations
   - `view`: Read file contents with line numbers
   - `create`: Create new files
   - `str_replace`: Replace text in files

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Documentation

- [Agent Workflow](docs/agent-workflow.md) - Detailed workflow documentation
- [Architecture](docs/architecture.md) - System architecture overview  
- [LangGraph Implementation](docs/langgraph-implementation.md) - Implementation details

## License

MIT