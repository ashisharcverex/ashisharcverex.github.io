import React from 'react';
export function FlowSteps({ steps, label }: { steps: [string, string][]; label: string }) {
  return <ol className={`ppa-flow ppa-flow-${steps.length}`} aria-label={label}>
    {steps.map(([title, detail], index) => <li key={title} className={index === steps.length - 1 ? 'ppa-flow-result' : undefined}>
      <strong>{title}</strong><span>{detail}</span>
    </li>)}
  </ol>;
}
