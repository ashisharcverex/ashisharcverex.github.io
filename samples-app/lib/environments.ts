export const environments: Record<string, { title: string; description: string; input: string; output: string }> = {
  'SV testbench': {
    title: 'Testbench Generation',
    description: 'Build self-checking testbenches that distinguish correct RTL from faulty implementations.',
    input: 'Specification + RTL',
    output: 'Self-checking testbench',
  },
  'RTL design': {
    title: 'RTL Design',
    description: 'Turn behavioral specifications into synthesizable RTL, verified cycle by cycle.',
    input: 'Behavioral specification',
    output: 'Synthesizable RTL',
  },
  'RTL debug': {
    title: 'RTL Debug',
    description: 'Diagnose and repair faulty RTL while preserving its interface and required behavior.',
    input: 'Specification + faulty RTL',
    output: 'Repaired RTL',
  },
};
