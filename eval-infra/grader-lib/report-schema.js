/**
 * eval-infra/grader-lib/report-schema.js
 *
 * Validates report structure for both markdown and JSON content.
 * Used by eval graders to check that agent-generated reports
 * contain the required sections and fields.
 *
 * @module report-schema
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the report passes validation
 * @property {string[]} errors - List of validation error messages
 */

/**
 * Validate a report against a schema definition.
 *
 * For markdown: checks that required headings exist (by level and text).
 * For JSON: checks that required fields exist and have expected types.
 *
 * @param {string} content - The report content (markdown string or JSON string)
 * @param {Object} schema - Schema definition
 * @param {string} [schema.format="markdown"] - Content format: "markdown" or "json"
 * @param {Object[]} [schema.requiredSections] - For markdown: required heading sections
 * @param {number} schema.requiredSections[].level - Heading level (1-6)
 * @param {string|RegExp} schema.requiredSections[].pattern - Heading text or pattern to match
 * @param {boolean} [schema.requiredSections[].hasContent=false] - Whether the section must have body content
 * @param {Object[]} [schema.requiredFields] - For JSON: required fields
 * @param {string} schema.requiredFields[].path - Dot-notation path to field (e.g., "summary.score")
 * @param {string} [schema.requiredFields[].type] - Expected JS typeof value
 * @param {number} [schema.minLength] - Minimum content length in characters
 * @param {number} [schema.maxLength] - Maximum content length in characters
 * @returns {ValidationResult}
 */
function validateReport(content, schema) {
  const errors = [];

  if (!content || typeof content !== "string") {
    return { valid: false, errors: ["Content is empty or not a string"] };
  }

  if (!schema || typeof schema !== "object") {
    return { valid: false, errors: ["Schema is empty or not an object"] };
  }

  const format = schema.format || "markdown";

  // Length checks
  if (schema.minLength && content.length < schema.minLength) {
    errors.push(
      `Content too short: ${content.length} chars (minimum: ${schema.minLength})`
    );
  }
  if (schema.maxLength && content.length > schema.maxLength) {
    errors.push(
      `Content too long: ${content.length} chars (maximum: ${schema.maxLength})`
    );
  }

  if (format === "markdown") {
    validateMarkdown(content, schema, errors);
  } else if (format === "json") {
    validateJson(content, schema, errors);
  } else {
    errors.push(`Unknown format: ${format}. Expected "markdown" or "json".`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate markdown content against a section schema.
 *
 * @param {string} content - Markdown content
 * @param {Object} schema - Schema with requiredSections
 * @param {string[]} errors - Errors array to push into
 */
function validateMarkdown(content, schema, errors) {
  const sections = schema.requiredSections || [];
  const lines = content.split("\n");

  // Extract headings with their positions
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: i,
      });
    }
  }

  for (const required of sections) {
    const pattern =
      required.pattern instanceof RegExp
        ? required.pattern
        : new RegExp(escapeRegex(required.pattern), "i");

    const found = headings.find(
      (h) => h.level === required.level && pattern.test(h.text)
    );

    if (!found) {
      errors.push(
        `Missing required heading: level ${required.level} matching "${required.pattern}"`
      );
      continue;
    }

    // Check that the section has content below the heading
    if (required.hasContent) {
      const nextHeadingIndex = headings.findIndex(
        (h) => h.lineIndex > found.lineIndex && h.level <= found.level
      );
      const endLine =
        nextHeadingIndex >= 0 ? headings[nextHeadingIndex].lineIndex : lines.length;
      const sectionContent = lines
        .slice(found.lineIndex + 1, endLine)
        .join("\n")
        .trim();

      if (!sectionContent) {
        errors.push(
          `Section "${found.text}" (line ${found.lineIndex + 1}) has no content`
        );
      }
    }
  }
}

/**
 * Validate JSON content against a field schema.
 *
 * @param {string} content - JSON string
 * @param {Object} schema - Schema with requiredFields
 * @param {string[]} errors - Errors array to push into
 */
function validateJson(content, schema, errors) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    errors.push(`Invalid JSON: ${e.message}`);
    return;
  }

  const fields = schema.requiredFields || [];

  for (const field of fields) {
    const value = getNestedValue(parsed, field.path);

    if (value === undefined) {
      errors.push(`Missing required field: "${field.path}"`);
      continue;
    }

    if (field.type && typeof value !== field.type) {
      errors.push(
        `Field "${field.path}" has type "${typeof value}", expected "${field.type}"`
      );
    }
  }
}

/**
 * Get a nested value from an object using dot-notation path.
 *
 * @param {Object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., "foo.bar.baz")
 * @returns {*} The value at the path, or undefined
 */
function getNestedValue(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Escape a string for use in a RegExp.
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { validateReport };
