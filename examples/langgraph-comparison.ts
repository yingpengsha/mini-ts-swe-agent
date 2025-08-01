import { DefaultAgent, LangGraphAgent, LocalEnvironment, OpenAIModel } from '../src';

async function compareImplementations() {
  console.log('🔄 Comparing DefaultAgent vs LangGraphAgent\n');

  // Initialize common components
  const model = new OpenAIModel(process.env.OPENAI_API_KEY!);
  const environment = new LocalEnvironment();
  const task = 'Create a simple hello.txt file with "Hello from AI Agent!"';

  console.log('📝 Task:', task);
  console.log('\n' + '='.repeat(60));

  // Test original implementation
  console.log('\n🏗️  Running DefaultAgent (Original Implementation)');
  console.log('-'.repeat(50));
  
  const defaultAgent = new DefaultAgent(model, environment, {
    verbose: true,
    maxIterations: 10,
  });

  const startTime1 = Date.now();
  try {
    await defaultAgent.run(task);
    console.log(`✅ DefaultAgent completed in ${Date.now() - startTime1}ms`);
  } catch (error) {
    console.error('❌ DefaultAgent failed:', error);
  }

  console.log('\n' + '='.repeat(60));

  // Test LangGraph implementation
  console.log('\n🚀 Running LangGraphAgent (LangGraph Implementation)');
  console.log('-'.repeat(50));
  
  const langGraphAgent = new LangGraphAgent(environment, {
    verbose: true,
    maxIterations: 10,
    model: 'gpt-4-turbo-preview',
  });

  const startTime2 = Date.now();
  try {
    await langGraphAgent.run(task);
    console.log(`✅ LangGraphAgent completed in ${Date.now() - startTime2}ms`);
  } catch (error) {
    console.error('❌ LangGraphAgent failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Comparison Summary:');
  console.log('• Both implementations follow the same core workflow');
  console.log('• LangGraph version provides better state management');
  console.log('• LangGraph version supports streaming and intermediate states');
  console.log('• Both maintain the same tool system and user interface');
}

// Example of streaming with LangGraph
async function demonstrateStreaming() {
  console.log('\n🌊 Demonstrating LangGraph Streaming Capabilities\n');

  const environment = new LocalEnvironment();
  const langGraphAgent = new LangGraphAgent(environment, {
    verbose: false, // We'll handle output manually
    maxIterations: 5,
  });

  const task = 'Write a simple Python script that prints numbers 1 to 5';

  console.log('📝 Task:', task);
  console.log('\n🔄 Streaming execution states:');

  let stepCount = 0;
  for await (const state of langGraphAgent.runStream(task)) {
    stepCount++;
    console.log(`\n📍 Step ${stepCount}: Iteration ${state.iterations}`);
    console.log(`   Messages: ${state.messages.length}`);
    console.log(`   Complete: ${state.isComplete}`);
    
    if (state.error) {
      console.log(`   ⚠️  Error: ${state.error}`);
    }
    
    if (state.lastToolResult) {
      console.log(`   🔧 Last tool result: ${state.lastToolResult.substring(0, 100)}...`);
    }
  }

  console.log('\n✅ Streaming demonstration completed');
}

async function main() {
  try {
    await compareImplementations();
    await demonstrateStreaming();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

main().catch(console.error);