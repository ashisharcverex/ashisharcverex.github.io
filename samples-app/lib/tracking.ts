import 'server-only';
import { db } from './db';
import { appUrl } from './config';
export async function recordView(user: { id: string; email: string }, slug: string, broker: string | null) {
  return db().begin(async tx => {
    const [sample] = await tx`SELECT title FROM samples WHERE slug = ${slug} AND published = true`;
    if (!sample) return false;
    // A sample is recorded once per viewer per UTC day; repeated refreshes are coalesced.
    await tx`INSERT INTO sample_views (viewer_id, email, sample_slug, broker)
      VALUES (${user.id}, ${user.email}, ${slug}, ${broker}) ON CONFLICT DO NOTHING`;
    const body = {
      from: process.env.NOTIFICATION_FROM || 'Arcverex Samples <samples@arcverex.io>',
      to: [process.env.NOTIFICATION_TO || 'ashish@arcverex.io'],
      subject: 'Arcverex sample viewed',
      text: `${user.email} opened ${sample.title}.\nSample: ${new URL('/gallery/' + slug, appUrl())}\nBroker link: ${broker || 'Direct / unattributed'}\nRecorded: ${new Date().toISOString()}\n\nFirst sample view for this email today (UTC). Other sample views are stored in the database.`,
    };
    // Persist the exact email payload so retries have identical idempotency semantics.
    await tx`INSERT INTO notification_outbox (email, payload)
      VALUES (${user.email.toLowerCase()}, ${tx.json(body)}) ON CONFLICT DO NOTHING`;
    return true;
  });
}
