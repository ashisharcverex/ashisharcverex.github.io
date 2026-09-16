import { describe, it, expect } from 'vitest';
import { verifiedEmail, brokerSlug, sameOrigin } from '../lib/policy';
describe('access policy', () => {
  it('requires a verified primary email, not another verified address', () => {
    const user = { primaryEmailAddressId: 'primary', emailAddresses: [
      { id: 'primary', emailAddress: 'a@example.com', verification: { status: 'unverified' } },
      { id: 'other', emailAddress: 'b@example.com', verification: { status: 'verified' } },
    ] };
    expect(verifiedEmail(null)).toBeNull();
    expect(verifiedEmail(user)).toBeNull();
    user.emailAddresses[0].verification.status = 'verified';
    expect(verifiedEmail(user)).toBe('a@example.com');
  });
  it('accepts personal email addresses', () => {
    expect(verifiedEmail({ primaryEmailAddressId: 'a', emailAddresses: [{ id: 'a', emailAddress: 'person@gmail.com', verification: { status: 'verified' } }] })).toBe('person@gmail.com');
  });
  it('rejects unsafe or unbounded referral identifiers', () => {
    for (const value of ['../x', 'https://evil.test', '<script>', '', 'a'.repeat(65), null]) expect(brokerSlug(value)).toBeNull();
    expect(brokerSlug('broker-name')).toBe('broker-name');
  });
  it('rejects cross-origin tracking requests', () => {
    expect(sameOrigin(null, 'https://samples.arcverex.io')).toBe(false);
    expect(sameOrigin('https://evil.test', 'https://samples.arcverex.io')).toBe(false);
    expect(sameOrigin('https://samples.arcverex.io', 'https://samples.arcverex.io')).toBe(true);
  });
});
