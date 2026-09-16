export function verifiedEmail(user: { primaryEmailAddressId: string | null; emailAddresses: { id: string; emailAddress: string; verification: { status: string } | null }[] } | null) {
  const email = user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  return email?.verification?.status === 'verified' ? email.emailAddress : null;
}
export function brokerSlug(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value) ? value : null;
}
export function sameOrigin(origin: string | null, app: string) {
  return origin !== null && origin === new URL(app).origin;
}
