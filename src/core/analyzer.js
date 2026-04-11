function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function calculateRisk(diff) {
  const files = Array.isArray(diff.files) ? diff.files.length : normalizeNumber(diff.files);
  const insertions = normalizeNumber(diff.insertions);
  const deletions = normalizeNumber(diff.deletions);

  let score = 0;
  if (files > 10) score += 35;
  else if (files > 5) score += 20;
  else if (files > 0) score += 10;

  if (insertions > 500) score += 35;
  else if (insertions > 200) score += 20;
  else if (insertions > 0) score += 10;

  if (deletions > 500) score += 30;
  else if (deletions > 200) score += 15;
  else if (deletions > 0) score += 8;

  return clamp(score, 0, 100);
}