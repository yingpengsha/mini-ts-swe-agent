#!/bin/bash

# Demo script for Mini TypeScript SWE Agent

echo "🤖 Mini TypeScript SWE Agent Demo"
echo "================================"
echo ""

# Check if API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    echo "Please set it with: export OPENAI_API_KEY=your-api-key"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
pnpm build

echo ""
echo "🚀 Running a simple task..."
echo ""

# Run a simple task
node dist/index.js run "Create a simple calculator.js file with functions for add, subtract, multiply, and divide"

echo ""
echo "✅ Demo complete! Check the generated calculator.js file."