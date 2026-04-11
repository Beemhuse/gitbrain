import { promptForConfig, getConfig } from "../services/config.js";
import { info } from "../utils/logger.js";

export async function runConfig() {
  info("Opening GitBrain AI configuration...");
  const { config: existing } = await getConfig();

  if (existing && existing.provider) {
    console.log(`Current provider: ${existing.provider}`);
  }

  const config = await promptForConfig(existing?.provider || "openai");
  return `Saved ${config.provider} configuration successfully.`;
}
