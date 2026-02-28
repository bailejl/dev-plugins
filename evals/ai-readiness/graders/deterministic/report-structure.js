/**
 * evals/ai-readiness/graders/deterministic/report-structure.js
 *
 * Validates that a report contains the required sections.
 * Parses markdown output for required headings.
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, missingHeadings: string[] }}
 */

const REQUIRED_HEADINGS = [
  { pattern: /summary|executive\s*summary|overview/i, label: "Summary" },
  {
    pattern: /score(?:card|s|\s*breakdown)|scoring|ratings?/i,
    label: "Scorecard/Score Breakdown",
  },
  {
    pattern: /(?:detailed\s*)?findings|issues|problems/i,
    label: "Detailed Findings",
  },
  {
    pattern: /recommendations?|action\s*items|next\s*steps|remediation/i,
    label: "Recommendations",
  },
];

function grade(output, context) {
  const text = output || "";

  if (!text.trim()) {
    return {
      pass: false,
      score: 0,
      reason: "Output is empty",
      missingHeadings: REQUIRED_HEADINGS.map((h) => h.label),
    };
  }

  const lines = text.split("\n");

  // Extract all headings (## or ### level)
  const headings = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }

  const found = [];
  const missing = [];

  for (const required of REQUIRED_HEADINGS) {
    const exists = headings.some((h) => required.pattern.test(h.text));
    if (exists) {
      found.push(required.label);
    } else {
      missing.push(required.label);
    }
  }

  const score = found.length / REQUIRED_HEADINGS.length;
  const pass = missing.length === 0;

  const reasons = [];
  if (found.length > 0) {
    reasons.push(`Found ${found.length}/${REQUIRED_HEADINGS.length} required sections`);
  }
  if (missing.length > 0) {
    reasons.push(`Missing: ${missing.join(", ")}`);
  }

  return {
    pass,
    score,
    reason: reasons.join(". ") || "All required sections present",
    missingHeadings: missing,
  };
}

module.exports = grade;
