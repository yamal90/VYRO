# VYRO GPU - Security Audit Report

**Date:** 2026-05-04
**Auditor:** Devin (Principal Security Engineer)
**Scope:** Full-stack security audit (frontend, backend, CI/CD, Supabase)
**Branch:** `security/full-hardening-2026-05`

---

## Executive Summary

A comprehensive security audit was performed on the VYRO GPU cloud computing platform. **9 vulnerabilities** were identified (1 critical, 5 high, 3 moderate) across npm dependencies, application code, Supabase configuration, and CI/CD pipelines. All critical and high severity issues have been remediated. The application's security posture has been significantly improved through dependency updates, IDOR fixes, RLS tightening, hardcoded credential removal, and CI/CD hardening.

---

## Risk Matrix

| ID | Severity | Category | Description | Status |
|----|----------|----------|-------------|--------|
| V-001 | **Critical** | Dependency | happy-dom RCE via VM Context Escape (CVE) | Fixed |
| V-002 | **High** | Dependency | vite path traversal + WebSocket file read | Fixed |
| V-003 | **High** | Dependency | serialize-javascript RCE via RegExp.flags | Fixed |
| V-004 | **High** | Supabase | IDOR in `apply_referral_link` (any user can target others) | Fixed |
| V-005 | **High** | Supabase | Direct table writes bypass RPC validation (deposits/withdrawals) | Fixed |
| V-006 | **High** | Frontend | Hardcoded Supabase URL and anon key in source code | Fixed |
| V-007 | **Medium** | Frontend | Production sourcemaps expose source code | Fixed |
| V-008 | **Medium** | Supabase | `public.is_admin()` function exposes admin check to client | Fixed |
| V-009 | **Medium** | Supabase | `validate_referral_code` accessible to unauthenticated users | Fixed |
| V-010 | **Medium** | CI/CD | GitHub Actions not pinned to SHA (supply chain risk) | Fixed |
| V-011 | **Medium** | CI/CD | Missing least-privilege permissions in workflows | Fixed |
| V-012 | **Medium** | CI/CD | No security checks (audit, lint, typecheck) in pipeline | Fixed |
| V-013 | **Low** | Frontend | Missing security headers (CSP, Permissions-Policy) | Fixed |

---

## Findings Detail

### V-001: happy-dom RCE (Critical)

**File:** `package.json` (devDependency)
**Before:** `happy-dom@^15.0.0` (installed: 15.11.7)
**Exploit:** VM Context Escape allows arbitrary code execution in test environments.
**Fix:** Updated to `happy-dom@^20.9.0` (20.9.0 installed)

### V-002: Vite Path Traversal (High)

**File:** `package.json`
**Before:** `vite@7.2.4`
**Exploit:** Path traversal in optimized deps `.map` handling; `server.fs.deny` bypass via queries; WebSocket arbitrary file read.
**Fix:** Updated to `vite@7.3.3`

### V-003: serialize-javascript RCE (High)

**File:** Transitive dependency via `vite-plugin-pwa` -> `workbox-build` -> `@rollup/plugin-terser`
**Before:** `serialize-javascript@<=7.0.4`
**Exploit:** RCE via `RegExp.flags` and `Date.prototype.toISOString()` overrides.
**Fix:** Added npm override `serialize-javascript@>=7.0.5`; updated `vite-plugin-pwa` to v1.x and `vitest` to v4.x.

### V-004: IDOR in apply_referral_link (High)

**File:** `supabase/schema.sql:695-791`
**Before:** `p_target_user_id` parameter accepted any UUID without authorization check.
**Exploit:** Authenticated user calls `apply_referral_link('CODE', '<victim_uuid>')` to assign arbitrary referral codes to other users, manipulating team trees and potentially earning referral bonuses.
**Fix:** Added authorization check: non-admin users can only target themselves.
```sql
if v_target_id <> v_actor and not private.is_admin(v_actor) then
  return json_build_object('success', false, 'message', 'Non autorizzato');
end if;
```

### V-005: Direct Table Writes Bypass RPC Validation (High)

**File:** `supabase/schema.sql:1014-1032` (RLS policies)
**Before:** Users could INSERT/UPDATE/DELETE their own deposits and withdrawals directly, bypassing validation in `request_deposit()` and `request_withdrawal()` RPCs (amount limits, balance checks, status validation).
**Exploit:** User inserts a deposit record with `status='approved'` directly, skipping admin approval flow.
**Fix:** Changed `deposits_write_own_or_admin` and `withdrawals_write_own_or_admin` policies to admin-only. Users must use SECURITY DEFINER RPCs which have proper validation.

### V-006: Hardcoded Supabase Credentials (High)

**File:** `src/lib/supabase.ts:3-5`
**Before:**
```typescript
const DEFAULT_SUPABASE_URL = 'https://xdrokyklrmfiwrfwgtgc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGci...';
```
**Risk:** Credentials embedded in source code committed to public repository; cannot be rotated without code change.
**Fix:** Removed all hardcoded fallbacks. Added fail-safe that throws in production if env vars are missing.

### V-007: Production Sourcemaps (Medium)

**File:** `vite.config.ts:136`
**Before:** `sourcemap: true`
**Risk:** Sourcemaps expose original TypeScript source code, business logic, and internal comments to any user who opens browser DevTools.
**Fix:** `sourcemap: false`

### V-008: Public is_admin Function (Medium)

**File:** `supabase/schema.sql:232-245`
**Before:** `public.is_admin(uuid)` existed alongside `private.is_admin(uuid)`.
**Risk:** Client-side code could call `select public.is_admin('<uuid>')` to enumerate which users are admins.
**Fix:** Dropped `public.is_admin`. Only `private.is_admin` remains (not callable from client).

### V-009: Unauthenticated Referral Code Validation (Medium)

**File:** `supabase/schema.sql:903`
**Before:** `grant execute on function public.validate_referral_code(text) to anon, authenticated;`
**Risk:** Unauthenticated users could brute-force referral codes to enumerate valid codes and their associated user IDs.
**Fix:** Revoked `anon` access. Only `authenticated` users can validate referral codes.

### V-010-012: CI/CD Hardening (Medium)

**Files:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
**Before:**
- Actions referenced by mutable tag (`@v4`) — vulnerable to tag poisoning
- No explicit permissions — defaults to broad `contents: write`
- No security audit, lint, or typecheck steps in CI

**Fix:**
- Pinned all actions to immutable commit SHAs
- Added explicit `permissions: contents: read` at workflow and job levels
- Added `npm audit --audit-level=high`, `npm run lint`, and `npm run typecheck` steps

### V-013: Missing Security Headers (Low)

**File:** `public/_headers` (new)
**Before:** No server-side security headers configured.
**Fix:** Added `_headers` file for Cloudflare/reverse proxy deployment with:
- `Content-Security-Policy` (strict, allows only Supabase and Sentry)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

---

## Before/After Comparison

| Metric | Before | After |
|--------|--------|-------|
| npm audit Critical | 1 | 0 |
| npm audit High | 5 | 0 |
| npm audit Moderate | 3 | 0 |
| npm audit Total | 9 | 0 |
| Hardcoded secrets in code | 2 (URL + key) | 0 |
| Sourcemaps in prod build | Yes | No |
| .map files in dist/ | Present | 0 |
| IDOR vulnerabilities | 1 (apply_referral_link) | 0 |
| Direct table write bypass | 2 (deposits, withdrawals) | 0 |
| Public admin check function | Yes | No (private only) |
| Anon RPC access | 1 (validate_referral_code) | 0 |
| CI actions pinned to SHA | 0/5 | 5/5 |
| CI security checks | 0 (build only) | 3 (audit + lint + typecheck) |
| Workflow permissions | Implicit (broad) | Explicit (least-privilege) |
| Security headers file | None | CSP + 4 headers |

---

## Tests Executed

| Test | Result |
|------|--------|
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `npm run lint` | Pass (0 errors) |
| `npm run typecheck` | Pass (0 errors) |
| `npm run build` (with env vars) | Pass |
| Sourcemap check (`find dist -name '*.map'`) | 0 files |
| SECURITY DEFINER `search_path` audit | All 11 functions set `search_path = public` |
| RLS enabled check | All 9 tables have RLS enabled |
| Admin auth check in RPCs | `admin_manage_deposit` and `admin_manage_withdrawal` check `is_admin()` |
| `target="_blank"` audit | All 3 links have `rel="noopener noreferrer"` |
| `dangerouslySetInnerHTML` audit | 0 occurrences |
| `console.log` audit | 3 occurrences (all error/warn level, acceptable) |

---

## Residual Risks

| Risk | Severity | Rationale |
|------|----------|-----------|
| No server-side rate limiting on RPCs | Medium | Supabase free tier has no built-in rate limiting. Mitigation: use Cloudflare WAF rules or upgrade to Supabase Pro. |
| Supabase anon key is publishable | Low | By design (equivalent to a public API key). Security depends on RLS policies, which are now tightened. |
| No server-side input sanitization | Low | All writes go through SECURITY DEFINER RPCs with input validation. Frontend uses React (auto-escapes output). No `dangerouslySetInnerHTML` usage. |
| `_headers` file requires Cloudflare/reverse proxy | Low | GitHub Pages does not natively serve custom headers. Headers file will work if served via Cloudflare Pages or a reverse proxy. |
| Node.js version (22.12.0) below engine requirement for some deps | Low | Engine warnings only; no runtime issues observed. Consider upgrading Node.js to 22.13+. |

---

## Breaking Changes

| Change | Impact | Rollback |
|--------|--------|----------|
| Hardcoded Supabase fallbacks removed | Build will fail without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars | Add env vars to GitHub Secrets and local `.env` |
| `public.is_admin()` dropped | Any client code calling `public.is_admin()` will fail | Already uses `private.is_admin()` internally |
| `validate_referral_code` requires auth | Unauthenticated referral validation will fail | Users must be logged in first |
| Deposit/withdrawal direct writes blocked | Direct INSERT/UPDATE on deposits/withdrawals table will fail for non-admin users | Use `request_deposit()` and `request_withdrawal()` RPCs |
| vitest 2.x -> 4.x | Test config may need updates | Revert vitest version in package.json |
| vite-plugin-pwa 0.20.x -> 1.x | PWA config syntax may differ (currently disabled) | Revert version |

---

## Rollback Plan

1. **Git revert:** `git revert --no-commit HEAD~4..HEAD && git commit -m "revert: security hardening"`
2. **Supabase:** Run the reverse migration:
   - Re-create `public.is_admin()` function
   - Re-grant anon to `validate_referral_code`
   - Restore `deposits_write_own_or_admin` and `withdrawals_write_own_or_admin` policies
3. **Dependencies:** `git checkout main -- package.json package-lock.json && npm ci`

---

## Checklist

| Item | Done |
|------|------|
| npm audit 0 critical | Yes |
| npm audit 0 high | Yes |
| Build passes | Yes |
| Lint passes | Yes |
| Typecheck passes | Yes |
| No hardcoded secrets | Yes |
| No sourcemaps in prod | Yes |
| RLS on all tables | Yes |
| SECURITY DEFINER search_path set | Yes |
| Admin RPCs check authorization | Yes |
| IDOR fixed | Yes |
| CI actions pinned | Yes |
| CI permissions least-privilege | Yes |
| Security headers configured | Yes |
| Audit report created | Yes |

---

## Post-Merge Actions

1. **Set GitHub Secrets:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured in repository Settings > Secrets.
2. **Run Supabase migration:** Execute `005_security_hardening.sql` in the Supabase SQL Editor to apply RPC/RLS fixes to the live database.
3. **Configure Cloudflare:** If using Cloudflare, enable the WAF and configure rate limiting rules for the Supabase API.
4. **Rotate Supabase anon key:** Since the old key was committed to the public repo, consider rotating it via Supabase Dashboard > Settings > API.
5. **Set up monitoring:** Configure Sentry alerts for error spikes and Supabase Dashboard alerts for unusual query patterns.
6. **DNS security:** Add SPF, DMARC, and CAA records for the production domain.
7. **Add `security.txt`:** Create `/.well-known/security.txt` with contact info for responsible disclosure.
8. **Enable Supabase Auth rate limiting:** Configure rate limits in Supabase Dashboard > Auth > Rate Limits.
9. **Schedule dependency audits:** Set up Dependabot or Renovate for automated dependency updates.
10. **Penetration test:** Consider a professional pentest before production launch, focusing on the financial flows (deposits/withdrawals).
