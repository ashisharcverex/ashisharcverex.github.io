export function authConfigured() {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}
export function appUrl() { return new URL(process.env.APP_URL || 'http://localhost:3000'); }
