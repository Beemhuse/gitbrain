import chalk from "chalk";

export function formatThread(commits, summary) {
  const lines = commits.map((commit, index) => {
    return `${chalk.cyan(`#${index + 1}`)} ${commit.message.trim()} ${chalk.dim(`(${commit.author})`)} `;
  });

  const header = chalk.bold("Developer Thread");
  const summaryLine = summary ? `${chalk.bold("Summary:")} ${summary}` : null;

  return [
    header,
    "",
    summaryLine,
    summaryLine ? "" : null,
    ...lines,
    "",
    chalk.dim("Source: latest 5 commits from current repository")
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatRisk(diff, score) {
  const level = score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  const styledLevel = level === "HIGH" ? chalk.red(level) : level === "MEDIUM" ? chalk.yellow(level) : chalk.green(level);
  const changes = normalizeChanges(diff);

  return [
    chalk.bold("Risk assessment"),
    "",
    `Risk score: ${styledLevel} (${score} / 100)`,
    `Files changed: ${Array.isArray(diff.files) ? diff.files.length : diff.files}`,
    `Insertions: ${diff.insertions ?? 0}`,
    `Deletions: ${diff.deletions ?? 0}`,
    `Changed lines: ${changes}`,
    "",
    chalk.dim("Use this result to prioritize review and testing for the current diff.")
  ].join("\n");
}

function normalizeChanges(diff) {
  if (typeof diff.changes === "number") {
    return diff.changes;
  }
  return (diff.insertions ?? 0) + (diff.deletions ?? 0);
}
