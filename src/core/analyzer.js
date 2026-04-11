function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const CRITICAL_PATTERNS = {
  auth: /auth|oauth|jwt|password|credential|session|token|login/i,
  payment: /payment|stripe|paypal|checkout|billing|credit|invoice|transaction|card/i,
  security: /crypto|secret|encryption|ssl|certificate|tls|https/i,
  config: /config|env|\.env|settings|database|connection|api/i,
  core: /core|kernel|engine|main\.js|index\.js|package\.json/i,
};

function detectCriticalFiles(diff) {
  const criticalFiles = {
    auth: [],
    payment: [],
    security: [],
    config: [],
    core: [],
  };

  if (!Array.isArray(diff.files)) {
    return criticalFiles;
  }

  diff.files.forEach((file) => {
    const filePath = typeof file === "string" ? file : file.file || file.name || "";
    const lowerPath = filePath.toLowerCase();

    Object.entries(CRITICAL_PATTERNS).forEach(([category, pattern]) => {
      if (pattern.test(lowerPath)) {
        criticalFiles[category].push(filePath);
      }
    });
  });

  return criticalFiles;
}

function calculateCriticalRiskBonus(criticalFiles) {
  let bonus = 0;

  Object.entries(criticalFiles).forEach(([category, files]) => {
    if (files.length > 0) {
      const multiplier = category === "payment" ? 40 : category === "auth" ? 35 : category === "security" ? 35 : 20;
      bonus += multiplier;
    }
  });

  return bonus;
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

  const criticalFiles = detectCriticalFiles(diff);
  const criticalBonus = calculateCriticalRiskBonus(criticalFiles);
  score += criticalBonus;

  return {
    score: clamp(score, 0, 100),
    criticalFiles,
    hasCritical: Object.values(criticalFiles).some((files) => files.length > 0),
  };
}