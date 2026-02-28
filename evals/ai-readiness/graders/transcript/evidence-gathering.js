/**
 * evals/ai-readiness/graders/transcript/evidence-gathering.js
 *
 * Validates evidence-first workflow in agent transcripts.
 * Checks that the agent:
 * - Gathered evidence before producing findings
 * - Didn't make conclusions without reading files
 * - Used multiple evidence sources
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, evidenceActions: number, totalActions: number }}
 */

const path = require("path");

const EVIDENCE_TOOL_NAMES = new Set([
  "Read", "Glob", "Grep", "Bash",
]);

function grade(output, context) {
  const transcript = context.vars?.__transcript || context.transcript;

  if (!transcript) {
    return gradeFromOutput(output);
  }

  let turns;
  try {
    const { parseTranscript } = require(
      path.resolve(context.vars?.graderLibRoot || "../../eval-infra/grader-lib", "transcript-utils.js")
    );
    turns = parseTranscript(transcript);
  } catch {
    return gradeFromOutput(output);
  }

  return gradeFromTranscript(turns);
}

function gradeFromTranscript(turns) {
  // Categorize assistant turns
  let evidenceActions = 0;
  let totalActions = 0;
  let firstFindingTurn = -1;
  let lastEvidenceTurn = -1;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== "assistant") continue;

    const toolCalls = turn.toolCalls || [];
    for (const tc of toolCalls) {
      totalActions++;
      if (EVIDENCE_TOOL_NAMES.has(tc.name)) {
        evidenceActions++;
        lastEvidenceTurn = i;
      }
    }

    // Check if this turn contains findings/conclusions
    if (firstFindingTurn === -1) {
      const hasFinding =
        /(?:finding|issue|problem|vulnerability|violation|recommendation)/i.test(turn.content) &&
        turn.content.length > 200;
      if (hasFinding) {
        firstFindingTurn = i;
      }
    }
  }

  const checks = [];

  // Check 1: Evidence gathered before conclusions
  if (firstFindingTurn >= 0) {
    const evidenceBeforeFindings = lastEvidenceTurn < firstFindingTurn || lastEvidenceTurn === -1;
    // Actually we want evidence to come BEFORE findings, but also during
    // The key check: was there evidence gathering before the first finding?
    const hadEvidenceFirst = turns.slice(0, firstFindingTurn).some((t) =>
      (t.toolCalls || []).some((tc) => EVIDENCE_TOOL_NAMES.has(tc.name))
    );
    checks.push({
      name: "Evidence before findings",
      passed: hadEvidenceFirst,
      detail: hadEvidenceFirst
        ? "Agent gathered evidence before producing findings"
        : "Agent produced findings before gathering evidence",
    });
  }

  // Check 2: Multiple evidence sources used
  const uniqueEvidenceTools = new Set();
  for (const turn of turns) {
    for (const tc of turn.toolCalls || []) {
      if (EVIDENCE_TOOL_NAMES.has(tc.name)) {
        uniqueEvidenceTools.add(tc.name);
      }
    }
  }
  checks.push({
    name: "Multiple evidence sources",
    passed: uniqueEvidenceTools.size >= 2,
    detail: `Used ${uniqueEvidenceTools.size} different evidence tools: ${[...uniqueEvidenceTools].join(", ")}`,
  });

  // Check 3: Sufficient evidence gathering ratio
  const evidenceRatio = totalActions > 0 ? evidenceActions / totalActions : 0;
  checks.push({
    name: "Evidence gathering ratio",
    passed: evidenceRatio >= 0.4,
    detail: `${evidenceActions}/${totalActions} actions were evidence-gathering (${Math.round(evidenceRatio * 100)}%, threshold: 40%)`,
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const score = passedCount / checks.length;
  const pass = score >= 0.6;

  const details = checks
    .map((c) => `${c.passed ? "PASS" : "FAIL"}: ${c.name} — ${c.detail}`)
    .join("; ");

  return {
    pass,
    score,
    reason: details,
    evidenceActions,
    totalActions,
  };
}

function gradeFromOutput(output) {
  const text = output || "";
  const hasEvidence =
    /\w+\.\w+:\d+/.test(text) || /```[\s\S]*?```/.test(text);

  return {
    pass: hasEvidence,
    score: hasEvidence ? 0.5 : 0,
    reason: `Transcript not available. Output ${hasEvidence ? "contains" : "lacks"} evidence references.`,
    evidenceActions: 0,
    totalActions: 0,
  };
}

module.exports = grade;
