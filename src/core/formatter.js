import chalk from "chalk";
import { categorizeCommits, extractHighlights } from "../services/ai.js";

export function formatThread(commits, narrativeSummary, context = "content", analysisNotes = "") {
  const categories = categorizeCommits(commits);
  const highlights = extractHighlights(commits);

  const sections = [];

  sections.push(
    context === "today"
      ? chalk.bold.cyan("📅 Today's Work")
      : chalk.bold.cyan("📝 Dev Update")
  );
  sections.push("");

  if (narrativeSummary) {
    const summaryText = narrativeSummary.trim();
    const formatted = context === "today" ? summaryText : summaryText;
    sections.push(chalk.gray(formatted));
    sections.push("");
  }

  if (analysisNotes) {
    sections.push(chalk.bold("AI Insight"));
    sections.push(chalk.white(analysisNotes));
    sections.push("");
  }

  if (highlights.length > 0) {
    sections.push(chalk.bold("Highlights"));
    highlights.forEach((h) => sections.push(chalk.cyan(h)));
    sections.push("");
  }

  const categoryItems = [];

  if (categories.features.length > 0) {
    categoryItems.push(formatCategory("Features", categories.features));
  }
  if (categories.fixes.length > 0) {
    categoryItems.push(formatCategory("Fixes", categories.fixes));
  }
  if (categories.refactoring.length > 0) {
    categoryItems.push(formatCategory("Refactoring", categories.refactoring));
  }
  if (categories.docs.length > 0) {
    categoryItems.push(formatCategory("Documentation", categories.docs));
  }
  if (categories.other.length > 0) {
    categoryItems.push(formatCategory("Other", categories.other));
  }

  if (categoryItems.length > 0) {
    sections.push(chalk.bold("What changed"));
    sections.push(...categoryItems.flat());
    sections.push("");
  }

  sections.push(
    chalk.dim(
      `📊 ${commits.length} commit${commits.length > 1 ? "s" : ""} from ${context === "today" ? "today" : "current repository"}`
    )
  );

  return sections.join("\n");
}

function formatCategory(name, commits) {
  const lines = [chalk.yellow(`${name}:`)];
  commits.forEach((commit) => {
    const cleanMsg = commit.message
      .trim()
      .replace(/^(feat|fix|refactor|docs)\s*:?\s*/i, "")
      .replace(/^#\d+\s+/g, "")
      .slice(0, 80);
    lines.push(`  ${chalk.gray("•")} ${cleanMsg} ${chalk.dim(`— ${commit.author}`)}`);
  });
  lines.push("");
  return lines;
}

export function formatRisk(diff, riskAnalysis) {
  const score = typeof riskAnalysis === "number" ? riskAnalysis : riskAnalysis.score;
  const criticalFiles = riskAnalysis.criticalFiles || {};
  const hasCritical = riskAnalysis.hasCritical || false;

  const level = score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  const styledLevel =
    level === "HIGH"
      ? chalk.red.bold(level)
      : level === "MEDIUM"
        ? chalk.yellow.bold(level)
        : chalk.green.bold(level);
  const changes = normalizeChanges(diff);

  const sections = [chalk.bold.red("⚠️  Risk Assessment"), "", `Risk Level: ${styledLevel}  (Score: ${score} / 100)`, ""];

  if (hasCritical) {
    sections.push(chalk.red.bold("🚨 Critical files detected:"));
    if (criticalFiles.auth && criticalFiles.auth.length > 0) {
      sections.push(chalk.red(`  🔐 Auth: ${criticalFiles.auth.join(", ")}`));
    }
    if (criticalFiles.payment && criticalFiles.payment.length > 0) {
      sections.push(chalk.red(`  💳 Payment: ${criticalFiles.payment.join(", ")}`));
    }
    if (criticalFiles.security && criticalFiles.security.length > 0) {
      sections.push(chalk.red(`  🔒 Security: ${criticalFiles.security.join(", ")}`));
    }
    if (criticalFiles.config && criticalFiles.config.length > 0) {
      sections.push(chalk.yellow(`  ⚙️  Config: ${criticalFiles.config.join(", ")}`));
    }
    if (criticalFiles.core && criticalFiles.core.length > 0) {
      sections.push(chalk.yellow(`  🔧 Core: ${criticalFiles.core.join(", ")}`));
    }
    sections.push("");
  }

  if (riskAnalysis.aiAnalysis) {
    sections.push(chalk.bold("AI Insight"));
    sections.push(chalk.white(riskAnalysis.aiAnalysis));
    sections.push("");
  }

  sections.push(chalk.dim("Metrics:"));
  sections.push(`  Files changed: ${Array.isArray(diff.files) ? diff.files.length : diff.files}`);
  sections.push(`  Lines added: ${diff.insertions ?? 0}`);
  sections.push(`  Lines deleted: ${diff.deletions ?? 0}`);
  sections.push(`  Total changes: ${changes}`);
  sections.push("");

  if (hasCritical) {
    sections.push(chalk.red.italic("⚠️ Critical files changed. Require careful review and testing."));
  } else {
    sections.push(chalk.italic.dim("Tip: Large diffs should be reviewed carefully and tested thoroughly."));
  }

  return sections.join("\n");
}

function normalizeChanges(diff) {
  if (typeof diff.changes === "number") {
    return diff.changes;
  }
  return (diff.insertions ?? 0) + (diff.deletions ?? 0);
}
