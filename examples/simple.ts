import { Agent, LocalEnvironment } from '../src';

async function main() {
  // Initialize components
  const environment = new LocalEnvironment();
  const agent = new Agent(environment, {
    verbose: true,
  });

  // Run a simple task
  await agent.run('Create a file called hello.txt with the content "Hello from Mini SWE Agent!"');
}

main().catch(console.error);