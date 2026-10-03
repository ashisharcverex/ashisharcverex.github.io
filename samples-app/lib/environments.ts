export const environments: Record<string, { title: string; description: string; input: string; output: string }> = {
  'PPA': {
    title: 'ASIC PPA Optimization',
    description: 'Optimize RTL for area, timing, power or energy while preserving behavior. Private physical evaluation assigns continuous rewards.',
    input: 'RTL + optimization goal + local EDA tools',
    output: 'Functionally equivalent optimized RTL',
  },
  'Post-silicon': {
    title: 'Post-Silicon Validation',
    description: 'Build and validate firmware against behavioral board models with faults, concurrent traffic and recovery constraints.',
    input: 'Board manuals + driver API + development lab',
    output: 'Firmware + investigation + readiness report',
  },
  'SV testbench': {
    title: 'Testbench Generation',
    description: 'Build self-checking testbenches that distinguish correct RTL from faulty implementations that inject bugs for each behavior.',
    input: 'Specification + RTL + Sim Tool',
    output: 'Self-checking testbench',
  },
  'RTL design': {
    title: 'RTL Design',
    description: 'Turn behavioral specifications into synthesizable RTL, verified cycle by cycle.',
    input: 'Behavioral specification + Sim Tool',
    output: 'Synthesizable RTL',
  },
  'RTL debug': {
    title: 'RTL Debug',
    description: 'Diagnose and repair faulty RTL while preserving its interface and required behavior.',
    input: 'RTL tree + documentation + Sim Tool',
    output: 'Repaired RTL',
  },
};

export const environmentsInDevelopment = [
  'Post-Silicon Validation',
  'Debug',
  'RTL Design',
  'Virtual Bring-Up',
  'Multi-Clock Appliance',
  'Hardware Toolchains',
] as const;
