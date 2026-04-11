import simpleGit from "simple-git";

const git = simpleGit({ baseDir: process.cwd() });

class NotGitRepoError extends Error {
  constructor(message = "Not a Git repository") {
    super(message);
    this.name = "NotGitRepoError";
  }
}

async function ensureRepository() {
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new NotGitRepoError();
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

export async function getTodayCommits() {
  await ensureRepository();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const log = await git.log();
  const todayCommits = log.all
    .filter((commit) => {
      const commitDate = new Date(commit.date);
      return commitDate >= startOfDay;
    })
    .map((commit) => ({
      hash: commit.hash,
      author: commit.author_name,
      date: commit.date,
      message: commit.message,
    }));

  return todayCommits;
}

export async function getDiffSummary() {
  await ensureRepository();
  return git.diffSummary();
}

export { NotGitRepoError };
