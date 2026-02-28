/**
 * evals/frontend-dev/graders/deterministic/design-tokens.js
 *
 * Deterministic grader that checks whether the agent's design system audit
 * correctly identifies hardcoded values and maps them to available tokens.
 *
 * Used by design-system.yaml test suite.
 *
 * @param {string} output - The agent's compliance report output
 * @param {Object} context - Promptfoo context with vars
 * @param {Object[]} context.vars.expectedFindings - Hardcoded values the report should flag
 * @param {string} context.vars.expectedFindings[].value - The hardcoded value (e.g., "#333")
 * @param {string} context.vars.expectedFindings[].category - Category (color, spacing, etc.)
 * @param {string} [context.vars.expectedFindings[].token] - Expected token suggestion
 * @param {boolean} [context.vars.expectComplianceScore] - Whether a % score should be present
 * @returns {{ pass: boolean, score: number, reason: string }}
 */

/**
 * Escape a string for use in a regular expression.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if the output mentions a specific hardcoded value.
 *
 * @param {string} text - Lowercased output
 * @param {string} value - The value to search for (e.g., "#333", "16px")
 * @returns {boolean}
 */
function mentionsValue(text, value) {
  const escaped = escapeRegex(value.toLowerCase());
  // Allow some flexibility (e.g., "#333" might appear as "#333333")
  return new RegExp(escaped).test(text);
}

/**
 * Check if the output suggests a specific token for a value.
 *
 * @param {string} text - Lowercased output
 * @param {string} token - Token name or pattern to look for
 * @returns {boolean}
 */
function mentionsToken(text, token) {
  const escaped = escapeRegex(token.toLowerCase());
  return new RegExp(escaped).test(text);
}

/**
 * Check if the output contains a compliance percentage.
 *
 * @param {string} text - The output text
 * @returns {boolean}
 */
function hasCompliancePercentage(text) {
  // Match patterns like "81%", "Compliance: 81%", "Overall: 81%"
  return /\d{1,3}%/.test(text);
}

/**
 * Check if the output categorizes findings by type.
 *
 * @param {string} text - Lowercased output
 * @param {string[]} categories - Expected categories
 * @returns {{ found: string[], missed: string[] }}
 */
function checkCategories(text, categories) {
  const found = [];
  const missed = [];

  for (const cat of categories) {
    const pattern = new RegExp(escapeRegex(cat.toLowerCase()));
    if (pattern.test(text)) {
      found.push(cat);
    } else {
      missed.push(cat);
    }
  }

  return { found, missed };
}

/**
 * Main grader function.
 *
 * @param {string} output - Agent output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string }}
 */
function grade(output, context) {
  const text = (output || "").toLowerCase();
  const vars = context.vars || {};

  const findings = vars.expectedFindings || [];
  const expectScore = vars.expectComplianceScore !== false;

  const results = {
    valuesFound: [],
    valuesMissed: [],
    tokensFound: [],
    tokensMissed: [],
    hasScore: false,
  };

  // Check each expected finding
  for (const finding of findings) {
    if (mentionsValue(text, finding.value)) {
      results.valuesFound.push(finding.value);
    } else {
      results.valuesMissed.push(finding.value);
    }

    if (finding.token) {
      if (mentionsToken(text, finding.token)) {
        results.tokensFound.push(finding.token);
      } else {
        results.tokensMissed.push(finding.token);
      }
    }
  }

  // Check compliance score
  results.hasScore = hasCompliancePercentage(output || "");

  // Calculate score
  const totalChecks =
    findings.length + (findings.filter((f) => f.token).length) + (expectScore ? 1 : 0);

  if (totalChecks === 0) {
    return { pass: true, score: 1, reason: "No checks specified" };
  }

  const passed =
    results.valuesFound.length +
    results.tokensFound.length +
    (results.hasScore && expectScore ? 1 : 0);

  const score = passed / totalChecks;
  const pass = score >= 0.7; // Allow some tolerance

  const reasons = [];

  if (results.valuesFound.length > 0) {
    reasons.push(
      `Identified ${results.valuesFound.length}/${findings.length} hardcoded values`
    );
  }
  if (results.valuesMissed.length > 0) {
    reasons.push(`Missed values: ${results.valuesMissed.join(", ")}`);
  }
  if (results.tokensFound.length > 0) {
    reasons.push(`Suggested ${results.tokensFound.length} correct token replacements`);
  }
  if (results.tokensMissed.length > 0) {
    reasons.push(`Missing token suggestions: ${results.tokensMissed.join(", ")}`);
  }
  if (expectScore && !results.hasScore) {
    reasons.push("Missing compliance percentage score");
  }
  if (expectScore && results.hasScore) {
    reasons.push("Compliance percentage present");
  }

  return {
    pass,
    score,
    reason: reasons.join(". ") || "All checks passed",
  };
}

module.exports = grade;
