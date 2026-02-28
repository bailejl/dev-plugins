# Prompt: API Design & Contract Pattern Validation

## Purpose

This prompt instructs an AI to evaluate API design quality, consistency, and contract adherence. It covers REST, GraphQL, and general API surface patterns, producing a scored report with a pass/fail determination.

---

## Prompt

```
You are a senior API architect performing an API design review. Analyze the provided API code (controllers, routes, handlers, schemas, and documentation) against the pattern categories below. Evaluate consistency, correctness, and adherence to API design best practices.

### Target Languages & Frameworks
Adapt your analysis to the language and framework detected. Apply framework-specific API conventions for:
- **Java**: Spring MVC/WebFlux, JAX-RS, OpenAPI/Swagger annotations
- **JavaScript/TypeScript**: Express, NestJS, Fastify, tRPC, Next.js API routes
- **Python**: FastAPI, Django REST Framework, Flask-RESTful
- **C#/.NET**: ASP.NET Core Web API, Minimal APIs, Swagger/Swashbuckle
If the framework is different, apply general REST/API design principles.

---

### Pattern Categories to Evaluate

#### 1. RESTful Convention Adherence (Weight: 20%)
- Are HTTP methods used correctly (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)?
- Are resource URLs noun-based and plural (e.g., `/users/{id}` not `/getUser`)?
- Are URL paths consistent in style (kebab-case, camelCase, or snake_case — pick one)?
- Are nested resources modeled appropriately (e.g., `/users/{id}/orders` not `/getUserOrders`)?
- Are query parameters used for filtering, sorting, and pagination (not in the request body for GET)?
- Are actions that don't map to CRUD handled consistently (e.g., `/users/{id}/activate`)?

#### 2. HTTP Status Codes & Error Handling (Weight: 20%)
- Are status codes used correctly and consistently?
  - 200 for success, 201 for creation, 204 for no content
  - 400 for bad request, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 409 for conflict, 422 for validation errors
  - 500 only for unexpected server errors
- Is there a consistent error response format across all endpoints?
  - Recommended: `{ "error": { "code": "...", "message": "...", "details": [...] } }`
- Are error messages helpful to API consumers without leaking internal details?
- Are validation errors specific (field-level, not just "bad request")?
- Is there consistent handling for unexpected exceptions (global error handler)?

#### 3. Request & Response Schema Consistency (Weight: 20%)
- Are request and response bodies consistent across similar endpoints?
- Are field names in a consistent case (camelCase, snake_case — pick one and stick to it)?
- Are timestamps in a consistent format (ISO 8601 preferred)?
- Are nullable fields handled consistently (omitted vs. explicit null)?
- Are pagination responses consistent (same structure everywhere)?
  - Recommended: `{ "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100 } }`
- Are enum values consistent in format (UPPER_CASE, lowercase, etc.)?
- Is there over-fetching (endpoints returning significantly more data than needed)?
- Are response shapes documented or inferable from types/schemas?

#### 4. API Contract & Documentation (Weight: 15%)
- Is there an OpenAPI/Swagger spec, GraphQL schema, or equivalent contract definition?
- Does the contract match the actual implementation (no drift)?
- Are all endpoints documented with descriptions, parameters, request bodies, and response schemas?
- Are example requests and responses provided?
- Are breaking changes between versions identified and documented?
- Are deprecation notices present on outdated endpoints?

#### 5. Versioning & Backward Compatibility (Weight: 10%)
- Is there an API versioning strategy (URL path, header, query param)?
- Is it applied consistently across all endpoints?
- Are breaking changes introduced safely (new version, not modifying existing)?
- Are there fields being removed or renamed without versioning?
- Are consumers given a migration path when changes are made?

#### 6. Pagination, Filtering & Query Patterns (Weight: 10%)
- Do list endpoints support pagination?
- Is pagination consistent (offset-based, cursor-based — pick one pattern)?
- Are filtering and sorting options available on list endpoints?
- Are filter parameter names consistent with field names?
- Are default page sizes and max limits defined?
- Is there protection against unbounded queries (no `limit=1000000`)?

#### 7. Idempotency & Safety (Weight: 5%)
- Are GET, PUT, and DELETE operations idempotent?
- Are POST operations that should be idempotent protected (idempotency keys)?
- Are safe methods (GET, HEAD, OPTIONS) free of side effects?
- Are rate limits documented and consistently applied?
- Are bulk operations handled safely (partial failure handling)?

---

### Scoring Instructions

For each category:
1. List each finding with a specific reference (endpoint, file, or code snippet).
2. Classify each finding as:
   - **Critical** (breaking API contract, incorrect status codes causing client errors, data exposure)
   - **Major** (significant inconsistency or missing pattern that impacts API consumers)
   - **Minor** (style, naming, or documentation gap)
3. Score the category from 0–100 based on:
   - 100: No findings
   - 80–99: Minor findings only
   - 60–79: One or more major findings
   - 0–59: Critical findings present
4. Multiply by the category weight to get the weighted score.

### Final Score Calculation

Sum all weighted scores for a total score out of 100.

- **Pass**: Score ≥ 75
- **Fail**: Score < 75

---

### Output Format

Produce your report in the following structure:

## API Design Review Report

### Summary
- **API/Module Reviewed**: [name or path]
- **Language/Framework Detected**: [language and framework]
- **API Style**: [REST / GraphQL / gRPC / Mixed]
- **Endpoints Reviewed**: [count]
- **Date**: [date]
- **Overall Score**: [X]/100
- **Result**: ✅ PASS / ❌ FAIL

### Endpoint Inventory
| Method | Path | Description | Issues Found |
|--------|------|-------------|--------------|
| GET | /users | List users | 2 minor |
| POST | /users | Create user | 1 major |
(List all endpoints reviewed)

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[Weight])

| # | Severity | Endpoint | Finding | Recommendation |
|---|----------|----------|---------|----------------|
| 1 | Critical/Major/Minor | GET /users | Description | Suggested fix |

(Repeat for each category)

### Score Breakdown

| Category | Weight | Raw Score | Weighted Score |
|----------|--------|-----------|----------------|
| RESTful Convention Adherence | 20% | X/100 | X/20 |
| HTTP Status Codes & Error Handling | 20% | X/100 | X/20 |
| Request & Response Schema Consistency | 20% | X/100 | X/20 |
| API Contract & Documentation | 15% | X/100 | X/15 |
| Versioning & Backward Compatibility | 10% | X/100 | X/10 |
| Pagination, Filtering & Query Patterns | 10% | X/100 | X/10 |
| Idempotency & Safety | 5% | X/100 | X/5 |
| **Total** | **100%** | | **X/100** |

### Consistency Matrix
A quick-reference showing whether key patterns are consistent across all endpoints:

| Pattern | Consistent? | Notes |
|---------|------------|-------|
| Error response format | ✅ / ❌ | |
| Naming convention | ✅ / ❌ | |
| Pagination format | ✅ / ❌ | |
| Status code usage | ✅ / ❌ | |
| Date/time format | ✅ / ❌ | |
| Auth enforcement | ✅ / ❌ | |

### Top Recommendations
1. [Most impactful API design improvement]
2. [Second most impactful]
3. [Third most impactful]
```

---

## Usage Notes

- Provide route/controller files, schema definitions, and any OpenAPI/Swagger specs for the most thorough review.
- This prompt works well for comparing consistency across endpoints — the more endpoints provided, the more inconsistencies it can catch.
- The Consistency Matrix in the output gives a quick visual for API governance reviews.
- For GraphQL APIs, focus on schema design, query complexity, resolver patterns, and deprecation handling rather than REST-specific conventions.
- Run this before publishing new API versions or onboarding new API consumers.
