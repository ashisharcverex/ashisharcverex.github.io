'use client';
import { useEffect } from 'react';
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let recorded = false;
    const record = () => {
      if (recorded || document.visibilityState !== 'visible') return;
      recorded = true;
      void fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }), keepalive: true });
    };
    record();
    document.addEventListener('visibilitychange', record);
    return () => document.removeEventListener('visibilitychange', record);
  }, [slug]);
  return null;
}
