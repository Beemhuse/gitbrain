import { getRecentCommits, NotGitRepoError } from "../core/git.js";
import { formatThread } from "../core/formatter.js";
import { generateDevSummary, analyzeCodebasePatterns } from "../services/ai.js";
import { info, formatGitError } from "../utils/logger.js";

export async function runContent(config) {
  try {
    info("Loading the latest commit history...");
    const commits = await getRecentCommits({ maxCount: 5 });

    if (!commits.length) {
      return { result: "No commits were found in the current repository. Please run this inside a Git repo with commit history.", aiUsed: false };
    }

    const summaryResult = await generateDevSummary(commits, config);
    const patternResult = await analyzeCodebasePatterns(commits, config);

    const aiUsed = summaryResult.aiUsed || patternResult.aiUsed;
    const result = formatThread(commits, summaryResult.text, "content", patternResult.text);
    return { result, aiUsed };
  } catch (err) {
    if (err instanceof NotGitRepoError) {
      formatGitError();
      throw err;
    }
    throw err;
  }
}