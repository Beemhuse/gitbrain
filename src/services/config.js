import fs from "fs/promises";
import path from "path";
import os from "os";
import readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".gitbrain");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function ensureConfigExists() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export function getEnvConfig(requestedProvider) {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const requested = requestedProvider?.toString().trim().toLowerCase();

  if (requested === "openai") {
    return hasOpenAI ? { provider: "openai", apiKey: process.env.OPENAI_API_KEY } : null;
  }

  if (requested === "gemini") {
    return hasGemini ? { provider: "gemini", apiKey: process.env.GEMINI_API_KEY } : null;
  }

  if (hasOpenAI) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
  }

  if (hasGemini) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY };
  }

  return null;
}

export async function loadConfig() {
  await ensureConfigExists();

  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    if (!raw.trim()) {
      return null;
    }

    const config = JSON.parse(raw);
    if (!config || typeof config !== "object") {
      return null;
    }

    if (typeof config.provider !== "string" || typeof config.apiKey !== "string") {
      return null;
    }

    return {
      provider: config.provider.toLowerCase(),
      apiKey: config.apiKey,
    };
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    }

    if (err.name === "SyntaxError") {
      await fs.rm(CONFIG_FILE, { force: true });
      return null;
    }

    throw err;
  }
}

export async function getConfig(options = {}) {
  const { promptIfMissing = true } = options;
  const stored = await loadConfig();
  if (stored) {
    return { config: stored, isStored: true };
  }

  const envConfig = getEnvConfig();
  if (envConfig) {
    return { config: envConfig, isStored: false };
  }

  if (!promptIfMissing) {
    return { config: null, isStored: false };
  }

  const config = await promptForConfig();
  return { config, isStored: false };
}

export async function saveConfig(config) {
  await ensureConfigExists();
  const safeConfig = {
    provider: config.provider.toLowerCase(),
    apiKey: config.apiKey,
  };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(safeConfig, null, 2), "utf8");
  return safeConfig;
}

export async function deleteConfig() {
  try {
    await fs.rm(CONFIG_FILE, { force: true });
  } catch (err) {
    // ignore
  }
}

export async function promptConfig(defaultProvider = "openai") {
  const providerPrompt = `Choose LLM provider (openai/gemini) [${defaultProvider}]: `;
  let rawProvider = (await question(providerPrompt)).trim().toLowerCase();
  if (!rawProvider) {
    rawProvider = defaultProvider;
  }
  if (rawProvider !== "openai" && rawProvider !== "gemini") {
    rawProvider = "openai";
  }

  let apiKey = (await question(`Enter ${rawProvider} API key: `)).trim();
  while (!apiKey) {
    apiKey = (await question("API key is required. Enter API key: ")).trim();
  }

  return { provider: rawProvider, apiKey };
}

export async function promptForConfig(defaultProvider = "openai") {
  const config = await promptConfig(defaultProvider);
  return await saveConfig(config);
}
