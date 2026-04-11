import { getTodayCommits, NotGitRepoError } from "../core/git.js";
import { formatThread } from "../core/formatter.js";
import { generateDevSummary } from "../services/ai.js";
import { info, formatGitError } from "../utils/logger.js";

export async function runToday(config) {
  try {
    info("Loading commits from today...");
    const commits = await getTodayCommits();

    if (!commits.length) {
      return { result: "No commits found for today. You've earned a relaxing break!", aiUsed: false };
    }

    const summaryResult = await generateDevSummary(commits, config);
    const result = formatThread(commits, summaryResult.text, "today");
    return { result, aiUsed: summaryResult.aiUsed };
  } catch (err) {
    if (err instanceof NotGitRepoError) {
      formatGitError();
      throw err;
    }
    throw err;
  }
}
