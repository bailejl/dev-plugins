/**
 * evals/ai-readiness/graders/deterministic/evidence-cited.js
 *
 * Validates that findings cite specific evidence such as
 * file paths, line numbers, git commands, or code snippets.
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, findingsWithEvidence: number, totalFindings: number }}
 */

const { extractFindings, findingHasEvidence } = require("../../../../eval-infra/grader-lib/finding-parser");

function grade(output, context) {
  const text = output || "";

  if (!text.trim()) {
    return {
      pass: false,
      score: 0,
      reason: "Output is empty",
      findingsWithEvidence: 0,
      totalFindings: 0,
    };
  }

  const findings = extractFindings(text);
  const totalFindings = findings.length;

  if (totalFindings === 0) {
    // If we can't parse findings, check if the overall report has evidence
    const hasAnyEvidence = findingHasEvidence(text);
    return {
      pass: hasAnyEvidence,
      score: hasAnyEvidence ? 0.5 : 0,
      reason: hasAnyEvidence
        ? "Could not parse individual findings, but report contains evidence references"
        : "No findings or evidence found in output",
      findingsWithEvidence: 0,
      totalFindings: 0,
    };
  }

  let findingsWithEvidence = 0;
  for (const finding of findings) {
    if (findingHasEvidence(finding.body)) {
      findingsWithEvidence++;
    }
  }

  const ratio = findingsWithEvidence / totalFindings;

  // Partial credit: linear interpolation between 0.3 and 0.7
  let score;
  if (ratio >= 0.7) {
    score = 1;
  } else if (ratio >= 0.3) {
    score = 0.3 + (ratio - 0.3) * (0.7 / 0.4);
  } else {
    score = ratio;
  }

  // Pass if at least 50% of findings cite evidence
  const pass = ratio >= 0.5;

  return {
    pass,
    score,
    reason: `${findingsWithEvidence}/${totalFindings} findings cite specific evidence (threshold: 50%)`,
    findingsWithEvidence,
    totalFindings,
  };
}

module.exports = grade;
