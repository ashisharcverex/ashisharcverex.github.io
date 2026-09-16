import React from 'react';
import { QACategories } from './QACategories';

type Box = { x: number; y: number; lines: string[]; tone?: 'accent' | 'muted' };
type Edge = [number, number];
type Diagram = { title: string; description: string; boxes: Box[]; edges: Edge[]; height: number };
const diagrams: Record<string, [Diagram, Diagram]> = {
  'sv-testbench-apb-registers': [
    { title: 'Grading', description: 'The testbench passes source checks, then must accept both correct designs and reject every faulty design.', height: 340,
      boxes: [{x:10,y:140,lines:['Submitted','testbench']},{x:220,y:140,lines:['Source','checks']},{x:430,y:20,lines:['Correct design','Must PASS'],tone:'accent'},{x:430,y:140,lines:['Hidden correct design','Must PASS'],tone:'accent'},{x:430,y:260,lines:['Every injected fault','Must FAIL'],tone:'accent'},{x:650,y:140,lines:['All checks met','Task passes'],tone:'accent'}], edges:[[0,1],[1,2],[1,3],[1,4],[2,5],[3,5],[4,5]] },
    { title: 'QA checks', description: 'The reference bench must pass the full suite, and correct implementations must agree in side-by-side simulation.', height: 220,
      boxes:[{x:10,y:20,lines:['Reference','testbench']},{x:280,y:20,lines:['Full grading','suite']},{x:560,y:20,lines:['Expected','PASS'],tone:'accent'},{x:10,y:140,lines:['Two correct','implementations']},{x:280,y:140,lines:['Side-by-side','simulation']},{x:560,y:140,lines:['Expected','Matching outputs'],tone:'accent'}],edges:[[0,1],[1,2],[3,4],[4,5]] },
  ],
  'rtl-design-credit-flow': [
    { title:'Grading', description:'Candidate RTL passes source and interface checks. Directed and seeded random tests compare every output against a hidden reference. All outputs must agree.',height:260,
      boxes:[{x:10,y:90,lines:['Submitted','RTL']},{x:220,y:90,lines:['Interface +','source checks']},{x:430,y:20,lines:['Directed','test cases']},{x:430,y:170,lines:['Seeded random','simulation']},{x:650,y:90,lines:['Reference comparison','Every cycle must match'],tone:'accent'}],edges:[[0,1],[1,2],[1,3],[2,4],[3,4]] },
    { title:'QA checks',description:'Reference implementations are compared, and deliberately faulty designs probe whether the grading tests detect errors.',height:220,
      boxes:[{x:10,y:20,lines:['Independent','references']},{x:280,y:20,lines:['Side-by-side','simulation']},{x:560,y:20,lines:['Expected','Agreement'],tone:'accent'},{x:10,y:140,lines:['Deliberately','faulty designs']},{x:280,y:140,lines:['Grading','tests']},{x:560,y:140,lines:['Expected','Faults detected'],tone:'accent'}],edges:[[0,1],[1,2],[3,4],[4,5]] },
  ],
  'rtl-debug-accumulator': [
    { title:'Grading',description:'The repair preserves the interface and passes source checks. Candidate and reference receive identical stimulus; every output must match, including through reset and idle periods.',height:260,
      boxes:[{x:10,y:20,lines:['Submitted','repair']},{x:220,y:20,lines:['Interface +','source checks']},{x:220,y:170,lines:['Hidden','reference']},{x:430,y:90,lines:['Same stimulus','Reset · activity · idle']},{x:650,y:90,lines:['Compare all outputs','Every cycle must match'],tone:'accent'}],edges:[[0,1],[1,3],[2,3],[3,4]] },
    { title:'QA checks',description:'Both the reference repair and a larger correct rewrite must pass. The unrepaired design must fail. Workspace checks look for answer leakage.',height:340,
      boxes:[{x:10,y:20,lines:['Reference','repair']},{x:280,y:20,lines:['Grading','suite']},{x:560,y:20,lines:['Expected','PASS'],tone:'accent'},{x:10,y:140,lines:['Larger correct','rewrite']},{x:280,y:140,lines:['Same grading','suite']},{x:560,y:140,lines:['Expected','PASS'],tone:'accent'},{x:10,y:260,lines:['Unrepaired','design']},{x:280,y:260,lines:['Same grading','suite']},{x:560,y:260,lines:['Expected','FAIL'],tone:'accent'}],edges:[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8]] },
  ],
};

export function SampleDiagrams({ slug }: { slug: string }) {
  const items = diagrams[slug];
  if (!items) return null;
  return <section className="sample-diagrams" aria-label="Grading and quality assurance">
    {items.map((diagram, index) => {
      const id = `${slug}-diagram-${index}`;
      return <figure className="sample-diagram" key={id}>
        <figcaption>{diagram.title}</figcaption>
        {index === 1 && <QACategories slug={slug} />}
        <div className="diagram-scroll" tabIndex={0} role="region" aria-label={`${diagram.title} diagram, scroll horizontally on small screens`}>
          <svg viewBox={`0 0 840 ${diagram.height}`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
            <title id={`${id}-title`}>{diagram.title}</title><desc id={`${id}-desc`}>{diagram.description}</desc>
            <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="var(--muted)" /></marker></defs>
            {diagram.edges.map(([from,to],i)=>{
              const a=diagram.boxes[from], b=diagram.boxes[to];
              const x1=a.x+180,y1=a.y+32,x2=b.x-8,y2=b.y+32,mid=(x1+x2)/2;
              return <path key={i} d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} fill="none" stroke="var(--muted)" strokeWidth="1.5" markerEnd={`url(#${id}-arrow)`} />;
            })}
            {diagram.boxes.map((box,i)=><g key={i}>
              <rect x={box.x} y={box.y} width="180" height="64" rx="6" fill="var(--card)" stroke={box.tone==='accent'?'var(--accent)':'var(--line)'} strokeWidth="1.5" />
              <text x={box.x+90} y={box.y+27} textAnchor="middle" fill={box.tone==='accent'?'var(--accent)':'var(--fg)'} fontSize="12.5">{box.lines.map((line,j)=><tspan key={j} x={box.x+90} dy={j===0?0:19}>{line}</tspan>)}</text>
            </g>)}
          </svg>
        </div>
        {index===1 && <p className="fine">QA methodology{slug==='rtl-debug-accumulator'?' · Also checks the workspace for answer leakage.':'.'}</p>}
      </figure>;
    })}
  </section>;
}
