import React from 'react';

type Check = { status: string; detail: string };
const categories = [
  { title: 'Reference passes', icon: '◇' },
  { title: 'Bad solutions fail', icon: '×' },
  { title: 'Spec reviewed', icon: '≡' },
  { title: 'Coverage checked', icon: '◎' },
  { title: 'Sandbox integrity', icon: '⬡' },
];
const checks: Record<string, Check[]> = {
  'sv-testbench-apb-registers': [
    { status: 'Evidence pending', detail: 'A reference-bench check exists; its result needs to be verified against the exact sample version.' },
    { status: 'Check missing', detail: 'The QA suite is missing its competent but shallow testbench control.' },
    { status: 'Review needed', detail: 'Review the prompt against both correct implementations and each injected fault.' },
    { status: 'Evidence pending', detail: 'Record coverage for reset timing, long idle periods and handshake boundaries.' },
    { status: 'Validation pending', detail: 'Validate private-asset isolation and trusted grading results for this sample.' },
  ],
  'rtl-design-credit-flow': [
    { status: 'Evidence pending', detail: 'Independent references exist; a passing reference result needs to be verified against the exact sample version.' },
    { status: 'Evidence missing', detail: 'A matching faulty-design test suite and its results have not yet been established for this sample.' },
    { status: 'Timing unresolved', detail: 'Independent reviews identify ambiguity in grant and credit timing. Historical pass rates include this ambiguity.' },
    { status: 'Evidence pending', detail: 'Record coverage for credit limits, simultaneous sends and returns, arbitration and reset.' },
    { status: 'Validation pending', detail: 'Validate isolation and ensure conflicting verdicts or simulator failures cannot produce a pass.' },
  ],
  'rtl-debug-accumulator': [
    { status: 'Evidence pending', detail: 'Reference-repair and larger-rewrite controls exist; their results need to be verified against the exact sample version.' },
    { status: 'Evidence pending', detail: 'An unrepaired-design control exists; its failure needs a matching QA record.' },
    { status: 'Timing unresolved', detail: 'Completion and back-to-back launch timing need clarification. Historical pass rates include this ambiguity.' },
    { status: 'Evidence pending', detail: 'Record coverage for signed limits, saturation, reset, idle holds and completion timing.' },
    { status: 'Validation pending', detail: 'Expand workspace leakage checks to runtime isolation and trusted grading results.' },
  ],
};

export function QACategories({ slug }: { slug: string }) {
  const items = checks[slug];
  if (!items) return null;
  return <div className="qa-overview">
    <p className="fine">QA targets · Open each category for this sample’s evidence status.</p>
    <ul className="qa-categories" aria-label="QA categories and evidence status">
      {categories.map((category, i) => <li key={category.title}>
        <details className="qa-category">
          <summary>
            <span className="qa-icon" aria-hidden="true">{category.icon}</span>
            <span className="qa-title">{category.title}</span>
            <span className="qa-status">{items[i].status}</span>
            <span className="qa-expand" aria-hidden="true">+</span>
          </summary>
          <p>{items[i].detail}</p>
        </details>
      </li>)}
    </ul>
  </div>;
}
