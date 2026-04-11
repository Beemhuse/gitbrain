export function summarizeCommits(commits) {
  const messages = commits.map((commit) => commit.message.trim()).filter(Boolean);
  if (!messages.length) {
    return "A short summary of recent repository activity is not available.";
  }

  const topAction = discoverPrimaryAction(messages);
  return `A concise update for the last ${commits.length} commits focused on ${topAction}.`;
}

function discoverPrimaryAction(messages) {
  const verbs = messages.map((message) => {
    const normalized = message.toLowerCase();
    return normalized.split(/\s+/)[0].replace(/[^a-z]/g, "");
  });

  const counts = verbs.reduce((acc, verb) => {
    if (!verb) return acc;
    acc[verb] = (acc[verb] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : "changes";
}
