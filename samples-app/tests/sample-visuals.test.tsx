import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PassRate, parsePassRate } from '../components/PassRate';
import { SampleDiagrams } from '../components/SampleDiagrams';
describe('sample visuals', () => {
  it('shows the rate without the network label and preserves the denominator', () => {
    const parsed = parsePassRate('Implement credit flow. Opus 5 · Closed network · 22% (2/9).');
    expect(parsed.description).toBe('Implement credit flow.');
    expect(parsed.rate).toEqual({ passed: 2, total: 9 });
    const html = renderToStaticMarkup(<PassRate {...parsed.rate!} />);
    expect(html).toContain('2 of 9 attempts passed');
    expect(html).toContain('Calibrated Sample');
    expect(html).toContain('Task pass rate');
    expect(html.match(/class="trial-pass"/g)).toHaveLength(2);
    expect(html.match(/class="trial-fail"/g)).toHaveLength(7);
    expect(html).toContain('22 percent task pass rate');
    expect(html).not.toContain('role="meter"');
    expect(html).not.toContain('Closed network');
  });
  it('preserves descriptions without a rate', () => {
    expect(parsePassRate('Preview.')).toEqual({description:'Preview.',rate:undefined});
  });
  it.each(['sv-testbench-apb-registers','rtl-design-credit-flow','rtl-debug-accumulator'])('renders accessible grading and QA diagrams for %s', slug => {
    const html = renderToStaticMarkup(<SampleDiagrams slug={slug} />);
    expect(html.match(/<svg /g)).toHaveLength(2);
    expect(html.match(/<desc /g)).toHaveLength(2);
    expect(html).toContain('marker-end=');
    expect(html).toContain('QA checks');
  });
});
