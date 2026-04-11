import { getConfig, getEnvConfig } from "./services/config.js";

function normalizeProvider(provider) {
  const value = provider?.toString().trim().toLowerCase();
  if (value === "gemini") {
    return "gemini";
  }
  if (value === "openai") {
    return "openai";
  }
  return null;
}

export async function resolveRuntimeConfig(options = {}) {
  const { provider, apiKey } = options;
  const requestedProvider = normalizeProvider(provider);
  const { config: storedConfig, isStored } = await getConfig({ promptIfMissing: false });

  let finalProvider = requestedProvider;
  let finalApiKey = apiKey ?? null;
  let configSource = null;

  if (finalProvider) {
    // Provider explicitly requested
    configSource = "requested";
    if (!finalApiKey && storedConfig?.provider === finalProvider) {
      finalApiKey = storedConfig.apiKey;
      configSource = "stored";
    }
    if (!finalApiKey) {
      const envConfig = getEnvConfig(finalProvider);
      if (envConfig) {
        finalApiKey = envConfig.apiKey;
        configSource = "env";
      }
    }
  } else {
    // No provider requested - use stored if available
    if (storedConfig?.provider && storedConfig?.apiKey) {
      finalProvider = storedConfig.provider;
      finalApiKey = storedConfig.apiKey;
      configSource = "stored";
    } else {
      // Fall back to env, preferring the one with an active key
      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (geminiKey && !openaiKey) {
        finalProvider = "gemini";
        finalApiKey = geminiKey;
        configSource = "env";
      } else {
        finalProvider = "openai";
        finalApiKey = openaiKey || null;
        configSource = openaiKey ? "env" : "default";
      }
    }
  }

  const isEnv = configSource === "env";
  const resultIsStored = configSource === "stored";

  return {
    config: {
      provider: finalProvider,
      apiKey: finalApiKey,
    },
    isStored: resultIsStored,
    isEnv,
  };
}

export { runContent } from "./commands/content.js";
export { runRisk } from "./commands/risk.js";
export { runToday } from "./commands/today.js";
export { runConfig } from "./commands/config.js";
