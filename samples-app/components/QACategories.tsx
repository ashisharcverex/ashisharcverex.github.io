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
  "testbench-environment": [{"status": "Reference qualification", "detail": "Check that a reference testbench accepts correct implementations and rejects the required faulty implementations."}, {"status": "Negative controls", "detail": "Use plausible incomplete testbenches to check that missing coverage prevents a passing reward."}, {"status": "Contract alignment", "detail": "Review expected behavior and injected faults against the specification, including reset and timing requirements."}, {"status": "Coverage validation", "detail": "Check that each fault has a legal distinguishing scenario and that checks observe the relevant behavior."}, {"status": "Private evaluation", "detail": "Keep private implementations and grader assets outside candidate build and runtime namespaces. Use host-owned reward receipts."}],
  "ppa-priority-selector": [{"status": "Reference qualification", "detail": "Check a known valid optimization against equivalence and physical constraints."}, {"status": "Negative controls", "detail": "Check that invalid designs, behavior changes and constraint violations do not receive improvement rewards."}, {"status": "Contract alignment", "detail": "Align the optimization goal, allowed RTL changes and declared constraints with the evaluator."}, {"status": "Measurement validation", "detail": "Check metric extraction and reward calculation against fixed baselines. Exclude infrastructure failures from reward statistics."}, {"status": "Private evaluation", "detail": "Keep reference solutions and grading assets outside the agent workspace. Bind host-owned results to the submitted RTL."}],
  "postsilicon-axiom-dual-queue": [{"status": "Saved reference passes", "detail": "The matching frozen author receipt passes all 26 private cases. No new replay was performed for this website update."}, {"status": "Failure controls recorded", "detail": "Saved negative controls and six of ten Opus 5 submissions fail. Readiness declarations do not override transfer failures."}, {"status": "Contract inspected", "detail": "The public manuals require real device transfers, timely completion and no late writes after completion. The lab is a Python behavioral emulator, not physical silicon."}, {"status": "26 cases per rollout", "detail": "Ten Opus 5 attempts each cover the same 26 private board/profile combinations; four pass. This finite set does not establish universal correctness. Some passing buffer-reuse choices make partial writes easier to detect."}, {"status": "Frozen provenance verified", "detail": "All ten host receipts match the frozen task, verifier sources and submitted artifacts. Saved service checks cover private/public separation and reward ownership. Private witnesses and grader sources are excluded from this page."}],
  'sv-testbench-dictionary-coder': [
    { status: 'Reference smoke test passed', detail: 'Fresh reference/public and bounded public/hidden-correct co-simulation pass; not a full isolated Oracle qualification.' },
    { status: 'Nine saved failures', detail: 'Nine of ten saved Opus 5.5 submissions miss required behavior.' },
    { status: 'No behavioral mismatch found', detail: 'Reviewed dictionary operations, capacity, reset, idle hold and busy rejection against RTL.' },
    { status: 'Three observed mechanisms', detail: 'Directed boundary conjunction, idle duration and reset observation. Not hint-validated causal labels.' },
    { status: 'Legacy verifier — qualification pending', detail: 'Saved outcomes used the inherited unified grader; fresh RTL smoke checks do not certify historical reward isolation.' },
  ],
  'sv-testbench-vu-meter': [
    { status: 'Reference smoke test passed', detail: 'Fresh reference/public simulation and bounded golden co-simulation pass; full isolated qualification is separate.' },
    { status: 'Nine saved failures', detail: 'Nine of ten saved Opus 5.5 runs miss required behavior.' },
    { status: 'Contract reviewed', detail: 'Busy rejection and idle/reset semantics are explicit. Sample-counter wrap wording needs clarification.' },
    { status: 'Three observed mechanisms', detail: 'Arithmetic distinction, uninterrupted idle and reset-phase observation. No causal hint intervention.' },
    { status: 'Legacy verifier — qualification pending', detail: 'Saved outcomes use the inherited unified grader. Fresh RTL QA does not certify those rewards as isolation-safe.' },
  ],
  'sv-testbench-rational-evaluator': [
    { status: 'Historical outcomes', detail: 'Saved grading records show both correct implementations accepted in all ten runs. This is not a fresh author-reference validation.' },
    { status: 'Eight incomplete benches', detail: 'Eight submissions accepted both correct implementations but missed at least one faulty behavior. Two submissions passed the entire saved suite.' },
    { status: 'Contract caveat', detail: 'Busy-time submit behavior is not explicit in the launch wording. Two failures include this omission; both also miss reset timing. Historical instructions are preserved.' },
    { status: 'Source reviewed', detail: 'Distinct observations include destructive reset probes, setup masking hidden state, short idle intervals and missing reset-phase observations. No causal hint intervention was run.' },
    { status: 'Historical verifier', detail: 'These runs used the inherited unified verifier. Private-asset isolation and trusted reward provenance require validation before treating the results as hardened benchmark evidence.' },
  ],
  'sv-testbench-knock-lock': [
    { status: 'Historical evidence', detail: 'Saved QA reports the reference bench accepts both correct designs and catches all 47 injected faults. Exact verifier provenance still needs validation.' },
    { status: 'Historical evidence', detail: 'A competent bench accepts both correct designs but catches only 44 of 47 faults, demonstrating three missed state-preservation checks.' },
    { status: 'Review needed', detail: 'The prompt specifies event priority and state updates. Independent specification review remains a separate QA gate.' },
    { status: 'Historical evidence', detail: 'Saved QA examines recording, confirmation, reset and lockout sequences. The selected transcripts cover all 11 missed checks in the audited calibration set.' },
    { status: 'Validation pending', detail: 'Validate private-asset isolation and trusted grading results for this sample.' },
  ],
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
  'rtl-debug-ot-backpressure': [
    { status: 'Verified replay', detail: 'The reference completes both benches on three seeds. An equivalent repair also matches every output in all six cases.' },
    { status: 'Verified replay', detail: 'The unchanged bug, an over-fix and a wrong-module control all fail. Grading checks exit status and complete traces.' },
    { status: 'Reviewed · follow-up', detail: 'FIFO depth now matches the documented odd-depth requirement and public wrapper. The broad diagnosis prompt and raw register stimulus still warrant further review.' },
    { status: 'Six cases checked', detail: 'Random and backpressure benches run 4,000 and 12,000 cycles per seed. These checks establish observed coverage, not exhaustive correctness.' },
    { status: 'Local replay verified', detail: 'Candidate builds and runtime cannot access private reference assets. Namespace probes and trace-parser tests pass. Container-runner integration remains pending.' },
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
    <ul className="qa-categories" aria-label="QA categories and evidence status">
      {categories.map((category, i) => <li key={category.title}>
        <div className="qa-category">
          <div className="qa-category-heading">
            <span className="qa-icon" aria-hidden="true">{category.icon}</span>
            <span className="qa-title">{category.title}</span>
            <span className="qa-status">{items[i].status}</span>
          </div>
        </div>
      </li>)}
    </ul>
  </div>;
}
