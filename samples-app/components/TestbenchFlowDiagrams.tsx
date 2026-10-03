import React from 'react';
import { FlowSteps } from './FlowSteps';
import { QACategories } from './QACategories';
export function TestbenchFlowDiagrams() {
  return <section className="sample-diagrams" aria-label="Grading and quality assurance">
    <figure className="sample-diagram">
      <figcaption>Grading</figcaption>
      <FlowSteps label="Testbench grading sequence" steps={[
        ['Submitted testbench', 'Compile and validate'],
        ['Provided RTL design', 'Visible correct RTL · Must be accepted'],
        ['Hidden RTL variant', 'Private correct RTL · Must be accepted'],
        ['Hidden faulty variants', 'Every fault · Must be rejected'],
        ['Task reward', 'All required checks met'],
      ]}/>
    </figure>
    <figure className="sample-diagram">
      <figcaption>QA checks</figcaption>
      <QACategories slug="testbench-environment"/>
      <div className="ppa-qa-flows">
        <FlowSteps label="Reference testbench qualification" steps={[
          ['Reference testbench', 'Known complete checker'],
          ['Grading suite', 'Provided RTL design, hidden RTL variant and faulty variants'],
          ['Expected outcomes', 'Accept correct, reject faults'],
        ]}/>
        <FlowSteps label="Incomplete testbench qualification" steps={[
          ['Incomplete testbench', 'Plausible coverage gaps'],
          ['Fault coverage', 'Exercise distinguishing behavior'],
          ['Gaps detected', 'Incomplete checks must fail'],
        ]}/>
      </div>
    </figure>
  </section>;
}
