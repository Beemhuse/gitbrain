import { resolveRuntimeConfig } from "../src/index.js";
import { runRisk } from "../src/commands/risk.js";

async function main() {
  console.log("Running GitBrain analysis...\n");

  const provider = process.env.INPUT_PROVIDER || process.env.PROVIDER;
  const apiKey = process.env.INPUT_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const { config } = await resolveRuntimeConfig({ provider, apiKey });
  const { result } = await runRisk(config);

  console.log(result);
}

main();