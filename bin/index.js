#!/usr/bin/env node
import { program } from "commander";
import { runContent } from "../src/commands/content.js";
import { runRisk } from "../src/commands/risk.js";
import { info, error, success } from "../src/utils/logger.js";

program
  .name("devbrain")
  .description("DevBrain CLI for Git repository intelligence")
  .version("0.1.0");

program
  .command("content")
  .description("Generate developer-facing content from recent commits")
  .action(async () => {
    info("Analyzing recent commits...");
    try {
      const result = await runContent();
      console.log(result);
      success("Content generation complete.");
    } catch (err) {
      error(err);
      process.exit(1);
    }
  });

program
  .command("risk")
  .description("Analyze repository change risk")
  .action(async () => {
    info("Evaluating repository diff...");
    try {
      const result = await runRisk();
      console.log(result);
      success("Risk analysis complete.");
    } catch (err) {
      error(err);
      process.exit(1);
    }
  });

program.parse(process.argv);