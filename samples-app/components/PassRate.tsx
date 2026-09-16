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
  return <div className="pass-rate" aria-label={`Opus 5 calibration: ${percentage} percent task pass rate, ${passed} of ${total} attempts passed`}>
    <div className="calibration-label">MODEL CALIBRATION</div>
    <div className="pass-rate-heading">
      <div><strong className="calibration-model">Opus 5</strong><span className="calibration-metric">Task pass rate</span></div>
      <strong className="calibration-value">{percentage}<small>%</small></strong>
    </div>
    <div className="trial-outcomes" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span className={i < passed ? 'trial-pass' : 'trial-fail'} key={i}>{i < passed ? '✓' : '×'}</span>)}
    </div>
    <div className="pass-rate-caption"><span>{passed} of {total} attempts passed</span><span>Historical runs</span></div>
  </div>;
}
