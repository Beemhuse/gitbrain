import simpleGit from "simple-git";

const git = simpleGit({ baseDir: process.cwd() });

async function ensureRepository() {
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error("Current directory is not a Git repository. Run this command inside a repository root.");
  }
}

export async function getRecentCommits(options = { maxCount: 5 }) {
  await ensureRepository();
  const { maxCount } = options;
  const log = await git.log({ maxCount });
  return log.all.map((commit) => ({
    hash: commit.hash,
    author: commit.author_name,
    date: commit.date,
    message: commit.message,
  }));
}

export async function getDiffSummary() {
  await ensureRepository();
  return git.diffSummary();
}