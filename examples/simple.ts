import { DefaultAgent, LocalEnvironment, OpenAIModel } from '../src';

async function main() {
  // Initialize components
  const model = new OpenAIModel(process.env.OPENAI_API_KEY!);
  const environment = new LocalEnvironment();
  const agent = new DefaultAgent(model, environment, {
    verbose: true,
  });

  // Run a simple task
  await agent.run('Create a file called hello.txt with the content "Hello from Mini SWE Agent!"');
}

main().catch(console.error);