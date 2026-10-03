import React from 'react';
import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PPAResults } from '../components/PPAResults';
import { Transcripts } from '../components/Transcripts';
import { SampleDiagrams } from '../components/SampleDiagrams';
import { priorityOutcome } from '../lib/ppa-sample';
it('shows continuous outcomes without pass-rate or pass/fail transcript labels', () => {
  const html = renderToStaticMarkup(<><PPAResults slug="ppa-priority-selector"/><Transcripts slug="ppa-priority-selector" entries={[3,7,14].map(n => ({rollout_number:n,passed:true,outcome_title:priorityOutcome(n)}))}/></>);
  for (const text of ['Modest improvement','Strong improvement','38.8%','0.491']) expect(html).toContain(text);
  expect(html).not.toContain('Passed'); expect(html).not.toContain('Pass rates');
  expect(renderToStaticMarkup(<PPAResults slug="other"/>)).toBe('');
});
it('has grading and QA diagrams', () => {
  const html = renderToStaticMarkup(<SampleDiagrams slug="ppa-priority-selector"/>);
  expect(html.match(/<ol /g)).toHaveLength(3);
  expect(html).not.toContain('diagram-scroll');
  expect(html).toContain('PPA grading sequence');
  expect(html).toContain('Continuous');
});

import { ScoreCalibration } from '../components/ScoreCalibration';
it('shows calibrated continuous rewards with ten color cells and a numeric mean', () => {
  const html = renderToStaticMarkup(<ScoreCalibration slug="ppa-priority-selector"/>);
  expect(html).toContain('Calibrated Sample');
  expect(html).toContain('0.279');
  expect(html.match(/role="listitem"/g)).toHaveLength(10);
  expect(html).toContain('color-mix');
  expect(html).toContain('Rollout 10:');
  expect(html).not.toContain('Rollout 14:');
  expect(html).not.toContain('Darker to brighter');
  expect(html).not.toContain('10 scored attempts');
  expect(html).not.toContain('4 infrastructure failures excluded');
  expect(html).not.toContain('✓'); expect(html).not.toContain('×');
  expect(html).not.toContain('Task pass rate');
  expect(renderToStaticMarkup(<ScoreCalibration slug="other"/>)).toBe('');
});
