import { FlowSteps as Flow } from './FlowSteps';
import React from 'react';
import { QACategories } from './QACategories';
export function PPAFlowDiagrams() {
  return <section className="sample-diagrams" aria-label="Grading and quality assurance">
    <figure className="sample-diagram">
      <figcaption>Grading</figcaption>
      <Flow label="PPA grading sequence" steps={[
        ['Submitted RTL', 'Optimized design'],
        ['Equivalence', 'Preserve behavior'],
        ['Physical design', 'Synthesis and routing'],
        ['Constraints', 'Timing, routing and area'],
        ['Continuous reward', 'Measured PPA improvement'],
      ]}/>
    </figure>
    <figure className="sample-diagram">
      <figcaption>QA checks</figcaption>
      <QACategories slug="ppa-priority-selector"/>
      <div className="ppa-qa-flows">
        <Flow label="Reference and control qualification" steps={[
          ['Reference + controls', 'Known valid and invalid designs'],
          ['Private grading', 'Frozen qualification checks'],
          ['Expected outcomes', 'Validate reward behavior'],
        ]}/>
        <Flow label="Recorded submission qualification" steps={[
          ['Submitted designs', 'Candidate implementations'],
          ['Evidence checks', 'Hashes, equivalence and physical gates'],
          ['Validated metrics', 'Area, timing, power or energy'],
        ]}/>
      </div>
    </figure>
  </section>;
}
