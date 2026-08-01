[OPEN]

# Debug Session: rbac-param-login

## Scope
- Fix parameter validation inconsistency in `lib/kimi-rbac.ts` (unauthorized params blocked only for customer).
- Investigate and fix universal portal login failure affecting admin/agent/customer.

## Reported Symptoms
- Unauthorized parameters are rejected for customers but accepted for non-customer roles.
- Portal login fails for all roles.

## Hypotheses (to be validated with runtime evidence)
1. The unauthorized parameter blocking condition is incorrectly gated by `normalizedRole === "customer"`, so agents/admins bypass validation.
2. The caller is passing role values that normalize unexpectedly (e.g., undefined role becomes "customer" or empty string), causing inconsistent enforcement paths.
3. The login failure is caused by RBAC enforcement rejecting required parameters (e.g., model selection / provider / organization) due to a recent stricter sanitization step.
4. The login failure is caused by authentication/session cookie changes (e.g., token/cookie not set or overwritten) rather than credential verification.
5. The login failure is caused by Firestore access failing at runtime (missing env vars or permission errors) leading to fallback paths that block all roles.

## Evidence Plan
- Add instrumentation around RBAC parameter sanitation and authorization decisions (role, params, unauthorized list, final allow/deny).
- Add instrumentation around login flow decision points (schema validation, role checks, password verify result, token+cookie set).

## Status
- [ ] Instrumentation added
- [ ] Reproduced with logs
- [ ] Root cause confirmed
- [ ] Fix implemented
- [ ] Verified with tests/e2e
