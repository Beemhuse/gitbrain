import { getDiffSummary } from "../core/git.js";
import { calculateRisk } from "../core/analyzer.js";
import { formatRisk } from "../core/formatter.js";
import { info } from "../utils/logger.js";

export async function runRisk() {
  info("Collecting diff summary from repository...");
  const diff = await getDiffSummary();
  const score = calculateRisk(diff);
  return formatRisk(diff, score);
}
