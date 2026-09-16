import 'server-only';
import { Resend } from 'resend';
import { db } from './db';
export async function flushNotifications() {
  if (!process.env.RESEND_API_KEY) return { sent: 0, configured: false };
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (let i = 0; i < 20; i++) {
    // Lease atomically; overlapping requests cannot claim the same pending email.
    const [row] = await db()`UPDATE notification_outbox SET
      lease_until = now() + interval '5 minutes',
      first_attempt_at = COALESCE(first_attempt_at, now())
      WHERE id = (SELECT id FROM notification_outbox
        WHERE sent_at IS NULL AND (lease_until IS NULL OR lease_until < now())
        AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
        ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING id, payload`;
    if (!row) break;
    try {
      const { error } = await resend.emails.send(row.payload, { idempotencyKey: `sample-notification-${row.id}` });
      if (error) throw new Error('Email provider rejected notification');
      await db()`UPDATE notification_outbox SET sent_at = now(), last_error = NULL WHERE id = ${row.id}`;
      sent++;
    } catch {
      // Do not log addresses, content, or provider responses. Retry with same payload/key.
      await db()`UPDATE notification_outbox SET last_error = 'Delivery not confirmed; retry pending' WHERE id = ${row.id}`;
    }
  }
  return { sent, configured: true };
}
