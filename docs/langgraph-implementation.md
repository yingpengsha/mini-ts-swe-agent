# LangGraph Implementation

## Overview

Mini TypeScript SWE Agent is built entirely on LangChain/LangGraph ecosystem, providing a state-driven, node-based workflow for AI-powered software engineering tasks.

## Core Architecture

### State Management

```typescript
interface AgentState {
  messages: BaseMessage[];      // LangChain standard messages
  task: string;                // Task description
  iterations: number;          // Iteration counter
  maxIterations: number;       // Maximum iteration limit
  isComplete: boolean;         // Completion status
  lastToolResult?: string;     // Last tool result
  error?: string;              // Error information
}
```

### Workflow Nodes

The agent operates through a series of specialized nodes:

1. **Initialize Node**
   - Sets system prompt
   - Prepares initial state
   - Configures agent behavior

2. **Model Node**
   - Invokes LLM via LangChain
   - Generates responses and tool calls
   - Handles model errors

3. **Tools Node**
   - Executes tool calls
   - Collects results
   - Manages tool errors

4. **Completion Check Node**
   - Analyzes responses for completion indicators
   - Updates completion state
   - Manages iteration control

5. **Router Node**
   - Determines next execution step
   - Handles conditional branching
   - Manages workflow termination

### Workflow Graph

```
START
  ↓
initialize
  ↓
model ←────────────┐
  ↓                │
[router]           │
  ├─ tools ────────┤
  ├─ check ────────┤
  └─ END           │
                   │
tools              │
  ↓                │
completion_check   │
  ↓                │
[continue?]        │
  ├─ yes ──────────┘
  └─ no → END
```

## Tool Integration

### LangChain Tool Adapter

```typescript
class CustomToolAdapter extends StructuredTool {
  // Adapts our tool interface to LangChain standards
  // Provides Zod schema validation
  // Unified error handling
}
```

### Built-in Tools

1. **Bash Tool**
   ```typescript
   schema: z.object({
     command: z.string().describe('The bash command to execute'),
   })
   ```

2. **Editor Tool**
   ```typescript
   schema: z.object({
     command: z.enum(['view', 'create', 'str_replace']),
     path: z.string(),
     content: z.string().optional(),
     old_str: z.string().optional(),
     new_str: z.string().optional(),
   })
   ```

## Execution Flow

### Standard Execution

```typescript
const agent = new Agent(environment, config);
await agent.run(task);
```

### Streaming Execution

```typescript
for await (const state of agent.runStream(task)) {
  // Access intermediate states
  console.log(`Iteration: ${state.iterations}`);
  console.log(`Messages: ${state.messages.length}`);
}
```

### State Inspection

```typescript
const finalState = await agent.getState(task);
// Analyze final execution state
```

## Key Features

### 1. State Persistence
Every step maintains complete state history, enabling:
- Debugging capabilities
- Execution replay
- State inspection

### 2. Modular Design
- Each node is independently testable
- Clear separation of concerns
- Easy to extend or modify

### 3. Type Safety
- Full TypeScript types
- Zod runtime validation
- Type-safe tool arguments

### 4. Error Recovery
- Graceful error handling
- State preservation on failure
- Automatic retry capabilities

### 5. Streaming Support
- Real-time execution monitoring
- Intermediate state access
- Progress tracking

## Configuration

```typescript
interface LangGraphAgentConfig {
  maxIterations?: number;    // Default: 30
  temperature?: number;      // Default: 0.7
  verbose?: boolean;         // Default: true
  model?: string;           // Default: 'gpt-4-turbo-preview'
}
```

## Implementation Details

### Simplified Workflow Graph

Due to LangGraph API complexity, we implemented a simplified workflow executor:

```typescript
class SimpleWorkflowGraph {
  // Maintains node registry
  // Manages state transitions
  // Handles execution flow
  // Provides streaming interface
}
```

This approach:
- Keeps LangGraph concepts
- Avoids complex API issues
- Maintains full functionality
- Enables easier debugging

### Message Handling

All messages use LangChain's `BaseMessage` types:
- `SystemMessage`: System prompts
- `HumanMessage`: User inputs and tool results
- `AIMessage`: Assistant responses

### Tool Call Protocol

1. Model generates tool calls in response
2. Tools node extracts and validates calls
3. Each tool is executed sequentially
4. Results are added as HumanMessages
5. Model processes results in next iteration

## Performance Considerations

### Memory Usage
- Linear growth with message history
- State object overhead per iteration
- Tool result storage

### Optimization Strategies
- Implement message pruning for long tasks
- Consider parallel tool execution
- Add caching for repeated operations

## Future Enhancements

### Planned Features
1. Parallel tool execution
2. Sub-workflow support
3. Custom node types
4. State persistence
5. Checkpoint/resume capability

### Extension Points
1. Custom tools via `StructuredTool`
2. Additional nodes in workflow
3. Custom routing logic
4. State transformers
5. Model provider adapters