# Security & Vulnerability Pattern Review

You are performing a security-focused review of this codebase. Analyze the code for vulnerability patterns, insecure practices, and security misconfigurations. Produce a scored report with OWASP Top 10 mapping and CWE references.

**CRITICAL**: Any single Critical finding results in an automatic **FAIL** regardless of overall score.

---

## Target Languages & Frameworks

Detect the language and framework. Apply language-specific security considerations for:
- **Java**: Spring Security, OWASP Java
- **JavaScript/TypeScript**: Node.js, Express, React, Next.js
- **Python**: Django, Flask, FastAPI
- **C#/.NET**: ASP.NET Core Identity, Data Protection
- **Go**: Standard library, gorilla/mux, gin
- **Rust**: Actix, Axum

If the stack is different, apply OWASP general guidelines.

---

## Evidence Gathering

Use tools aggressively to find security issues:

```
# Injection patterns
grep -rn "exec(\|eval(\|system(\|child_process\|os\.system\|subprocess\.call" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "innerHTML\|dangerouslySetInnerHTML\|v-html" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --include="*.vue"
grep -rn "raw\|rawQuery\|execute.*concat\|query.*+\|query.*\$\{" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"

# Secrets and credentials
grep -rn "api_key\|apikey\|secret\|password\|passwd\|token\|private_key\|AWS_ACCESS\|AKIA" --include="*.ts" --include="*.js" --include="*.py" --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml"
grep -rn "BEGIN.*PRIVATE KEY" .
git ls-files | grep -iE '\.(pem|key|p12|pfx|ppk)$'
git ls-files | grep -iE '^\.env$|\.env\.'

# Authentication patterns
grep -rn "authenticate\|authorization\|@Auth\|isAuthenticated\|requireAuth\|middleware" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"
grep -rn "bcrypt\|argon2\|scrypt\|sha1\|sha256\|md5\|hashlib" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"
grep -rn "jwt\|JsonWebToken\|verify.*token\|sign.*token" --include="*.ts" --include="*.js" --include="*.py"

# CORS and security headers
grep -rn "cors\|Access-Control\|CORS" --include="*.ts" --include="*.js" --include="*.py" --include="*.java"
grep -rn "helmet\|Content-Security-Policy\|X-Frame-Options\|Strict-Transport" --include="*.ts" --include="*.js" --include="*.py"

# Input validation
grep -rn "validate\|sanitize\|escape\|zod\|joi\|yup\|class-validator\|pydantic" --include="*.ts" --include="*.js" --include="*.py"

# Check for Math.random in security context
grep -rn "Math\.random\|random\.random()" --include="*.ts" --include="*.js" --include="*.py"

# Git history for prior secret leaks
git log --all --oneline --grep='remove.*key\|remove.*secret\|remove.*password\|remove.*credential' | head -10
```

---

## Pattern Categories

### 1. Injection Vulnerabilities (Weight: 25%)

Evaluate:
- **SQL Injection**: Are queries parameterized? Is raw SQL concatenated with user input?
- **XSS (Cross-Site Scripting)**: Is user input sanitized before rendering in HTML? Are template engines used with auto-escaping?
- **Command Injection**: Is user input passed to shell commands, system calls, or exec functions?
- **Path Traversal**: Is user input used to construct file paths without validation?
- **LDAP/XML/NoSQL Injection**: Are other query languages protected?

Language-specific checks:
- **Java**: PreparedStatement vs Statement, HQL injection
- **JS/TS**: Template literals in queries, `eval()`, `innerHTML`
- **Python**: f-strings in SQL, `os.system` with user input, `pickle` deserialization
- **C#**: SqlCommand parameters, LINQ vs raw SQL
- **Go**: `fmt.Sprintf` in SQL queries, `os/exec` with user input

**OWASP**: A03:2021 Injection | **CWE**: CWE-79 (XSS), CWE-89 (SQLi), CWE-78 (OS Command), CWE-22 (Path Traversal)

### 2. Authentication & Authorization (Weight: 25%)

Evaluate:
- Are all endpoints requiring auth properly protected with middleware/filters?
- Are there endpoints missing authorization checks (especially admin/privileged operations)?
- Are passwords hashed with strong algorithms (bcrypt, argon2, scrypt) — not MD5/SHA1?
- Is session management secure (HttpOnly, Secure, SameSite flags on cookies)?
- Are JWTs validated properly (signature, expiration, issuer)?
- Is there proper rate limiting on authentication endpoints?
- Are default credentials present anywhere?
- Is multi-tenancy properly enforced (user A can't access user B's data)?

**OWASP**: A01:2021 Broken Access Control, A07:2021 Identification and Authentication Failures | **CWE**: CWE-287 (Improper Auth), CWE-863 (Incorrect Authorization), CWE-522 (Insufficiently Protected Credentials)

### 3. Secrets & Sensitive Data Exposure (Weight: 20%)

Evaluate:
- Are API keys, tokens, passwords, or connection strings hardcoded in source code?
- Are secrets committed to version control (config files, .env, docker-compose)?
- Is sensitive data logged (passwords, tokens, PII, credit card numbers)?
- Are API responses returning more data than necessary (over-fetching)?
- Is PII encrypted at rest and in transit?
- Are error messages exposing internal details (stack traces, database schemas, file paths)?
- Are .env or config files included in build output or publicly accessible?

**OWASP**: A02:2021 Cryptographic Failures | **CWE**: CWE-200 (Exposure of Sensitive Information), CWE-312 (Cleartext Storage), CWE-532 (Insertion of Sensitive Info into Log File)

### 4. Input Validation & Data Sanitization (Weight: 15%)

Evaluate:
- Is all user input validated on the server side (not just client-side)?
- Are file uploads validated (type, size, content, filename)?
- Are request bodies validated against a schema?
- Are URL parameters, headers, and cookies treated as untrusted input?
- Is there a consistent validation strategy or is it ad-hoc?
- Are regular expressions safe from ReDoS (catastrophic backtracking)?

**OWASP**: A03:2021 Injection (overlaps), A08:2021 Software and Data Integrity Failures | **CWE**: CWE-20 (Improper Input Validation), CWE-434 (Unrestricted Upload)

### 5. Security Configuration (Weight: 10%)

Evaluate:
- Are CORS settings appropriately restrictive (no wildcard `*` in production)?
- Is HTTPS enforced? Are there mixed-content issues?
- Are security headers present (Content-Security-Policy, X-Frame-Options, Strict-Transport-Security)?
- Are debug modes, verbose logging, or development tools disabled in production configs?
- Are dependencies up to date? Are there known CVEs in the dependency tree?
- Are container/deployment configs following least-privilege principles?

**OWASP**: A05:2021 Security Misconfiguration | **CWE**: CWE-16 (Configuration), CWE-693 (Protection Mechanism Failure)

### 6. Cryptography & Data Protection (Weight: 5%)

Evaluate:
- Are up-to-date cryptographic algorithms used (no DES, MD5 for security, SHA1 for signatures)?
- Are random values generated with cryptographically secure generators (not `Math.random`)?
- Are encryption keys managed properly (not hardcoded)?
- Is TLS version enforced (TLS 1.2+ minimum)?

**OWASP**: A02:2021 Cryptographic Failures | **CWE**: CWE-327 (Use of Broken Crypto), CWE-338 (Use of Weak PRNG)

---

## Scoring Instructions

For each category:

1. **List each vulnerability** with a specific reference (file, line, or code snippet).
2. **Classify** by severity:
   - **Critical** — directly exploitable, high impact (SQL injection, hardcoded credentials, missing auth on admin endpoint)
   - **Major** — exploitable under certain conditions or significant risk (missing auth on non-critical endpoint, weak hashing)
   - **Minor** — low risk or defense-in-depth issue (missing non-critical security header)
3. **Score** the category from 0–100:
   - 100: No findings
   - 80–99: Minor findings only
   - 60–79: One or more major findings
   - 0–59: Any critical finding present
4. **Multiply** by the category weight.

### Final Score

Sum all weighted scores for a total out of 100.

- **Pass**: Score ≥ 80 (security requires a higher bar)
- **Fail**: Score < 80
- **Auto-Fail**: Any single **Critical** finding = automatic FAIL regardless of score

---

## Output Format

```markdown
## Security Review Report

### Summary
- **File(s) Reviewed**: [list files or "full codebase"]
- **Language/Framework Detected**: [language and framework]
- **Overall Score**: [X]/100
- **Critical Findings**: [count]
- **Result**: ✅ PASS / ❌ FAIL

### Critical Findings (Immediate Action Required)
[List any critical findings here with full details, even before the detailed breakdown. If none, state "No critical findings."]

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[max weight])

| # | Severity | CWE | Location | Finding | Recommendation |
|---|----------|-----|----------|---------|----------------|
| 1 | Critical/Major/Minor | CWE-XXX | file:line | Description | Remediation |

(Repeat for each category)

### Score Breakdown

| Category | Weight | Raw Score | Weighted Score |
|----------|--------|-----------|----------------|
| Injection Vulnerabilities | 25% | X/100 | X/25 |
| Authentication & Authorization | 25% | X/100 | X/25 |
| Secrets & Sensitive Data Exposure | 20% | X/100 | X/20 |
| Input Validation & Data Sanitization | 15% | X/100 | X/15 |
| Security Configuration | 10% | X/100 | X/10 |
| Cryptography & Data Protection | 5% | X/100 | X/5 |
| **Total** | **100%** | | **X/100** |

### Remediation Priority
1. [Most urgent fix — highest risk]
2. [Second priority]
3. [Third priority]

### OWASP Top 10 (2021) Mapping

| OWASP Category | Findings | Severity |
|---------------|----------|----------|
| A01: Broken Access Control | [count] | [worst severity] |
| A02: Cryptographic Failures | [count] | [worst severity] |
| A03: Injection | [count] | [worst severity] |
| A05: Security Misconfiguration | [count] | [worst severity] |
| A07: Auth Failures | [count] | [worst severity] |
| A08: Integrity Failures | [count] | [worst severity] |
```

---

## Operating Principles

- **Assume breach mindset**: Look for what an attacker would exploit first.
- **Check git history**: Secrets removed from current files may still be in git history. Run `git log -p -S "password" --all` to check.
- **Defense in depth**: Even if a single vulnerability seems minor alone, multiple minor issues can chain into a critical exploit.
- **No false sense of security**: This review complements (not replaces) automated SAST/DAST tools. Note when automated scanning is recommended.
- **CWE references**: Include CWE identifiers for all findings to align with industry standards.
