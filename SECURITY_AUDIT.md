# Security Audit

Date: 2026-06-26  
Scope: local code review and local/test execution only. No production probing, no brute force, no external infrastructure scan.

## Threat Model

Sensitive assets: user profiles, activities, planned workouts, goals, GPS traces, Strava OAuth tokens, Supabase service role key, JWT secrets, Resend API key, reset and verification tokens.

Trust boundaries:

- Browser to Next.js frontend.
- Browser to NestJS API over `NEXT_PUBLIC_API_URL`.
- NestJS API to PostgreSQL through Prisma.
- NestJS API to Resend, Strava and Supabase.
- Public OAuth callback from Strava back to the backend.

Public routes observed:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/verify-email`
- `GET /strava/callback`

Authenticated routes observed:

- `/auth/me`, `/users/*`, `/activities/*`, `/goals/*`, `/upload/avatar`, `/strava/status`, `/strava/connect`, `/strava/sync`, `/strava/disconnect`.
- `/admin/*` requires JWT plus `ADMIN` role.

Most critical actions: password reset, email verification, login, profile/password change, admin user mutation, Strava connection, activity mutation/deletion, planned workout completion, avatar upload.

## Findings

| ID | Severity | Confidence | Component | Evidence | Description | Realistic exploitation scenario | Impact | Recommended correction | Status |
|---|---|---:|---|---|---|---|---|---|---|
| SEC-001 | High | High | Backend JWT | `backend/src/modules/auth/auth.service.ts:73`, `backend/src/modules/auth/strategies/jwt.strategy.ts:16` | JWT signing and validation previously had hardcoded fallback secrets. | A deployment missing env vars could issue/accept tokens signed with predictable defaults. | Account takeover if fallback secret is known. | Require `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`; pin `HS256`. | Fixed |
| SEC-002 | High | High | Secrets | Git history for `backend/.env.example` | A Resend-looking API key was present in a tracked example file in history. | Anyone with repo history could recover and abuse the key if it was real. | Unauthorized email sending, reputation/cost impact. | Replace with placeholder and revoke/rotate the exposed key. | Fixed in file; rotation required |
| SEC-003 | Medium | High | Auth rate limiting | `backend/src/modules/auth/auth.service.ts:116`, `backend/src/modules/auth/auth.service.ts:296`, `backend/src/modules/auth/auth.service.ts:436`, `backend/src/app.module.ts` | Sensitive auth routes had only partial forgot-password limiting. | An attacker can rapidly test credentials or tokens from a single client. | Credential stuffing and token guessing amplification. | Add route/service-level rate limiting and global throttling. | Fixed |
| SEC-004 | Medium | High | Passwords | `backend/src/modules/auth/auth-security.constants.ts`, `backend/src/modules/auth/dto/register.dto.ts`, `backend/src/modules/auth/dto/reset-password.dto.ts` | Password min length was inconsistent and no bcrypt-safe maximum existed. | Very long inputs can waste CPU and bcrypt truncation can surprise users. | DoS risk and weak password policy inconsistency. | Centralize bcrypt cost, min length and max length. | Fixed |
| SEC-005 | Medium | High | Sessions | `backend/src/modules/users/users.service.ts:90` | User password change did not revoke existing refresh session. | A stolen refresh token remains valid after the victim changes password. | Persistent session compromise. | Set `refreshToken` to `null` on password change. | Fixed |
| SEC-006 | Medium | High | Upload | `backend/src/modules/upload/upload.controller.ts:39`, `backend/src/modules/upload/upload.service.ts:35` | Avatar upload accepted untyped files and used the client filename extension. | User uploads unexpected content type or deceptive extension. | Stored malicious file/content confusion. | Enforce image MIME allowlist and derive extension from MIME. | Fixed |
| SEC-007 | Medium | High | HTTP config | `backend/src/main.ts:16`, `backend/src/main.ts:34`, `apps/web/next.config.js:27` | Backend lacked Helmet/payload limits and frontend lacked security headers. | Browser-side attacks have fewer default mitigations; large JSON payloads can stress API. | Increased XSS/clickjacking/sniffing/DoS exposure. | Add Helmet, strict CORS, payload limits, and frontend headers. | Fixed / CSP progressive |
| SEC-008 | Medium | High | Strava OAuth | `backend/src/modules/strava/strava.service.ts:843` | Strava state secret previously fell back to JWT/default secret and comparison was direct string compare. | Misconfigured deployment signs OAuth state with predictable secret. | OAuth connection hijack risk in misconfiguration. | Require `STRAVA_STATE_SECRET`, validate state shape, use constant-time compare. | Fixed |
| SEC-009 | Medium | Medium | Frontend auth storage | `apps/web/store/auth-store.ts:35`, `apps/web/lib/api.ts:17` | Access token is stored in `localStorage`. | Any XSS can read the access token and call the API. | User account compromise until token expiration. | Migrate to HttpOnly, Secure, SameSite cookie sessions with CSRF analysis. | Open structural |
| SEC-010 | Medium | Medium | Strava tokens | `backend/src/modules/strava/strava.service.ts:225`, `backend/src/modules/strava/strava.service.ts:413` | Strava access/refresh tokens are stored directly in DB. | DB read exposure reveals reusable third-party tokens. | Strava account data exposure until revoked. | Encrypt tokens at rest with managed key rotation. | Open structural |
| SEC-011 | Medium | Medium | OAuth replay | `backend/src/modules/strava/strava.service.ts:785` | Strava `state` is signed and expiring but nonce reuse is not persisted. | A captured unused callback URL could be replayed during TTL. | Duplicate or unintended Strava connection update. | Persist and consume OAuth nonces one time. | Open structural |
| SEC-012 | Low | High | IDOR/BOLA | `backend/src/modules/activities/activities.service.ts`, `backend/src/modules/goals/goals.service.ts`, `backend/src/modules/users/users.service.ts` | Activity, goal and user profile operations constrain queries with authenticated user id or server-side id. | User changes URL id to access another user's data. | Expected denial without existence disclosure. | Keep user-scoped queries and add broader e2e BOLA tests. | Verified; test coverage partial |
| SEC-013 | Low | High | Validation | `backend/src/main.ts:51`, DTO files | Global `ValidationPipe` uses whitelist and forbid non-whitelisted; DTO max lengths were improved. | Attacker sends extra fields like `role` in register payload. | Mass assignment blocked. | Maintain DTO coverage for all new inputs. | Fixed |
| SEC-014 | Information | High | CSP | `apps/web/next.config.js:3` | CSP is currently report-only and allows inline script/style for compatibility with existing Next/theme code and Mapbox. | XSS prevention is not fully enforced by CSP yet. | Reduced browser hardening until nonce migration. | Move theme bootstrapping to nonce-compatible script and enforce CSP. | Open structural |
| SEC-015 | High | High | Dependencies | `backend/pnpm-lock.yaml`, `backend/pnpm-workspace.yaml` | `pnpm audit --prod` reported Multer DoS advisories through Nest platform-express. | Crafted multipart fields or aborted uploads can increase resource consumption. | Denial of service on upload endpoints. | Override all Multer resolutions to `2.2.0` and keep upload limits. | Fixed |
| SEC-016 | Medium | High | Dependencies | `apps/web/package-lock.json` | `npm audit --omit=dev` still reports PostCSS bundled by Next. The suggested `--force` fix would install `next@9.3.3`, a breaking downgrade. | If attacker controls CSS passed through vulnerable stringify path. No direct app path confirmed. | Potential XSS in specific CSS stringification scenarios. | Track Next patched release and upgrade normally; do not apply npm's breaking downgrade. | Open dependency |

## Corrections Applied

- Removed JWT fallback secrets and pinned JWT algorithm.
- Added required placeholder env vars for JWT, Strava and Supabase.
- Added global throttling with `@nestjs/throttler` and service-level auth rate limiting.
- Centralized bcrypt cost and password limits.
- Normalized auth/admin emails consistently.
- Revoked refresh sessions on user password change.
- Hardened avatar upload MIME validation and extension generation.
- Added Helmet, backend payload limits, exact CORS allowlist and proxy awareness.
- Added frontend security headers and CSP report-only policy compatible with current Mapbox/Next setup.
- Hardened Strava OAuth state verification and removed default state secret.
- Expanded `.gitignore` for nested `.env*`.
- Updated/overrode vulnerable backend Multer dependency to patched `2.2.0`.
- Applied non-breaking frontend `npm audit fix`; remaining Next/PostCSS advisory documented.

## Residual Risks

- `localStorage` token storage should be migrated to HttpOnly cookie auth before a larger beta.
- Strava tokens should be encrypted at rest.
- Strava OAuth nonces should be persisted and consumed one time.
- CSP should move from report-only to enforced after nonce-compatible frontend refactor.
- Full e2e BOLA tests with two real users should be added when a test database harness is available.
- Frontend production build hangs locally after starting Turbopack optimized build; typecheck passes.

## Manual Deployment Checklist

- Rotate any Resend key that may have appeared in Git history.
- Set strong unique values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `STRAVA_STATE_SECRET`.
- Restrict `FRONTEND_URL` to the real Vercel origin in backend production.
- Restrict Mapbox public token to production and preview domains.
- Confirm Supabase service role key is backend-only.
- Confirm Vercel has only `NEXT_PUBLIC_*` values that are meant to be public.
- Confirm backend logs do not include request bodies for auth/reset/OAuth routes.
- Review CSP report-only violations in Vercel before enforcing CSP.

## Validation Results

- Backend targeted security tests: `pnpm test -- auth.service security-validation users.service strava.service` passed, 28 tests.
- Backend all tests: `pnpm test` passed, 10 suites / 72 tests.
- Backend typecheck: `pnpm exec tsc --noEmit` passed.
- Backend build: `pnpm run build` passed.
- Backend production dependency audit: `pnpm audit --prod` passed, no known vulnerabilities after Multer override.
- Web typecheck: `npm run typecheck` passed.
- Web dependency audit: `npm audit --omit=dev` reports 2 moderate advisories through Next's bundled PostCSS; npm's suggested `--force` fix is a breaking downgrade and was not applied.
- Web build: `npm run build` restored SWC binaries but hung locally during Turbopack optimized production build after "Creating an optimized production build ..."; process was stopped after several minutes with no additional output.
- Backend lint: `pnpm run lint` failed on pre-existing strict lint debt across tests/services and a few touched files; typecheck and tests remain green.
- Web lint: `npm run lint` failed on pre-existing React Compiler and style lint issues across app pages/components; no security UI refactor was attempted in this pass.
