import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { warn } from "../utils/logger.js";

function normalizeProvider(provider) {
  const value = provider?.toString().trim().toLowerCase();
  if (value === "gemini") {
    return "gemini";
  }
  if (value === "openai") {
    return "openai";
  }
  return "openai";
}

function getEnvKey(provider) {
  const normalized = normalizeProvider(provider);
  if (normalized === "gemini") {
    return process.env.GEMINI_API_KEY || null;
  }
  return process.env.OPENAI_API_KEY || null;
}

export { getEnvKey };

function getEnvModel(provider) {
  if (normalizeProvider(provider) === "gemini") {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
}

function parseGeminiText(result) {
  const candidate = result?.candidates?.[0];
  if (!candidate) {
    return "";
  }

  if (typeof candidate.output === "string") {
    return candidate.output;
  }

  if (Array.isArray(candidate.output)) {
    for (const item of candidate.output) {
      if (typeof item === "string") {
        return item;
      }
      if (item?.content) {
        const contentArray = Array.isArray(item.content) ? item.content : [item.content];
        for (const part of contentArray) {
          if (typeof part?.text === "string") {
            return part.text;
          }
        }
      }
    }
  }

  return result?.candidates?.[0]?.content?.[0]?.text || "";
}

async function callLLM(systemPrompt, userPrompt, config) {
  const provider = normalizeProvider(config?.provider);
  const apiKey = config?.apiKey || getEnvKey(provider);

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const model = getEnvModel(provider);

  if (provider === "gemini") {
    const client = new GoogleGenerativeAI(apiKey);
    const modelClient = client.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    const response = await modelClient.generateContent({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
    });

    return parseGeminiText(response).trim();
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 500,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

function collectCommitMessages(commits) {
  return commits
    .map((commit) => (typeof commit === "string" ? commit : commit.message || ""))
    .filter(Boolean);
}

function fallbackSummary(commits) {
  const messages = collectCommitMessages(commits);
  if (!messages.length) {
    return "No commit messages available to summarize.";
  }

  const topMessages = messages.slice(0, 5).map((message) => `• ${message}`);
  return `Recent work includes ${messages.length} update${messages.length > 1 ? "s" : ""}. ${topMessages.join(" ")}`;
}

function fallbackRiskAnalysis(diffSummary) {
  const files = Array.isArray(diffSummary.files) ? diffSummary.files.length : diffSummary.files;
  const insertions = diffSummary.insertions ?? 0;
  const deletions = diffSummary.deletions ?? 0;

  const points = [`This diff touches ${files} file${files === 1 ? "" : "s"}.`, `Insertions: ${insertions}, deletions: ${deletions}.`, `Larger insertions or deletions increase the chance of regression.`];
  return points.join(" ");
}

function fallbackCodebasePatterns(commits) {
  const messages = collectCommitMessages(commits);
  if (!messages.length) {
    return "No commit history available to identify codebase patterns.";
  }

  const lower = messages.map((message) => message.toLowerCase());
  const aiSignals = lower.filter((message) => /\b(ai|gpt|copilot|generated|auto-generated|openai)\b/.test(message));
  const duplicates = messages.filter((message, index) => messages.indexOf(message) !== index);
  const styles = new Set(messages.map((message) => message.trim().match(/^[^:\-\s]+/)?.[0]?.toLowerCase() || "").filter(Boolean));

  const observations = [];
  if (aiSignals.length) {
    observations.push("Commit history includes language that may indicate AI-assisted or generated work.");
  }
  if (duplicates.length) {
    observations.push("Some messages repeat, which can indicate duplicate work or inconsistent commit granularity.");
  }
  if (styles.size > 2) {
    observations.push("Commit message style is inconsistent, which may reflect varying structure in the codebase.");
  }

  return observations.length ? observations.join(" ") : "No strong patterns identified in the commit history.";
}

export async function generateDevSummary(commits, config) {
  const messages = collectCommitMessages(commits);
  if (!messages.length) {
    return { text: "No commit messages available to summarize.", aiUsed: false };
  }

  const systemPrompt = "You are an intelligent developer assistant that writes concise developer summaries in clear, human language without markdown.";
  const userPrompt = `Summarize the following commit messages as a developer update. Explain the work and its impact in a natural devlog tone. Do not use markdown. Commit messages:\n${messages.join("\n")}`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, config);
    return { text: text.trim() || fallbackSummary(commits), aiUsed: true };
  } catch (err) {
    warn(`AI summary failed: ${err.message}. Using fallback summary.`);
    return { text: fallbackSummary(commits), aiUsed: false };
  }
}

export async function analyzeRiskWithAI(diffSummary, config) {
  const combined = `Files changed: ${Array.isArray(diffSummary.files) ? diffSummary.files.length : diffSummary.files}. Insertions: ${diffSummary.insertions ?? 0}. Deletions: ${diffSummary.deletions ?? 0}.`;
  const systemPrompt = "You are an engineering risk analyst. Provide a clear explanation of risk and likely failure points based on diff metrics.";
  const userPrompt = `Analyze the following diff summary. Explain why the changes may be risky, identify possible failure points, and describe what the team should watch for. Do not use markdown. Summary: ${combined}`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, config);
    return { text: text.trim() || fallbackRiskAnalysis(diffSummary), aiUsed: true };
  } catch (err) {
    warn(`AI risk analysis failed: ${err.message}. Using fallback risk explanation.`);
    return { text: fallbackRiskAnalysis(diffSummary), aiUsed: false };
  }
}

export async function analyzeCodebasePatterns(commits, config) {
  const messages = collectCommitMessages(commits);
  if (!messages.length) {
    return { text: "No commit history available to identify codebase patterns.", aiUsed: false };
  }

  const systemPrompt = "You are an engineering assistant that detects codebase quality patterns from commit history.";
  const userPrompt = `Review the following commit messages and describe any signs of AI-generated code patterns, duplication, or inconsistent structure. Keep the answer brief and plain text.\n${messages.join("\n")}`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, config);
    return { text: text.trim() || fallbackCodebasePatterns(commits), aiUsed: true };
  } catch (err) {
    warn(`AI codebase pattern analysis failed: ${err.message}. Using fallback pattern analysis.`);
    return { text: fallbackCodebasePatterns(commits), aiUsed: false };
  }
}

export function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    refactoring: [],
    docs: [],
    other: [],
  };

  commits.forEach((commit) => {
    const message = (typeof commit === "string" ? commit : commit.message || "").toLowerCase().trim();
    if (message.startsWith("feat") || message.includes("add") || message.includes("new")) {
      categories.features.push(commit);
    } else if (message.startsWith("fix") || message.includes("fix")) {
      categories.fixes.push(commit);
    } else if (message.startsWith("refactor") || message.includes("refactor") || message.includes("cleanup")) {
      categories.refactoring.push(commit);
    } else if (message.startsWith("docs") || message.includes("doc")) {
      categories.docs.push(commit);
    } else {
      categories.other.push(commit);
    }
  });

  return categories;
}

export function extractHighlights(commits) {
  const categories = categorizeCommits(commits);
  const highlights = [];

  if (categories.features.length > 0) {
    const topFeature = cleanMessage(categories.features[0].message);
    highlights.push(`✨ Key feature: ${topFeature}`);
  }

  if (categories.fixes.length > 0) {
    const topFix = cleanMessage(categories.fixes[0].message);
    highlights.push(`🐛 Fixed: ${topFix}`);
  }

  return highlights;
}

function cleanMessage(msg) {
  return msg
    .trim()
    .replace(/^(feat|fix|refactor|docs)\s*:?\s*/i, "")
    .replace(/^#\d+\s+/g, "")
    .replace(/\s+$/, "");
}
