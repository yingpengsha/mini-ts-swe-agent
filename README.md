# Mini TypeScript SWE Agent

A minimal TypeScript implementation of an AI agent for solving software engineering tasks. Inspired by [SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent).

## Features

- 🤖 AI-powered software engineering agent
- 🛠️ Built-in tools for bash commands and file editing
- 🔄 Support for OpenAI and LiteLLM models
- 📝 TypeScript with full type safety
- 🎯 Simple and extensible architecture
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
import { DefaultAgent, LocalEnvironment, OpenAIModel } from 'mini-ts-swe-agent';

const model = new OpenAIModel(process.env.OPENAI_API_KEY!);
const environment = new LocalEnvironment();
const agent = new DefaultAgent(model, environment);

await agent.run('Write a function to calculate fibonacci numbers');
```

## Configuration

### CLI Options

- `-m, --model <model>`: Model to use (default: gpt-4-turbo-preview)
- `--api-key <key>`: API key (can also use OPENAI_API_KEY env var)
- `--base-url <url>`: Base URL for LiteLLM
- `--max-iterations <n>`: Maximum iterations (default: 30)
- `--no-verbose`: Disable verbose output
- `-d, --directory <dir>`: Working directory

### Using LiteLLM

```bash
npx mini-ts-swe-agent run "Your task" --base-url http://localhost:8000 --model claude-3
```

## Architecture

The agent follows a simple architecture:

- **Agent**: Orchestrates the task execution
- **Model**: Handles LLM interactions (OpenAI/LiteLLM)
- **Environment**: Manages file system and command execution
- **Tools**: Provides capabilities (bash, file editor)

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

## License

MIT