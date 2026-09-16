# Arcverex sample gallery

A separate Next.js server application for `samples.arcverex.io`. The existing root website stays on GitHub Pages. Deploy this directory as a separate Vercel project; GitHub Pages cannot run this application.

The collection starts empty. No real samples, author references, hidden RTL, trajectories, or private DUT assets are included. Never commit private sample content to this public repository or put it in `public/`. Approved customer-facing sample text is stored in Postgres and read only on authenticated server requests. The initial reader presents text/code literally, without executing HTML, Markdown, or submitted code.

## Local setup

Use Node.js 22 or later:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Without Clerk keys, the public landing and privacy pages render, the access button is replaced with a preparation notice, and protected pages redirect home. This is not a login bypass. To preview the authenticated gallery, configure a Clerk development application and a development Postgres database. There is no fake-auth mode.

Set the variables in `.env.local`, then run `npm run db:migrate`. The migration only creates tables; it does not select or seed samples. `npm test` uses an isolated in-process Postgres test database, mocked Clerk identity, and mocked Resend; it never emails anyone.

## Production setup

1. Create a Clerk production application for `samples.arcverex.io`. Enable open sign-ups, email as the required identifier, email verification codes for sign-up and sign-in, and disable passwords, social providers, extra profile requirements, and email/domain restrictions. Personal addresses should work. Configure the sign-in and sign-up URLs from `.env.example`. Complete Clerk's production domain/DNS setup. The server also checks that the primary email is verified before serving samples.
2. Create a managed Postgres database (for example through Vercel's marketplace), preferably a pooled connection with TLS. Set `DATABASE_URL` and apply `db/schema.sql` using `npm run db:migrate` with the production connection securely configured.
3. Create a Resend account, verify the sender domain, and add its prescribed DNS records. Set `RESEND_API_KEY`, `NOTIFICATION_FROM`, and `NOTIFICATION_TO=ashish@arcverex.io`.
4. Create a Vercel project with **Root Directory `samples-app`**, framework Next.js, Node 22+, and the variables in `.env.example`. Set `APP_URL=https://samples.arcverex.io` and generate a random `CRON_SECRET` (at least 32 random bytes). Configure Clerk production keys for this deployment; keep development and production credentials separate.
5. Add `samples.arcverex.io` to that project and use the exact DNS records Vercel supplies. Keep the apex domain's GitHub Pages configuration.
6. The bundled ten-minute notification retry cron requires a hosting plan that supports that frequency (Vercel Pro or equivalent). Alternatively invoke `GET /api/notifications` every ten minutes from a scheduler with `Authorization: Bearer <CRON_SECRET>` and remove the Vercel cron configuration. Notifications are also attempted immediately after a view.
7. Before sharing, verify a fresh personal email, a fresh company email, repeat login, a forwarded broker link, access denial without a session, sample view recording, real email delivery, and the retry scheduler using an explicitly approved test sample. Authentication delivery and live alerts cannot be verified without these accounts.

Keep secret keys in deployment environment settings or ignored `.env.local`, never in Git or browser variables. Only Clerk's publishable key uses the `NEXT_PUBLIC_` prefix. Preview deployments need their own matching APP_URL and allowed Clerk configuration.

## Broker links and access records

Share `https://samples.arcverex.io/b/broker-name`. Lowercase letters, digits, and hyphens are accepted, up to 64 characters. The last broker link opened is remembered for 30 days in an HttpOnly cookie. Forwarding the broker link retains attribution; forwarding the bare gallery URL on a new device does not. Referral attribution is informational, not proof of who referred someone.

The browser records a view when a sample page is mounted in a visible tab; prefetching and login alone do not generate alerts. The server derives the email from Clerk, not browser input. `sample_views` coalesces repeated views of each sample by the same Clerk user on the same UTC day. It records sample, verified email, timestamp, and broker. It is not a click-by-click analytics log.

The first sample viewed by an email address each UTC day creates one notification to `ashish@arcverex.io`. Distinct sample views still appear in the database. There is no alert for browsing the empty gallery. No automatic newsletter enrollment is implemented.

## Delivery reliability

View records and notification payloads are committed together in a transaction. A unique email/day constraint suppresses duplicate notifications. A database lease avoids overlapping send attempts; Resend idempotency keys cover uncertain delivery outcomes. Notification payloads are frozen for identical retries. Failures retain the outbox row, with retries after five minutes, up to 23 hours after the first attempt. This intentionally stops before Resend's 24-hour idempotency expiration; older unresolved rows require investigation before any manual resend to avoid duplicates. Missing Resend configuration leaves notifications queued.

Inspect pending notifications:

```sql
SELECT id, created_at, first_attempt_at, lease_until, last_error
FROM notification_outbox WHERE sent_at IS NULL ORDER BY created_at;
```

Delivery errors are not reported to customers; monitor pending rows and hosting errors. The browser view event is best-effort and can be blocked by a visitor's browser or network; this is an engagement signal, not a proof-of-reading receipt.

## Adding samples later

Add approved material directly to the `samples` table through a private database workflow. Columns: `slug`, `title`, `summary`, `category`, `body`, `published`. Drafts default to unpublished; only rows explicitly marked `published=true` are served. Do not store sample content in a SQL file committed here. Attachments, Markdown rendering, uploads, and an admin UI are intentionally left for the sample-selection phase.

## Privacy operations

The public privacy page explains identity, view, and referral collection. Before launch, confirm the text matches your chosen providers and retention policy. For a deletion request, remove the matching `sample_views` and `notification_outbox` records, the Clerk user, and associated notification emails/provider records as appropriate. A retention schedule is not automated yet.

## Checks

```sh
npm test
npm run build
npm run typecheck
```

Tests cover primary-email verification, unrestricted personal emails, invalid referrals, same-origin requests, authenticated tracking, draft visibility, per-day notification suppression, durable retries, and the idempotency deadline. Live Clerk and Resend integration still requires a configured staging environment.
