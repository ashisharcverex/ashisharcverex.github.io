'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="empty"><h1>We couldn’t load this page.</h1><p>Please try again, or contact ashish@arcverex.io.</p><button className="button" onClick={reset}>Try again</button></section>;
}
