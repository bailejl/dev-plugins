/**
 * evals/ai-readiness/graders/deterministic/git-commands-valid.js
 *
 * Validates that git commands referenced in git-health reports
 * are syntactically valid.
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, invalidCommands: string[] }}
 */

// Valid git subcommands that might appear in audit reports
const VALID_GIT_SUBCOMMANDS = new Set([
  "add", "am", "archive", "bisect", "blame", "branch", "bundle",
  "checkout", "cherry-pick", "clean", "clone", "commit", "config",
  "describe", "diff", "fetch", "format-patch", "gc", "grep",
  "init", "log", "merge", "mv", "notes", "pull", "push",
  "rebase", "reflog", "remote", "reset", "restore", "revert",
  "rev-list", "rev-parse", "rm", "shortlog", "show", "stash",
  "status", "submodule", "switch", "tag", "worktree",
  // Plumbing commands sometimes referenced
  "cat-file", "count-objects", "for-each-ref", "ls-files",
  "ls-remote", "ls-tree", "merge-base", "name-rev",
  "pack-objects", "prune", "read-tree", "symbolic-ref",
  "update-index", "update-ref", "verify-pack", "write-tree",
]);

function grade(output, context) {
  const text = output || "";

  if (!text.trim()) {
    return {
      pass: false,
      score: 0,
      reason: "Output is empty",
      invalidCommands: [],
    };
  }

  // Extract git commands from code blocks and inline code
  const gitCommands = extractGitCommands(text);

  if (gitCommands.length === 0) {
    return {
      pass: true,
      score: 0.5,
      reason: "No git commands found in output (expected for git-health reports)",
      invalidCommands: [],
    };
  }

  const invalidCommands = [];
  for (const cmd of gitCommands) {
    if (!isValidGitCommand(cmd)) {
      invalidCommands.push(cmd);
    }
  }

  const validCount = gitCommands.length - invalidCommands.length;
  const score = validCount / gitCommands.length;
  const pass = invalidCommands.length === 0;

  return {
    pass,
    score,
    reason: pass
      ? `All ${gitCommands.length} git commands are syntactically valid`
      : `${invalidCommands.length}/${gitCommands.length} git commands are invalid: ${invalidCommands.join("; ")}`,
    invalidCommands,
  };
}

/**
 * Extract git commands from text (inline code and code blocks).
 */
function extractGitCommands(text) {
  const commands = [];

  // From code blocks
  const codeBlockPattern = /```(?:bash|sh|shell|console)?\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const trimmed = line.replace(/^\$\s*/, "").trim();
      if (/^git\s+/.test(trimmed)) {
        commands.push(trimmed);
      }
    }
  }

  // From inline code
  const inlinePattern = /`(git\s+[^`]+)`/g;
  while ((match = inlinePattern.exec(text)) !== null) {
    commands.push(match[1].trim());
  }

  // Deduplicate
  return [...new Set(commands)];
}

/**
 * Check if a git command is syntactically valid.
 */
function isValidGitCommand(cmd) {
  // Remove leading "git "
  const rest = cmd.replace(/^git\s+/, "").trim();
  if (!rest) return false;

  // Extract subcommand (first word, may be hyphenated)
  const subcommandMatch = rest.match(/^([a-z][-a-z]*)/);
  if (!subcommandMatch) return false;

  const subcommand = subcommandMatch[1];
  return VALID_GIT_SUBCOMMANDS.has(subcommand);
}

module.exports = grade;
