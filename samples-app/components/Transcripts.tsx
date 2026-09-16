'use client';
import { useRef, useState } from 'react';
import type { TranscriptEntry } from '@/lib/transcripts';
function Transcript({ slug, entry }: { slug: string; entry: TranscriptEntry }) {
  const [body, setBody] = useState<string>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  async function load() {
    if (body !== undefined || pending.current) return;
    pending.current = true; setLoading(true); setError('');
    try {
      const response = await fetch(`/api/transcripts/${encodeURIComponent(slug)}/${entry.rollout_number}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(response.status === 401 ? 'Sign in again to read this transcript.' : 'Could not load transcript. Please retry.');
      const data = await response.json();
      setBody(data.body);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load transcript.'); }
    finally { pending.current = false; setLoading(false); }
  }
  return <details className="sample-section transcript-entry" onToggle={event => { if (event.currentTarget.open) void load(); }}>
    <summary>Rollout {entry.rollout_number}<span className={`rollout-verdict ${entry.passed ? 'rollout-pass' : ''}`}>{entry.passed ? 'Passed' : 'Did not pass'}</span></summary>
    {loading && <p role="status">Loading transcript…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></p>}
    {body !== undefined && <pre className="sample-body transcript-body" tabIndex={0} aria-label={`Rollout ${entry.rollout_number} transcript`}>{body}</pre>}
  </details>;
}
export function Transcripts({ slug, entries }: { slug: string; entries: TranscriptEntry[] }) {
  if (!entries.length) return null;
  return <section className="transcripts" aria-labelledby="transcript-heading">
    <h2 id="transcript-heading">Rollout transcripts <span className="fine">{entries.length}</span></h2>
    <p className="fine">Opus 5 · Messages, tool calls, and outputs from the saved runs. Runtime metadata omitted.</p>
    {entries.map(entry => <Transcript key={entry.rollout_number} slug={slug} entry={entry} />)}
  </section>;
}
