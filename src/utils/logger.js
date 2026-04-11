import chalk from "chalk";

export function info(message) {
  console.log(chalk.blue("info"), message);
}

export function success(message) {
  console.log(chalk.green("success"), message);
}

export function warn(message) {
  console.warn(chalk.yellow("warn"), message);
}

export function error(err) {
  const message = typeof err === "string" ? err : err?.message ?? "An unexpected error occurred.";
  console.error(chalk.red("error"), message);
}

export function formatGitError() {
  console.error(chalk.red("error"), "Not a Git repository");
  console.error(chalk.dim("  This command must be run inside a Git repository."));
  console.error(chalk.dim("  Try: git init"));
}

