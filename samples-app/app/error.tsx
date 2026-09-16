'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="empty"><h1>Couldn’t load this page.</h1><button className="button" onClick={reset}>Try again</button></section>;
}
