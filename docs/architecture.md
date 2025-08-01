# Architecture

## Overview

Mini TypeScript SWE Agent follows a modular architecture with clear separation of concerns:

```
┌─────────────┐
│     CLI     │
└──────┬──────┘
       │
┌──────▼──────┐
│    Agent    │◄────────┐
└──────┬──────┘         │
       │                │
┌──────▼──────┐  ┌──────┴──────┐
│    Model    │  │    Tools    │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                │
        ┌───────▼───────┐
        │  Environment  │
        └───────────────┘
```

## Core Components

### Agent (`src/core/agent.ts`)
- Orchestrates the entire task execution
- Manages conversation history
- Handles tool execution
- Implements the main loop

### Model (`src/core/model.ts`)
- Provides LLM interaction abstraction
- Supports OpenAI and LiteLLM backends
- Handles tool calling protocols

### Environment (`src/core/environment.ts`)
- Manages file system operations
- Executes shell commands
- Provides sandboxed execution context

### Tools (`src/tools/`)
- **Bash Tool**: Execute shell commands
- **Editor Tool**: File operations (view, create, edit)
- Extensible tool system

## Design Principles

1. **Simplicity**: Keep the core small and focused
2. **Type Safety**: Leverage TypeScript's type system
3. **Extensibility**: Easy to add new tools and models
4. **Modularity**: Clear separation of concerns