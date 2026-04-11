import { getRecentCommits } from "../core/git.js";
import { formatThread } from "../core/formatter.js";
import { summarizeCommits } from "../services/ai.js";
import { info } from "../utils/logger.js";

export async function runContent() {
  info("Loading the latest commit history...");
  const commits = await getRecentCommits({ maxCount: 5 });

  if (!commits.length) {
    return "No commits were found in the current repository. Please run this inside a Git repo with commit history.";
  }

  const summary = summarizeCommits(commits);
  return formatThread(commits, summary);
}