# Security Findings Report — insecure-repo

## Summary

**AUTO-FAIL**: This repository contains **6 critical** and **2 major** security vulnerabilities. Multiple issues pose immediate risk of data breach, unauthorized access, and code execution. The repository is not safe for production deployment.

**Security Score: 8/100** — CRITICAL FAIL

## Findings

### Critical Severity

#### 1. Committed Secrets — `.env`

**File**: `.env` (entire file)
**Severity**: CRITICAL
**OWASP**: A07:2021 — Security Misconfiguration

The `.env` file is committed to the repository containing production credentials:
- `DATABASE_URL=postgres://admin:password123@prod-db.internal:5432/myapp`
- `API_KEY=sk-live-abc123def456ghi789`
- `STRIPE_SECRET_KEY=sk_live_4eC39HqLyjWDarjtT1zdp7dc`
- `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- `JWT_SECRET=my-super-secret-jwt-key-do-not-share`

**Impact**: Any repository reader has full access to production database, payment processing, AWS infrastructure, and JWT signing.

**Remediation**:
1. Immediately rotate ALL exposed credentials.
2. Remove `.env` from git history using `git filter-branch` or BFG Repo Cleaner.
3. Add `.env` to `.gitignore`.
4. Use environment variables or a secrets manager (AWS Secrets Manager, Vault).

---

#### 2. SQL Injection — `src/db.js`

**File**: `src/db.js:18-19, 25, 32, 39`
**Severity**: CRITICAL
**OWASP**: A03:2021 — Injection

All database queries use string concatenation/interpolation with unsanitized user input:

```javascript
// src/db.js:18 — getUserById
const sql = `SELECT * FROM users WHERE id = ${req.params.id}`;

// src/db.js:25 — searchUsers
const sql = `SELECT * FROM users WHERE name LIKE '%${req.query.search}%'`;

// src/db.js:39 — updateUserProfile
const sql = `UPDATE users SET name = '${name}', email = '${email}', bio = '${bio}' WHERE id = ${req.params.id}`;
```

Additionally, `rawQuery` at line 45 executes arbitrary SQL from request body.

**Impact**: An attacker can read, modify, or delete any data in the database. The `rawQuery` endpoint allows complete database takeover.

**Remediation**: Use parameterized queries:
```javascript
const sql = 'SELECT * FROM users WHERE id = $1';
db.query(sql, [req.params.id]);
```

---

#### 3. Hardcoded JWT Secret — `src/auth.js:8`

**File**: `src/auth.js:8`
**Severity**: CRITICAL

```javascript
const JWT_SECRET = 'my-super-secret-jwt-key-do-not-share';
```

The JWT signing secret is hardcoded in source code.

**Impact**: Anyone with repository access can forge valid JWT tokens for any user, including admin accounts.

**Remediation**: Load from environment variable: `const JWT_SECRET = process.env.JWT_SECRET;`

---

#### 4. Weak Password Hashing — `src/auth.js:15-17`

**File**: `src/auth.js:15-17`
**Severity**: CRITICAL
**OWASP**: A02:2021 — Cryptographic Failures

```javascript
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}
```

MD5 is a fast hash unsuitable for passwords. Modern GPUs can compute billions of MD5 hashes per second.

**Impact**: If the database is compromised, all passwords can be cracked in minutes.

**Remediation**: Use `bcrypt` or `argon2`:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
```

---

### Major Severity

#### 5. Missing Authentication on Admin Routes — `src/api.js:29-46`

**File**: `src/api.js:29-46`
**Severity**: MAJOR
**OWASP**: A01:2021 — Broken Access Control

Admin endpoints have no authentication or authorization middleware:

```javascript
app.get('/api/admin/users', (req, res) => { ... });
app.delete('/api/admin/users/:id', (req, res) => { ... });
app.post('/api/admin/reset-database', (req, res) => { ... });
app.get('/api/admin/config', (req, res) => { ... });
```

The `/api/admin/reset-database` endpoint can wipe the entire database. The `/api/admin/config` endpoint exposes internal configuration including `DATABASE_URL` and `API_KEY`.

**Impact**: Any unauthenticated user can access admin functionality, delete users, reset the database, and read secrets.

**Remediation**: Add authentication middleware:
```javascript
app.use('/api/admin', requireAuth, requireRole('admin'));
```

---

#### 6. CORS Wildcard with Credentials — `src/api.js:14-18`

**File**: `src/api.js:14-18`
**Severity**: MAJOR
**OWASP**: A05:2021 — Security Misconfiguration

```javascript
const corsOptions = {
  origin: '*',
  credentials: true,
};
```

Setting `origin: '*'` with `credentials: true` is a dangerous combination that allows any website to make authenticated requests.

**Impact**: Cross-origin credential theft. Malicious websites can make API requests on behalf of logged-in users.

**Remediation**: Set specific allowed origins: `origin: ['https://myapp.com']`

---

### Minor Severity

#### 7. Stack Trace Exposure — `src/api.js:48-60`

**File**: `src/api.js:48-60`
**Severity**: MINOR

Error handler returns full stack traces, request body, and all headers to the client.

**Remediation**: Return generic error messages in production. Log details server-side.

---

## Recommendations

1. **IMMEDIATE**: Rotate all credentials in `.env`. This is urgent — if the repo is public, assume all secrets are compromised.
2. **IMMEDIATE**: Replace all string-concatenated SQL with parameterized queries.
3. **HIGH**: Add authentication middleware to admin routes.
4. **HIGH**: Replace MD5 with bcrypt for password hashing.
5. **MEDIUM**: Move JWT secret to environment variable.
6. **MEDIUM**: Restrict CORS to specific origins.
7. **LOW**: Sanitize error responses for production.

---

*Report generated by ai-readiness:security*
