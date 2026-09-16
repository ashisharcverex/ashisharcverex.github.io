export const sampleMethodology: Record<string, { grading: string; qa: string }> = {
  'sv-testbench-apb-registers': {
    grading: 'The submitted testbench must accept both correct implementations and reject every injected faulty implementation. Compilation failures, incorrect verdicts, and timeouts fail the task.',
    qa: 'The reference testbench is checked against the full grading suite. The two correct implementations are also simulated side by side to check that their observable behavior agrees.',
  },
  'rtl-design-credit-flow': {
    grading: 'The submitted RTL is checked for interface and source restrictions, then tested with directed cases and seeded random simulation. Every output must match the hidden reference cycle by cycle.',
    qa: 'The design QA method checks reference agreement using independently written implementations and uses deliberately faulty designs to probe gaps in the grading tests.',
  },
  'rtl-debug-accumulator': {
    grading: 'The repair must preserve the module interface and match the reference in cycle-by-cycle simulation, including resets and idle periods. The verdict depends on behavior, not the number of edited lines.',
    qa: 'Controls check that the reference repair and a larger correct rewrite pass, while the unrepaired design fails. Additional checks inspect the supplied workspace for answer leakage.',
  },
};

export function splitSampleBody(body: string) {
  const match = /\n={60}\nProvided RTL: ([^\n]+)\n={60}\n\n/.exec(body);
  return match
    ? { prompt: body.slice(0, match.index).trim(), rtlPath: match[1], rtl: body.slice(match.index + match[0].length) }
    : { prompt: body.trim(), rtlPath: undefined, rtl: undefined };
}
