/* One deterministic session drives the editor, test transcript, and gate signals. */
(() => {
  'use strict';

  const clamp = value => Math.max(0, Math.min(1, value));
  const duration = 40;
  const vectors = [[3, 5, 0], [9, 7, 0], [10, 6, 1], [13, 11, 2], [9, 6, 3]];
  const operations = ['ADD', 'XOR', 'AND', 'OR'];
  const phases = [
    { id: 'rtl', label: 'Writing RTL', start: 0, end: 6.6, file: 'rtl/alu4.sv' },
    { id: 'build', label: 'Connecting logic', start: 6.6, end: 14.5, file: 'elaborate.log' },
    { id: 'check', label: 'Checking design', start: 14.5, end: 18, file: 'lint.log' },
    { id: 'test', label: 'Running testbench', start: 18, end: 25.6, file: 'tb/alu4_tb.sv' },
    { id: 'done', label: 'All checks passed', start: 25.6, end: 28, file: 'testbench.log' },
  ];

  function evaluate(a, b, operation) {
    const bits = [];
    let carry = 0, result = 0;
    for (let bit = 0; bit < 4; bit++) {
      const ai = (a >> bit) & 1, bi = (b >> bit) & 1;
      const p = ai ^ bi, g = ai & bi, h = p & carry;
      const sum = p ^ carry, or = p | g;
      const output = [sum, p, g, or][operation];
      bits.push({ a: ai, b: bi, p, g, h, sum, or, cin: carry, cout: g | h, output });
      result |= output << bit;
      carry = g | h;
    }
    return { a, b, operation, bits, result, carry };
  }

  // A tiny exhaustive check of the illustrated gate model, against independent
  // arithmetic/bitwise operators. The transcript is a staged demo, not a shell.
  let passed = 0;
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
    for (let op = 0; op < 4; op++) {
      const actual = evaluate(a, b, op);
      const expected = [(a + b) & 15, a ^ b, a & b, a | b][op];
      if (actual.result === expected && actual.carry === ((a + b) >> 4)) passed++;
    }
  }
  const verification = Object.freeze({ passed, total: 1024 });
  const examples = vectors.map(vector => evaluate(...vector));
  const vectorPeriod = 1.48;
  const captureAt = 0.84 * 1.03;

  function frame(elapsed, reduced = false) {
    const time = reduced ? 26 : ((elapsed % duration) + duration) % duration * 28 / duration;
    const phaseIndex = phases.findIndex(phase => time < phase.end);
    const phase = phases[phaseIndex];
    const vectorClock = Math.max(0, time - 18);
    const vectorIndex = Math.min(examples.length - 1, Math.floor(vectorClock / vectorPeriod));
    const travel = reduced || vectorClock >= examples.length * vectorPeriod
      ? 1 : clamp((vectorClock % vectorPeriod) / 1.03);
    const example = examples[vectorIndex];
    const latched = travel >= 0.84 ? example : vectorIndex
      ? examples[vectorIndex - 1] : evaluate(0, 0, 0);
    const completed = time < 18 ? 0 : Math.min(examples.length,
      Math.max(0, Math.floor((vectorClock - captureAt) / vectorPeriod) + 1));
    return {
      time, phase, phaseIndex, reduced, example, latched, travel, vectorIndex, completed,
      progress: clamp((time - phase.start) / (phase.end - phase.start)),
      live: time >= 18,
    };
  }

  window.ArcverexSession = Object.freeze({ duration, phases, operations, examples, evaluate, frame, verification });
})();
