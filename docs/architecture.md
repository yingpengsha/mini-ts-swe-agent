# Architecture

## Overview

Mini TypeScript SWE Agent is built on LangChain/LangGraph, providing a modular, state-driven architecture for AI-powered software engineering tasks.

```
┌─────────────┐
│     CLI     │
└──────┬──────┘
       │
┌──────▼──────┐
│    Agent    │
└──────┬──────┘
       │
┌──────▼──────────────┐
│  LangGraph Workflow │
│  ┌───────────────┐  │
│  │  Initialize   │  │
│  └───────┬───────┘  │
│          ▼          │
│  ┌───────────────┐  │
│  │     Model     │  │
│  └───────┬───────┘  │
│          ▼          │
│  ┌───────────────┐  │
│  │   Router      │  │
│  └───┬───────┬───┘  │
│      ▼       ▼      │
│  ┌──────┐ ┌──────┐ │
│  │Tools │ │Check │ │
│  └──────┘ └──────┘ │
└─────────────────────┘
       │
┌──────▼──────┐
│ Environment │
└─────────────┘
```

## Core Components

### Agent (`src/langgraph/agent.ts`)
The main orchestrator that:
- Initializes the workflow graph
- Manages execution flow
- Handles logging and output
- Provides streaming capabilities

### Workflow Nodes (`src/langgraph/nodes.ts`)

#### Initialize Node
- Sets up the system prompt
- Prepares initial state
- Configures agent behavior

#### Model Node
- Calls the LLM (via LangChain)
- Generates responses
- Produces tool calls when needed

#### Tools Node
- Executes tool calls (bash, editor)
- Collects results
- Handles tool errors

#### Completion Check Node
- Analyzes assistant responses
- Determines task completion
- Manages iteration control

#### Router Node
- Decides next execution step
- Handles conditional branching
- Manages error states

### State Management (`src/langgraph/types.ts`)

```typescript
interface AgentState {
  messages: BaseMessage[];      // Conversation history
  task: string;                // Current task
  iterations: number;          // Execution count
  maxIterations: number;       // Limit control
  isComplete: boolean;         // Completion flag
  lastToolResult?: string;     // Tool feedback
  error?: string;              // Error tracking
}
```

### Tool System (`src/tools/`)

Tools are adapted to LangChain's `StructuredTool` format:

- **Bash Tool**: Command execution with output capture
- **Editor Tool**: File operations (view/create/edit)

Each tool includes:
- Zod schema validation
- Error handling
- Type-safe arguments

### Environment (`src/environment.ts`)

Provides sandboxed execution:
- File system operations
- Command execution
- Working directory management
- Error handling

## Workflow Execution

1. **Initialization**: System prompt and state setup
2. **Model Invocation**: LLM generates response
3. **Routing Decision**: 
   - Has tool calls → Execute tools
   - No tool calls → Check completion
   - Error/limit → End
4. **Tool Execution**: Run requested operations
5. **Completion Check**: Verify task status
6. **Loop or Exit**: Continue or finish

## Key Design Principles

### 1. State-Driven Execution
All decisions are based on the current state, making the system predictable and debuggable.

### 2. Node Isolation
Each node has a single responsibility, improving testability and maintainability.

### 3. Type Safety
Full TypeScript types throughout, with Zod validation for runtime safety.

### 4. Streaming Support
Built-in support for monitoring execution progress in real-time.

### 5. Error Recovery
Graceful error handling at every level, allowing the agent to recover from failures.

## Extension Points

### Adding New Tools
1. Implement the tool function
2. Create Zod schema
3. Wrap in `StructuredTool`
4. Register in tool map

### Custom Nodes
1. Define node function
2. Add to workflow graph
3. Update router logic
4. Extend state if needed

### Model Providers
Currently supports OpenAI via LangChain, easily extensible to other providers.

## Performance Characteristics

- **Memory**: O(n) where n is message count
- **Latency**: Dominated by LLM calls
- **Concurrency**: Sequential execution (tools could be parallelized)
- **Scalability**: Limited by context window