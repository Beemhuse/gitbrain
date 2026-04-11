import { getDiffSummary, NotGitRepoError } from "../core/git.js";
import { calculateRisk } from "../core/analyzer.js";
import { analyzeRiskWithAI } from "../services/ai.js";
import { formatRisk } from "../core/formatter.js";
import { info, formatGitError } from "../utils/logger.js";

export async function runRisk(config) {
  try {
    info("Collecting diff summary from repository...");
    const diff = await getDiffSummary();
    const scoreSummary = calculateRisk(diff);
    const aiResult = await analyzeRiskWithAI(diff, config);
    const riskAnalysis = { ...scoreSummary, aiAnalysis: aiResult.text };
    const result = formatRisk(diff, riskAnalysis);
    return { result, aiUsed: aiResult.aiUsed };
  } catch (err) {
    if (err instanceof NotGitRepoError) {
      formatGitError();
      throw err;
    }
    throw err;
  }
}
