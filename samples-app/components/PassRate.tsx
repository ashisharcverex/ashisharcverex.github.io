import React from 'react';

export function parsePassRate(summary: string) {
  const match = /\s+Opus (5(?:\.5)?) · (?:Closed network · )?\d+% \((\d+)\/(\d+)\)\.$/.exec(summary);
  if (!match) return { description: summary, rate: undefined };
  const passed = Number(match[2]);
  const total = Number(match[3]);
  if (!total || passed > total) return { description: summary, rate: undefined };
  return { description: summary.slice(0, match.index), rate: { passed, total, ...(match[1] === '5.5' ? { model: 'Opus 5.5' } : {}) } };
}

export function PassRate({ passed, total, model = 'Opus 5' }: { passed: number; total: number; model?: string }) {
  const percentage = Math.round(passed / total * 100);
  return <div className="pass-rate" aria-label={`${model} calibration: ${percentage} percent task pass rate, ${passed} of ${total} attempts passed`}>
    <div className="calibration-label">Calibrated Sample</div>
    <div className="pass-rate-heading">
      <div><strong className="calibration-model">{model}</strong><span className="calibration-metric">Task pass rate</span></div>
      <strong className="calibration-value">{percentage}<small>%</small></strong>
    </div>
    <div className="trial-outcomes" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span className={i < passed ? 'trial-pass' : 'trial-fail'} key={i}>{i < passed ? '✓' : '×'}</span>)}
    </div>
  </div>;
}
