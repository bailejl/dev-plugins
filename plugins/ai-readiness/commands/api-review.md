---
description: Review API design across 7 weighted categories — REST conventions, HTTP status codes, schemas, contracts, versioning, pagination, and idempotency.
---

# API Design & Contract Pattern Review

You are performing an API design review. Analyze the API code (controllers, routes, handlers, schemas, and documentation) against the 7 weighted categories below. Evaluate consistency, correctness, and adherence to API design best practices.

---

## Target Languages & Frameworks

Detect the language and framework. Apply framework-specific API conventions for:
- **Java**: Spring MVC/WebFlux, JAX-RS, OpenAPI/Swagger annotations
- **JavaScript/TypeScript**: Express, NestJS, Fastify, tRPC, Next.js API routes
- **Python**: FastAPI, Django REST Framework, Flask-RESTful
- **C#/.NET**: ASP.NET Core Web API, Minimal APIs, Swagger/Swashbuckle
- **Go**: Standard library net/http, Gin, Echo, Chi
- **Rust**: Actix-web, Axum, Rocket

If the framework is different, apply general REST/API design principles.

---

## Evidence Gathering

Before scoring, discover and inventory all API endpoints:

```
# Find route/controller files
glob **/controllers/**/*.{ts,js,py,java,go,rs,cs}
glob **/routes/**/*.{ts,js,py,java,go,rs,cs}
glob **/handlers/**/*.{ts,js,py,java,go,rs,cs}
glob **/api/**/*.{ts,js,py,java,go,rs,cs}

# Find route definitions
grep -rn "app\.get\|app\.post\|app\.put\|app\.patch\|app\.delete\|router\." --include="*.ts" --include="*.js"
grep -rn "@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping\|@RequestMapping" --include="*.java"
grep -rn "@app\.get\|@app\.post\|@app\.put\|@app\.delete\|@router\." --include="*.py"
grep -rn "\[HttpGet\]\|\[HttpPost\]\|\[HttpPut\]\|\[HttpDelete\]" --include="*.cs"

# Find OpenAPI/Swagger specs
glob **/{openapi,swagger}.{json,yaml,yml}
glob **/api-docs/**

# Find schema/DTO definitions
grep -rn "schema\|DTO\|ViewModel\|Request\|Response" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"

# Find error handling patterns
grep -rn "status(4\|status(5\|HttpStatus\|StatusCode\|abort(" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"

# Find pagination patterns
grep -rn "page\|limit\|offset\|cursor\|pageSize\|per_page" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"

# Find versioning patterns
grep -rn "v1\|v2\|version\|api-version" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"
```

---

## Pattern Categories

### 1. RESTful Convention Adherence (Weight: 20%)

Evaluate:
- Are HTTP methods used correctly? (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)
- Are resource URLs noun-based and plural? (e.g., `/users/{id}` not `/getUser`)
- Are URL paths consistent in style? (kebab-case, camelCase, or snake_case — pick one)
- Are nested resources modeled appropriately? (e.g., `/users/{id}/orders` not `/getUserOrders`)
- Are query parameters used for filtering, sorting, and pagination (not in the request body for GET)?
- Are actions that don't map to CRUD handled consistently? (e.g., `/users/{id}/activate`)

### 2. HTTP Status Codes & Error Handling (Weight: 20%)

Evaluate:
- Are status codes used correctly and consistently?
  - 200 for success, 201 for creation, 204 for no content
  - 400 for bad request, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 409 for conflict, 422 for validation errors
  - 500 only for unexpected server errors
- Is there a consistent error response format across all endpoints?
  - Recommended: `{ "error": { "code": "...", "message": "...", "details": [...] } }`
- Are error messages helpful to API consumers without leaking internal details?
- Are validation errors specific (field-level, not just "bad request")?
- Is there consistent handling for unexpected exceptions (global error handler)?

### 3. Request & Response Schema Consistency (Weight: 20%)

Evaluate:
- Are request and response bodies consistent across similar endpoints?
- Are field names in a consistent case? (camelCase, snake_case — pick one)
- Are timestamps in a consistent format? (ISO 8601 preferred)
- Are nullable fields handled consistently? (omitted vs explicit null)
- Are pagination responses consistent? (same structure everywhere)
  - Recommended: `{ "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100 } }`
- Are enum values consistent in format? (UPPER_CASE, lowercase, etc.)
- Is there over-fetching? (endpoints returning significantly more data than needed)
- Are response shapes documented or inferable from types/schemas?

### 4. API Contract & Documentation (Weight: 15%)

Evaluate:
- Is there an OpenAPI/Swagger spec, GraphQL schema, or equivalent contract definition?
- Does the contract match the actual implementation (no drift)?
- Are all endpoints documented with descriptions, parameters, request bodies, and response schemas?
- Are example requests and responses provided?
- Are breaking changes between versions identified and documented?
- Are deprecation notices present on outdated endpoints?

### 5. Versioning & Backward Compatibility (Weight: 10%)

Evaluate:
- Is there an API versioning strategy? (URL path, header, query param)
- Is it applied consistently across all endpoints?
- Are breaking changes introduced safely? (new version, not modifying existing)
- Are there fields being removed or renamed without versioning?
- Are consumers given a migration path when changes are made?

### 6. Pagination, Filtering & Query Patterns (Weight: 10%)

Evaluate:
- Do list endpoints support pagination?
- Is pagination consistent? (offset-based, cursor-based — pick one pattern)
- Are filtering and sorting options available on list endpoints?
- Are filter parameter names consistent with field names?
- Are default page sizes and max limits defined?
- Is there protection against unbounded queries? (no `limit=1000000`)

### 7. Idempotency & Safety (Weight: 5%)

Evaluate:
- Are GET, PUT, and DELETE operations idempotent?
- Are POST operations that should be idempotent protected? (idempotency keys)
- Are safe methods (GET, HEAD, OPTIONS) free of side effects?
- Are rate limits documented and consistently applied?
- Are bulk operations handled safely? (partial failure handling)

---

## Scoring Instructions

For each category:

1. **List each finding** with a specific reference (endpoint, file, or code snippet).
2. **Classify** each finding as:
   - **Critical** — breaking API contract, incorrect status codes causing client errors, data exposure
   - **Major** — significant inconsistency or missing pattern impacting API consumers
   - **Minor** — style, naming, or documentation gap
3. **Score** the category from 0–100:
   - 100: No findings
   - 80–99: Minor findings only
   - 60–79: One or more major findings
   - 0–59: Critical findings present
4. **Multiply** by the category weight.

### Final Score

Sum all weighted scores for a total out of 100.

- **Pass**: Score ≥ 75
- **Fail**: Score < 75

---

## Output Format

```markdown
## API Design Review Report

### Summary
- **API/Module Reviewed**: [name or path]
- **Language/Framework Detected**: [language and framework]
- **API Style**: [REST / GraphQL / gRPC / Mixed]
- **Endpoints Reviewed**: [count]
- **Overall Score**: [X]/100
- **Result**: ✅ PASS / ❌ FAIL

### Endpoint Inventory

| Method | Path | Description | Issues Found |
|--------|------|-------------|--------------|
| GET | /users | List users | 2 minor |
| POST | /users | Create user | 1 major |
(List all endpoints reviewed)

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[max weight])

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

| Pattern | Consistent? | Notes |
|---------|------------|-------|
| Error response format | ✅ / ❌ | |
| Naming convention | ✅ / ❌ | |
| Pagination format | ✅ / ❌ | |
| Status code usage | ✅ / ❌ | |
| Date/time format | ✅ / ❌ | |
| Auth enforcement | ✅ / ❌ | |

### Top 3 Recommendations
1. [Most impactful API design improvement]
2. [Second most impactful]
3. [Third most impactful]
```

---

## Operating Principles

- **Inventory first**: Build a complete endpoint inventory before evaluating individual endpoints.
- **Consistency is king**: The most common API design issue is inconsistency between endpoints. Look for it actively.
- **Consumer perspective**: Evaluate the API from the perspective of someone consuming it. Is it predictable? Can you guess the shape of an endpoint you haven't seen yet?
- **For GraphQL APIs**: Focus on schema design, query complexity, resolver patterns, and deprecation handling rather than REST-specific conventions.
