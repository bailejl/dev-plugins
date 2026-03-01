# API Design Review — bad-api-repo

## Summary

The bad-api-repo project violates numerous REST API design best practices. Endpoints use verbs instead of nouns, error response formats are inconsistent, HTTP status codes are misused, and there is no pagination or versioning. The API would be difficult to consume, document, or evolve.

**API Design Score: 25/100** — FAIL

## Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| URL Design | 15 | 30% | 4.5 |
| HTTP Semantics | 20 | 25% | 5.0 |
| Error Handling | 20 | 20% | 4.0 |
| Pagination & Filtering | 10 | 15% | 1.5 |
| Versioning & Evolution | 0 | 10% | 0.0 |
| **Total** | | | **15.0** |

## Detailed Findings

### High

#### 1. Verbs in URLs — `src/routes.js`

**File**: `src/routes.js:8, 15, 22, 30, 38`
**Severity**: HIGH
**REST Principle**: Use nouns for resources, HTTP methods for actions

Endpoints embed actions as verbs in the URL path:

```javascript
// src/routes.js:8
app.get('/api/getUsers', ...);

// src/routes.js:15
app.get('/api/getUserById/:id', ...);

// src/routes.js:22
app.post('/api/createUser', ...);

// src/routes.js:30
app.post('/api/deleteUser/:id', ...);

// src/routes.js:38
app.post('/api/updateUser/:id', ...);
```

**Should be**:
| Current | Correct |
|---------|---------|
| `GET /api/getUsers` | `GET /api/users` |
| `GET /api/getUserById/:id` | `GET /api/users/:id` |
| `POST /api/createUser` | `POST /api/users` |
| `POST /api/deleteUser/:id` | `DELETE /api/users/:id` |
| `POST /api/updateUser/:id` | `PUT /api/users/:id` or `PATCH /api/users/:id` |

**Impact**: Non-standard URLs confuse API consumers, break REST client conventions, and make the API harder to document with OpenAPI/Swagger.

---

#### 2. Wrong HTTP Status Codes — `src/routes.js`

**File**: `src/routes.js:12, 26, 34, 42`
**Severity**: HIGH
**REST Principle**: Use correct HTTP status codes

Multiple endpoints return incorrect status codes:

```javascript
// src/routes.js:12 — returns 200 for "not found"
app.get('/api/getUserById/:id', (req, res) => {
  const user = db.findById(req.params.id);
  if (!user) {
    return res.status(200).json({ error: 'User not found' });
  }
  res.status(200).json(user);
});

// src/routes.js:26 — returns 200 for creation (should be 201)
app.post('/api/createUser', (req, res) => {
  const user = db.create(req.body);
  res.status(200).json(user);
});

// src/routes.js:34 — uses POST for delete
app.post('/api/deleteUser/:id', (req, res) => {
  db.delete(req.params.id);
  res.status(200).json({ message: 'Deleted' });
});

// src/routes.js:42 — returns 200 for validation error
app.post('/api/updateUser/:id', (req, res) => {
  if (!req.body.name) {
    return res.status(200).json({ error: 'Name is required' });
  }
  ...
});
```

**Correct status codes**:
| Scenario | Current | Correct |
|----------|---------|---------|
| Resource not found | 200 | 404 |
| Resource created | 200 | 201 |
| Resource deleted | 200 | 204 (no body) |
| Validation error | 200 | 400 or 422 |

**Impact**: HTTP clients, middleware, and monitoring tools rely on status codes for retry logic, caching, and alerting. Using 200 for errors makes automated error handling impossible.

---

#### 3. Inconsistent Error Response Format — `src/routes.js`

**File**: `src/routes.js:12, 42, 50`
**Severity**: HIGH
**REST Principle**: Consistent response envelope

Error responses use different formats across endpoints:

```javascript
// Format 1: { error: "message" }
res.json({ error: 'User not found' });

// Format 2: { message: "message" }
res.json({ message: 'Invalid input' });

// Format 3: { success: false, msg: "message" }
res.json({ success: false, msg: 'Something went wrong' });

// Format 4: Plain string
res.json('Error occurred');
```

**Should be** a consistent error envelope:
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with id 123 was not found",
    "status": 404
  }
}
```

**Impact**: API consumers must write different error handling logic for each endpoint. Cannot build a generic error handler or display consistent error messages.

---

### Medium

#### 4. No Pagination — `src/routes.js:8`

**File**: `src/routes.js:8-11`
**Severity**: MEDIUM

The `GET /api/getUsers` endpoint returns all users in a single response with no pagination parameters:

```javascript
app.get('/api/getUsers', (req, res) => {
  const users = db.findAll();
  res.json(users);
});
```

No support for `?page=`, `?limit=`, `?offset=`, or `?cursor=`. As the dataset grows, this endpoint will return unbounded results.

**Impact**: Performance degrades linearly with data size. Mobile clients receive unnecessarily large payloads. No way to implement infinite scroll or paginated tables.

**Remediation**: Add pagination support:
```javascript
app.get('/api/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const { data, total } = db.findPaginated({ page, limit });
  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
});
```

---

#### 5. No API Versioning

**File**: `src/routes.js` (entire file)
**Severity**: MEDIUM

All endpoints are mounted at `/api/` with no version prefix. There is no `/api/v1/` or header-based versioning strategy.

**Impact**: Breaking changes to the API will affect all consumers simultaneously. No way to introduce new response formats while maintaining backwards compatibility. Cannot deprecate old endpoints gracefully.

**Remediation**: Add version prefix to all routes:
```javascript
const v1 = express.Router();
v1.get('/users', ...);
app.use('/api/v1', v1);
```

---

#### 6. No Input Validation

**File**: `src/routes.js:22-28`
**Severity**: MEDIUM

The `POST /api/createUser` endpoint accepts any body without validation:

```javascript
app.post('/api/createUser', (req, res) => {
  const user = db.create(req.body);
  res.json(user);
});
```

No validation of required fields, data types, string lengths, or format constraints. Malformed data goes directly to the database.

**Impact**: Invalid data corrupts the database. No useful error messages for API consumers. Potential for injection attacks.

---

## REST Best Practices Mapping

| Practice | Status | Issue |
|----------|--------|-------|
| Resource-based URLs (nouns) | FAIL | Verb-based URLs throughout |
| Correct HTTP methods | FAIL | POST used for GET/DELETE/PUT operations |
| Correct status codes | FAIL | 200 returned for errors and creation |
| Consistent error format | FAIL | 4 different error formats |
| Pagination | FAIL | No pagination support |
| API versioning | FAIL | No version prefix |
| Input validation | FAIL | No validation on write endpoints |
| HATEOAS / Links | FAIL | No hypermedia links |
| Content negotiation | PASS | JSON responses throughout |
| Idempotency | FAIL | No idempotency keys on POST |

## Recommendations

### Immediate (High)

1. **Fix URLs**: Rename all endpoints to use resource nouns:
   - `/api/v1/users` (GET, POST)
   - `/api/v1/users/:id` (GET, PUT, PATCH, DELETE)

2. **Fix Status Codes**: Return 404 for not found, 201 for created, 204 for deleted, 400/422 for validation errors.

3. **Standardize Errors**: Adopt a single error response format with `code`, `message`, and `status` fields.

### Short-term (Medium)

4. **Add Pagination**: Implement cursor-based or offset pagination on all list endpoints.

5. **Add API Versioning**: Prefix all routes with `/api/v1/`.

6. **Add Input Validation**: Use a validation library (e.g., `joi`, `zod`) for all write endpoints.

---

*Report generated by ai-readiness:api-review*
