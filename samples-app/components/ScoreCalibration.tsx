import React from 'react';
import { priorityCalibration, priorityDisplayNumber } from '@/lib/ppa-sample';
export function ScoreCalibration({ slug }: { slug: string }) {
  if (slug !== 'ppa-priority-selector') return null;
  const mean = priorityCalibration.reduce((sum, r) => sum + r.score, 0) / priorityCalibration.length;
  return <div className="pass-rate score-calibration" aria-label={`Opus 5.5 calibration: mean reward ${mean.toFixed(3)}`}>
    <div className="calibration-label">Calibrated Sample</div>
    <div className="pass-rate-heading">
      <div><strong className="calibration-model">Opus 5.5</strong><span className="calibration-metric">Mean reward</span></div>
      <strong className="calibration-value">{mean.toFixed(3)}</strong>
    </div>
    <div className="score-outcomes" role="list" aria-label="Individual rollout rewards">
      {priorityCalibration.map(r => {
        const intensity = Math.max(0, Math.min(1, r.score));
        const label = `Rollout ${priorityDisplayNumber(r.run)}: reward ${r.score.toFixed(3)}`;
        return <span role="listitem" key={r.run} title={label} aria-label={label}
          style={{ backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg))` }} />;
      })}
    </div>
    <div className="score-legend" aria-label="Color scale: 0 to 1 reward; display range, not a reward cap"><span>0</span><span className="score-gradient" aria-hidden="true"/><span>1</span></div>
  </div>;
}
