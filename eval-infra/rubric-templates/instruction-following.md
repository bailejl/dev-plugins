# Instruction Following Rubric

Evaluate whether the agent followed the given instructions completely and accurately. Score each criterion from 1 (poor) to 5 (excellent).

---

## 1. Completeness (weight: 30%)

Did the agent address all parts of the prompt? Were any requirements missed?

| Score | Description |
|-------|-------------|
| 1 | Addressed less than half the requirements. Major parts of the task ignored. |
| 2 | Addressed roughly half. Several requirements skipped or only superficially covered. |
| 3 | Most requirements addressed. One or two parts missing or incomplete. |
| 4 | All requirements addressed. Minor gaps in depth but nothing missing. |
| 5 | Every requirement fully addressed. Thorough coverage of all stated parts. |

---

## 2. Scope Discipline (weight: 25%)

Did the agent stay within the boundaries of what was asked? Did it avoid adding unrequested features or tangential work?

| Score | Description |
|-------|-------------|
| 1 | Significantly out of scope. Did work that was never requested, or reinterpreted the task entirely. |
| 2 | Moderately off-scope. Added unrequested features or made changes outside the task boundary. |
| 3 | Mostly on-scope. Minor tangential additions but the core work matches the request. |
| 4 | On-scope. Stayed within the task boundary with minimal deviation. |
| 5 | Precisely scoped. Did exactly what was asked, no more, no less. |

---

## 3. Tool Usage (weight: 25%)

Did the agent use the right tools for the job? Did it read before writing? Did it use appropriate commands?

| Score | Description |
|-------|-------------|
| 1 | Grossly inappropriate tool usage. Edited files without reading them, used wrong tools for the task, or failed to use tools at all. |
| 2 | Poor tool choices. Some correct tool use but missed obvious better alternatives or used tools incorrectly. |
| 3 | Adequate tool usage. Used reasonable tools but not always the best choice. Minor inefficiencies. |
| 4 | Good tool usage. Used appropriate tools, read before editing, used search tools to find context. |
| 5 | Excellent tool usage. Efficient tool selection, read before write, searched before assuming, minimal wasted tool calls. |

---

## 4. Output Format (weight: 20%)

Did the agent produce output in the expected format? If the task specified a format (JSON, markdown, specific sections), did it comply?

| Score | Description |
|-------|-------------|
| 1 | Wrong format entirely. Expected JSON but got prose, expected markdown but got raw text, etc. |
| 2 | Partially correct format. Some structure matches but missing key formatting requirements. |
| 3 | Mostly correct format. Minor deviations from specified structure (e.g., wrong heading levels, extra sections). |
| 4 | Correct format. Matches the specification with only trivial deviations. |
| 5 | Perfect format compliance. Exactly matches the specified structure, naming, and output style. |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(completeness * 0.30) + (scope * 0.25) + (toolUsage * 0.25) + (outputFormat * 0.20)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
completeness: <score>/5 — <brief justification>
scope_discipline: <score>/5 — <brief justification>
tool_usage: <score>/5 — <brief justification>
output_format: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
