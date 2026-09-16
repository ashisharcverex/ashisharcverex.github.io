import React from 'react';

export function parsePassRate(summary: string) {
  const match = /\s+Opus 5 · (?:Closed network · )?\d+% \((\d+)\/(\d+)\)\.$/.exec(summary);
  if (!match) return { description: summary, rate: undefined };
  const passed = Number(match[1]);
  const total = Number(match[2]);
  if (!total || passed > total) return { description: summary, rate: undefined };
  return { description: summary.slice(0, match.index), rate: { passed, total } };
}

export function PassRate({ passed, total }: { passed: number; total: number }) {
  const percentage = Math.round(passed / total * 100);
  return <div className="pass-rate" aria-label={`Opus 5 pass rate: ${percentage} percent, ${passed} of ${total} runs passed`}>
    <div className="pass-rate-heading"><span>Opus 5 pass rate</span><strong>{percentage}<small>%</small></strong></div>
    <div className="pass-rate-track" role="meter" aria-label="Opus 5 pass rate" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={`${passed} of ${total} runs passed`}>
      <span style={{ width: `${passed / total * 100}%` }} />
    </div>
    <div className="pass-rate-caption"><span>{passed} / {total} passed</span><span>Historical runs</span></div>
  </div>;
}
