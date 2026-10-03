import React from 'react';
import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePassRate, PassRate } from '../components/PassRate';
it('labels rational evaluator as Opus 5.5 without changing legacy model labels', () => {
  const parsed = parsePassRate('Rational evaluator. Opus 5.5 · 20% (2/10).');
  expect(parsed).toEqual({description:'Rational evaluator.',rate:{passed:2,total:10,model:'Opus 5.5'}});
  const html = renderToStaticMarkup(<PassRate {...parsed.rate!} />);
  expect(html).toContain('Opus 5.5 calibration: 20 percent');
  expect(parsePassRate('Legacy. Opus 5 · 10% (1/10).').rate).toEqual({passed:1,total:10});
});
