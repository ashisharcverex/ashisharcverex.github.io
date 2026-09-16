# Local validation

Validated on 2026-09-15 using Node.js 22.23.2 (ARM64), with the committed dependency lockfile.

- 18 tests passed: verified primary email, personal email access, origin validation, referral identifiers/cookies, protected content reads, scheduler authorization, database view coalescing, daily notifications, draft exclusion, and notification retry/idempotency handling.
- Production Next.js build passed.
- TypeScript check passed.
- Local production HTTP checks passed for the landing page, privacy page, broker redirect, protected gallery/detail redirects with no auth configuration, and unauthorized tracking/notification APIs.
- Dependency installation reported no known vulnerabilities.

Tests used an isolated PGlite database and mocked Clerk/Resend. No real email was sent. No production account was connected, no sample was published, and no deployment was made. Live email verification, authenticated browser flows, real notification delivery, hosting cron, and DNS must be checked after staging credentials are configured.
