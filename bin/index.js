#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import { runContent } from "../src/commands/content.js";
import { runRisk } from "../src/commands/risk.js";
import { runToday } from "../src/commands/today.js";
import { runConfig } from "../src/commands/config.js";
import { resolveRuntimeConfig } from "../src/index.js";
import { info, error, success } from "../src/utils/logger.js";
import { NotGitRepoError } from "../src/core/git.js";

program
  .name("gitbrain")
  .description("GitBrain CLI for AI-powered Git repository analysis")
  .version("0.1.0")
  .option("-p, --provider <provider>", "Select LLM provider (openai|gemini)");

async function loadRuntimeConfig() {
  const opts = program.opts();
  return await resolveRuntimeConfig({ provider: opts.provider });
}

function showProviderHint(runtime) {
  const provider = runtime.config?.provider || "openai";
  const hasKey = Boolean(runtime.config?.apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
  if (!hasKey) {
    console.log(chalk.yellow("LLM provider not configured. Use gitbrain config, OPENAI_API_KEY, or GEMINI_API_KEY."));
    return;
  }

  const source = runtime.isStored ? "stored config" : runtime.isEnv ? "environment" : "default";
  console.log(chalk.gray(`LLM provider: ${provider} (${source}). Use --provider openai|gemini to override.`));
}

program
  .command("content")
  .description("Generate developer-facing content from recent commits")
  .action(async () => {
    const runtime = await loadRuntimeConfig();
    showProviderHint(runtime);
    info("Analyzing recent commits...");
    try {
      const { result, aiUsed } = await runContent(runtime.config);
      console.log(result);
      success("Content generation complete.");
    } catch (err) {
      if (!(err instanceof NotGitRepoError)) {
        error(err);
      }
      process.exit(1);
    }
  });

program
  .command("today")
  .description("Summarize commits made today")
  .action(async () => {
    const runtime = await loadRuntimeConfig();
    showProviderHint(runtime);
    info("Analyzing today's work...");
    try {
      const { result, aiUsed } = await runToday(runtime.config);
      console.log(result);
      success("Today's summary complete.");
    } catch (err) {
      if (!(err instanceof NotGitRepoError)) {
        error(err);
      }
      process.exit(1);
    }
  });

program
  .command("risk")
  .description("Analyze repository change risk")
  .action(async () => {
    const runtime = await loadRuntimeConfig();
    showProviderHint(runtime);
    info("Evaluating repository diff...");
    try {
      const { result, aiUsed } = await runRisk(runtime.config);
      console.log(result);
      success("Risk analysis complete.");
    } catch (err) {
      if (!(err instanceof NotGitRepoError)) {
        error(err);
      }
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Update or reset persistent AI provider configuration")
  .action(async () => {
    info("Opening GitBrain configuration...");
    try {
      const result = await runConfig();
      console.log(result);
      success("Configuration saved.");
    } catch (err) {
      error(err);
      process.exit(1);
    }
  });

program.parse(process.argv);