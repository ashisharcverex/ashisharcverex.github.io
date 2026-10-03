import React from 'react';
import { priorityResults } from '@/lib/ppa-sample';
export function PPAResults({ slug }: { slug: string }) {
  if (slug !== 'ppa-priority-selector') return null;
  return <section aria-labelledby="ppa-results-title">
    <h3 id="ppa-results-title">Continuous optimization results</h3>
    <p>The starting design has a delay of 1.209 ns. These three examples preserve cycle-for-cycle behavior, meet timing and routing constraints, and stay below the starting area of 629.622 µm².</p>
    <div style={{ overflowX: 'auto' }}><table className="ppa-results-table">
      <caption>Selected examples · private grading measurements</caption>
      <thead><tr><th scope="col">Outcome</th><th scope="col">Delay</th><th scope="col">Reduction</th><th scope="col">Area</th><th scope="col">Reward</th></tr></thead>
      <tbody>{priorityResults.map(r => <tr key={r.run}><th scope="row">{r.label}</th><td>{r.delay_ns.toFixed(3)} ns</td><td>{r.improvement_percent.toFixed(1)}%</td><td>{r.area_um2.toFixed(1)} µm²</td><td>{r.reward.toFixed(3)}</td></tr>)}</tbody>
    </table></div>
  </section>;
}
