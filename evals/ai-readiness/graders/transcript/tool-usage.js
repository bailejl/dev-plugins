/**
 * evals/ai-readiness/graders/transcript/tool-usage.js
 *
 * Validates tool usage patterns in agent transcripts.
 * Checks that the agent:
 * - Used grep/glob/find before making claims
 * - Read relevant files before scoring
 * - Used git commands for git-health assessments
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context (may include transcript)
 * @returns {{ pass: boolean, score: number, reason: string }}
 */

const path = require("path");

// Tools that indicate evidence gathering
const EVIDENCE_TOOLS = ["Read", "Glob", "Grep", "Bash"];
const GIT_TOOL_PATTERNS = [/\bgit\b/i];
const FILE_READ_TOOLS = ["Read"];
const SEARCH_TOOLS = ["Glob", "Grep"];

function grade(output, context) {
  const transcript = context.vars?.__transcript || context.transcript;

  // If no transcript available, check output for evidence of tool usage
  if (!transcript) {
    return gradeFromOutput(output);
  }

  // Use transcript-utils if available
  let turns;
  try {
    const { parseTranscript, getToolSequence } = require(
      path.resolve(context.vars?.graderLibRoot || "../../eval-infra/grader-lib", "transcript-utils.js")
    );
    turns = parseTranscript(transcript);
    const toolSeq = getToolSequence(turns);
    return gradeFromTools(toolSeq, turns);
  } catch {
    return gradeFromOutput(output);
  }
}

/**
 * Grade based on parsed tool sequence from transcript.
 */
function gradeFromTools(toolSequence, turns) {
  const checks = [];

  // Check 1: Used search tools (Glob/Grep) to explore before concluding
  const searchCount = toolSequence.filter((t) =>
    SEARCH_TOOLS.includes(t)
  ).length;
  checks.push({
    name: "Used search tools",
    passed: searchCount >= 1,
    detail: `${searchCount} search tool calls (Glob/Grep)`,
  });

  // Check 2: Read files before making claims
  const readCount = toolSequence.filter((t) =>
    FILE_READ_TOOLS.includes(t)
  ).length;
  checks.push({
    name: "Read files",
    passed: readCount >= 2,
    detail: `${readCount} file reads`,
  });

  // Check 3: Used evidence-gathering tools in general
  const evidenceCount = toolSequence.filter((t) =>
    EVIDENCE_TOOLS.includes(t)
  ).length;
  checks.push({
    name: "Evidence gathering",
    passed: evidenceCount >= 3,
    detail: `${evidenceCount} evidence-gathering tool calls`,
  });

  // Check 4: For git-related tasks, used git commands
  const bashCalls = turns
    .flatMap((t) => t.toolCalls || [])
    .filter((tc) => tc.name === "Bash");
  const gitCommandCount = bashCalls.filter((tc) =>
    GIT_TOOL_PATTERNS.some((p) => p.test(JSON.stringify(tc.args)))
  ).length;
  // Only require git commands if the output mentions git health
  const isGitTask = /git.?health|branch|commit.*history/i.test(
    turns.map((t) => t.content).join(" ")
  );
  if (isGitTask) {
    checks.push({
      name: "Used git commands",
      passed: gitCommandCount >= 1,
      detail: `${gitCommandCount} git commands via Bash`,
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const score = passedCount / checks.length;
  const pass = score >= 0.7;

  const details = checks
    .map((c) => `${c.passed ? "PASS" : "FAIL"}: ${c.name} — ${c.detail}`)
    .join("; ");

  return {
    pass,
    score,
    reason: `${passedCount}/${checks.length} tool usage checks passed. ${details}`,
  };
}

/**
 * Fallback: grade based on output content when transcript is unavailable.
 */
function gradeFromOutput(output) {
  const text = output || "";

  // Check for evidence of tool usage in the output
  const hasFileRefs = /\w+\.\w+:\d+/.test(text);
  const hasCodeBlocks = /```/.test(text);
  const hasGitOutput = /commit\s+[a-f0-9]{7,}|branch.*\bmain\b/i.test(text);

  const evidenceScore =
    (hasFileRefs ? 0.4 : 0) +
    (hasCodeBlocks ? 0.3 : 0) +
    (hasGitOutput ? 0.3 : 0);

  return {
    pass: evidenceScore >= 0.4,
    score: evidenceScore,
    reason: `Transcript not available. Output evidence: file refs=${hasFileRefs}, code blocks=${hasCodeBlocks}, git output=${hasGitOutput}`,
  };
}

module.exports = grade;
