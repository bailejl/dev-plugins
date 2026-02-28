/**
 * eval-infra/grader-lib/transcript-utils.js
 *
 * Utilities for parsing and analyzing promptfoo transcripts.
 * Used by eval graders to inspect agent behavior — tool calls,
 * turn counts, evidence gathering patterns, etc.
 *
 * @module transcript-utils
 */

/**
 * @typedef {Object} Turn
 * @property {string} role - "user", "assistant", or "system"
 * @property {string} content - Text content of the turn
 * @property {ToolCall[]} toolCalls - Tool calls made in this turn
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} name - Tool/function name (e.g., "Read", "Bash", "Glob")
 * @property {Object} args - Arguments passed to the tool
 * @property {string} [result] - Tool result if available
 */

/**
 * Parse a raw transcript string into structured turns.
 *
 * Handles multiple transcript formats:
 * - promptfoo's default conversation array format
 * - Stringified JSON arrays of messages
 * - Plain text with role markers ("User:", "Assistant:", etc.)
 *
 * @param {string|Object[]|Object} raw - Raw transcript data
 * @returns {Turn[]} Parsed turns
 */
function parseTranscript(raw) {
  if (!raw) return [];

  // If already an array of message objects
  if (Array.isArray(raw)) {
    return raw.map(normalizeTurn);
  }

  // If it's an object with a messages or transcript field
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const messages = raw.messages || raw.transcript || raw.conversation || [];
    if (Array.isArray(messages)) {
      return messages.map(normalizeTurn);
    }
  }

  // If it's a string, try to parse as JSON
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseTranscript(parsed);
    } catch {
      // Fall through to plain text parsing
    }

    return parseTextTranscript(raw);
  }

  return [];
}

/**
 * Normalize a message object into a Turn.
 *
 * @param {Object} msg - Raw message object
 * @returns {Turn}
 */
function normalizeTurn(msg) {
  const role = (msg.role || "unknown").toLowerCase();

  // Extract text content
  let content = "";
  if (typeof msg.content === "string") {
    content = msg.content;
  } else if (Array.isArray(msg.content)) {
    content = msg.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
  }

  // Extract tool calls
  const toolCalls = [];

  // Format: msg.tool_calls or msg.toolCalls
  const rawToolCalls = msg.tool_calls || msg.toolCalls || [];
  for (const tc of rawToolCalls) {
    toolCalls.push({
      name: tc.function?.name || tc.name || "unknown",
      args: parseArgs(tc.function?.arguments || tc.args || tc.input || {}),
      result: tc.result || tc.output || undefined,
    });
  }

  // Format: content blocks with type "tool_use"
  if (Array.isArray(msg.content)) {
    for (const block of msg.content) {
      if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name || "unknown",
          args: block.input || {},
          result: undefined,
        });
      }
    }
  }

  return { role, content, toolCalls };
}

/**
 * Parse tool call arguments that may be a string or object.
 *
 * @param {string|Object} args
 * @returns {Object}
 */
function parseArgs(args) {
  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch {
      return { raw: args };
    }
  }
  return args || {};
}

/**
 * Parse a plain text transcript with role markers.
 *
 * @param {string} text
 * @returns {Turn[]}
 */
function parseTextTranscript(text) {
  const turns = [];
  const lines = text.split("\n");
  let currentRole = "unknown";
  let currentContent = [];

  const rolePatterns = [
    { pattern: /^(?:Human|User):\s*/i, role: "user" },
    { pattern: /^(?:Assistant|Claude|AI):\s*/i, role: "assistant" },
    { pattern: /^System:\s*/i, role: "system" },
  ];

  for (const line of lines) {
    let matched = false;
    for (const { pattern, role } of rolePatterns) {
      if (pattern.test(line)) {
        // Save previous turn
        if (currentContent.length > 0) {
          turns.push({
            role: currentRole,
            content: currentContent.join("\n").trim(),
            toolCalls: [],
          });
        }
        currentRole = role;
        currentContent = [line.replace(pattern, "")];
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentContent.push(line);
    }
  }

  // Save last turn
  if (currentContent.length > 0) {
    turns.push({
      role: currentRole,
      content: currentContent.join("\n").trim(),
      toolCalls: [],
    });
  }

  return turns;
}

/**
 * Count the number of times a specific tool was called in the transcript.
 *
 * @param {Turn[]|string|Object} transcript - Parsed turns or raw transcript
 * @param {string} toolName - Tool name to count (case-insensitive)
 * @returns {number} Number of times the tool was called
 */
function countToolCalls(transcript, toolName) {
  const turns = Array.isArray(transcript)
    ? transcript
    : parseTranscript(transcript);
  const lowerName = toolName.toLowerCase();

  let count = 0;
  for (const turn of turns) {
    for (const tc of turn.toolCalls || []) {
      if (tc.name.toLowerCase() === lowerName) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Extract the ordered sequence of tool names used in the transcript.
 *
 * @param {Turn[]|string|Object} transcript - Parsed turns or raw transcript
 * @returns {string[]} Ordered list of tool names
 */
function getToolSequence(transcript) {
  const turns = Array.isArray(transcript)
    ? transcript
    : parseTranscript(transcript);

  const sequence = [];
  for (const turn of turns) {
    for (const tc of turn.toolCalls || []) {
      sequence.push(tc.name);
    }
  }
  return sequence;
}

/**
 * Search the transcript for evidence matching a pattern.
 *
 * Searches both turn content and tool call results.
 *
 * @param {Turn[]|string|Object} transcript - Parsed turns or raw transcript
 * @param {string|RegExp} pattern - Pattern to search for
 * @returns {Object[]} Matches with context: [{turnIndex, role, match, context}]
 */
function findEvidence(transcript, pattern) {
  const turns = Array.isArray(transcript)
    ? transcript
    : parseTranscript(transcript);

  const regex =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, "gi");
  const matches = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];

    // Search turn content
    const contentMatches = turn.content.match(regex);
    if (contentMatches) {
      for (const m of contentMatches) {
        const idx = turn.content.indexOf(m);
        const start = Math.max(0, idx - 50);
        const end = Math.min(turn.content.length, idx + m.length + 50);
        matches.push({
          turnIndex: i,
          role: turn.role,
          match: m,
          context: turn.content.slice(start, end),
        });
      }
    }

    // Search tool call results
    for (const tc of turn.toolCalls || []) {
      if (tc.result) {
        const resultMatches = tc.result.match(regex);
        if (resultMatches) {
          for (const m of resultMatches) {
            matches.push({
              turnIndex: i,
              role: turn.role,
              match: m,
              context: `[${tc.name}] ${m}`,
            });
          }
        }
      }
    }
  }

  return matches;
}

/**
 * Count the total number of turns in a transcript.
 *
 * @param {Turn[]|string|Object} transcript - Parsed turns or raw transcript
 * @returns {number} Total turn count
 */
function getTurnCount(transcript) {
  const turns = Array.isArray(transcript)
    ? transcript
    : parseTranscript(transcript);
  return turns.length;
}

module.exports = {
  parseTranscript,
  countToolCalls,
  getToolSequence,
  findEvidence,
  getTurnCount,
};
