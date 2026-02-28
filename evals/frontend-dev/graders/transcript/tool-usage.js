/**
 * evals/frontend-dev/graders/transcript/tool-usage.js
 *
 * Transcript-based grader that evaluates the agent's tool usage patterns.
 * Checks that the agent reads before writing, uses appropriate search tools,
 * and follows evidence-first workflows.
 *
 * Imports shared utilities from eval-infra/grader-lib/transcript-utils.js.
 *
 * @param {string} output - The agent's final output
 * @param {Object} context - Promptfoo context
 * @param {string|Object} context.vars.transcript - The conversation transcript
 * @param {Object} [context.vars.toolRequirements] - Requirements for tool usage
 * @param {string[]} [context.vars.toolRequirements.mustUse] - Tools that must appear
 * @param {string[]} [context.vars.toolRequirements.mustNotUse] - Tools that must NOT appear
 * @param {boolean} [context.vars.toolRequirements.readBeforeWrite] - Must read files before editing
 * @param {number} [context.vars.toolRequirements.maxTurns] - Maximum allowed turns
 * @returns {{ pass: boolean, score: number, reason: string }}
 */

const path = require("path");

// Import shared transcript utilities
const transcriptUtils = (() => {
  try {
    return require(
      path.resolve(__dirname, "../../../../eval-infra/grader-lib/transcript-utils.js")
    );
  } catch {
    // Fallback: minimal implementations if the import fails
    return {
      parseTranscript: (raw) => (Array.isArray(raw) ? raw : []),
      countToolCalls: () => 0,
      getToolSequence: () => [],
      getTurnCount: () => 0,
    };
  }
})();

/**
 * Check that Read/Glob/Grep appears before Edit/Write in the tool sequence.
 *
 * @param {string[]} sequence - Ordered tool names
 * @returns {{ pass: boolean, reason: string }}
 */
function checkReadBeforeWrite(sequence) {
  const readTools = new Set(["read", "glob", "grep"]);
  const writeTools = new Set(["edit", "write"]);

  let hasRead = false;
  let firstWriteWithoutRead = null;

  for (const tool of sequence) {
    const lower = tool.toLowerCase();
    if (readTools.has(lower)) {
      hasRead = true;
    }
    if (writeTools.has(lower) && !hasRead) {
      firstWriteWithoutRead = tool;
      break;
    }
  }

  if (firstWriteWithoutRead) {
    return {
      pass: false,
      reason: `${firstWriteWithoutRead} called before any Read/Glob/Grep`,
    };
  }

  return { pass: true, reason: "Read before write pattern followed" };
}

/**
 * Check that required tools were used.
 *
 * @param {string[]} sequence - Ordered tool names
 * @param {string[]} mustUse - Tools that must appear
 * @returns {{ found: string[], missed: string[] }}
 */
function checkRequiredTools(sequence, mustUse) {
  const lowerSequence = sequence.map((t) => t.toLowerCase());
  const found = [];
  const missed = [];

  for (const tool of mustUse) {
    if (lowerSequence.includes(tool.toLowerCase())) {
      found.push(tool);
    } else {
      missed.push(tool);
    }
  }

  return { found, missed };
}

/**
 * Check that forbidden tools were not used.
 *
 * @param {string[]} sequence - Ordered tool names
 * @param {string[]} mustNotUse - Tools that must NOT appear
 * @returns {{ violations: string[] }}
 */
function checkForbiddenTools(sequence, mustNotUse) {
  const lowerSequence = sequence.map((t) => t.toLowerCase());
  const violations = [];

  for (const tool of mustNotUse) {
    if (lowerSequence.includes(tool.toLowerCase())) {
      violations.push(tool);
    }
  }

  return { violations };
}

/**
 * Main grader function.
 *
 * @param {string} output - Agent output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string }}
 */
function grade(output, context) {
  const vars = context.vars || {};
  const transcript = vars.transcript;
  const requirements = vars.toolRequirements || {};

  if (!transcript) {
    return {
      pass: false,
      score: 0,
      reason: "No transcript provided for tool usage analysis",
    };
  }

  const sequence = transcriptUtils.getToolSequence(transcript);
  const turnCount = transcriptUtils.getTurnCount(transcript);

  if (sequence.length === 0) {
    return {
      pass: false,
      score: 0,
      reason: "No tool calls found in transcript",
    };
  }

  const issues = [];
  let checksTotal = 0;
  let checksPassed = 0;

  // Check read-before-write
  if (requirements.readBeforeWrite !== false) {
    checksTotal++;
    const rbw = checkReadBeforeWrite(sequence);
    if (rbw.pass) {
      checksPassed++;
    } else {
      issues.push(rbw.reason);
    }
  }

  // Check required tools
  if (requirements.mustUse && requirements.mustUse.length > 0) {
    const { found, missed } = checkRequiredTools(
      sequence,
      requirements.mustUse
    );
    checksTotal += requirements.mustUse.length;
    checksPassed += found.length;
    if (missed.length > 0) {
      issues.push(`Missing required tools: ${missed.join(", ")}`);
    }
  }

  // Check forbidden tools
  if (requirements.mustNotUse && requirements.mustNotUse.length > 0) {
    const { violations } = checkForbiddenTools(
      sequence,
      requirements.mustNotUse
    );
    checksTotal += requirements.mustNotUse.length;
    checksPassed += requirements.mustNotUse.length - violations.length;
    if (violations.length > 0) {
      issues.push(`Forbidden tools used: ${violations.join(", ")}`);
    }
  }

  // Check max turns
  if (requirements.maxTurns && turnCount > requirements.maxTurns) {
    checksTotal++;
    issues.push(
      `Too many turns: ${turnCount} (max: ${requirements.maxTurns})`
    );
  } else if (requirements.maxTurns) {
    checksTotal++;
    checksPassed++;
  }

  // Compute score
  const score = checksTotal > 0 ? checksPassed / checksTotal : 1;
  const pass = issues.length === 0;

  const summary = [
    `${sequence.length} tool calls across ${turnCount} turns`,
    `Tools used: ${[...new Set(sequence)].join(", ")}`,
  ];

  if (issues.length > 0) {
    summary.push(`Issues: ${issues.join("; ")}`);
  } else {
    summary.push("All tool usage checks passed");
  }

  return {
    pass,
    score,
    reason: summary.join(". "),
  };
}

module.exports = grade;
