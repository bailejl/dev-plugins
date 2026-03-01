/**
 * evals/ai-readiness/graders/deterministic/severity-accuracy.js
 *
 * Validates that severity ratings match expected findings.
 * Checks that critical issues are rated critical (not downgraded).
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @param {Object[]} context.vars.expectedFindings - Array of { pattern: string, severity: string }
 * @returns {{ pass: boolean, score: number, reason: string, falseDowngrades: string[] }}
 */

const { extractFindings } = require("../../../../eval-infra/grader-lib/finding-parser");

const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  major: 3,
  medium: 2,
  moderate: 2,
  minor: 1,
  low: 1,
  info: 0,
  informational: 0,
};

function grade(output, context) {
  const text = (output || "").toLowerCase();
  const vars = context.vars || {};
  const expectedFindings = vars.expectedFindings || [];

  if (expectedFindings.length === 0) {
    return {
      pass: true,
      score: 0.5,
      reason: "No expectedFindings configured — severity check skipped",
      falseDowngrades: [],
    };
  }

  // Parse findings from the output using shared utility
  const parsedFindings = extractFindings(output || "");

  const found = [];
  const notFound = [];
  const falseDowngrades = [];

  for (const expected of expectedFindings) {
    const pattern = new RegExp(expected.pattern, "i");
    const match = text.match(pattern);

    if (!match) {
      notFound.push(`${expected.pattern} (${expected.severity})`);
      continue;
    }

    found.push(expected.pattern);

    // Check if severity was downgraded
    // Look for the severity label near the finding (within ~200 chars)
    const matchIndex = text.indexOf(match[0]);
    const context200 = text.slice(
      Math.max(0, matchIndex - 200),
      matchIndex + match[0].length + 200
    );

    const expectedLevel = SEVERITY_LEVELS[expected.severity] || 0;

    // Find what severity was assigned near this finding
    let assignedSeverity = null;
    for (const [sev, level] of Object.entries(SEVERITY_LEVELS)) {
      const sevPattern = new RegExp(`\\b${sev}\\b`, "i");
      if (sevPattern.test(context200)) {
        if (assignedSeverity === null || level > SEVERITY_LEVELS[assignedSeverity]) {
          assignedSeverity = sev;
        }
      }
    }

    if (
      assignedSeverity &&
      SEVERITY_LEVELS[assignedSeverity] < expectedLevel
    ) {
      falseDowngrades.push(
        `"${expected.pattern}" expected ${expected.severity} but found ${assignedSeverity}`
      );
    }
  }

  const detectionScore = found.length / expectedFindings.length;
  const downgradePenalty =
    falseDowngrades.length > 0
      ? falseDowngrades.length / expectedFindings.length * 0.5
      : 0;

  const score = Math.max(0, detectionScore - downgradePenalty);
  const pass = notFound.length <= 1 && falseDowngrades.length === 0;

  const reasons = [];
  reasons.push(`Detected ${found.length}/${expectedFindings.length} expected findings`);
  if (notFound.length > 0) {
    reasons.push(`Not found: ${notFound.length}`);
  }
  if (falseDowngrades.length > 0) {
    reasons.push(`Downgraded: ${falseDowngrades.join("; ")}`);
  }

  return {
    pass,
    score,
    reason: reasons.join(". "),
    falseDowngrades,
  };
}

module.exports = grade;
