export const priorityResults = [
  {
    "run": 3,
    "label": "Modest improvement",
    "reward": 0.07752968007121484,
    "delay_ns": 1.118598,
    "improvement_percent": 7.4600441935748,
    "area_um2": 431.9840000000003
  },
  {
    "run": 7,
    "label": "Moderate improvement",
    "reward": 0.2373548518360899,
    "delay_ns": 0.953373,
    "improvement_percent": 21.128863732065483,
    "area_um2": 510.4540000000014
  },
  {
    "run": 14,
    "label": "Strong improvement",
    "reward": 0.49082981430000006,
    "delay_ns": 0.7399120000000003,
    "improvement_percent": 38.788176109161896,
    "area_um2": 570.3040000000032
  }
];
export function priorityOutcome(run: number) {
  const r = priorityResults.find(row => row.run === run);
  return r ? `${r.label} · ${r.improvement_percent.toFixed(1)}% lower delay · reward ${r.reward.toFixed(3)}` : undefined;
}

export const priorityCalibration = [
  {
    "run": 1,
    "score": 0.12479981015991931
  },
  {
    "run": 2,
    "score": 0.40760012685729563
  },
  {
    "run": 3,
    "score": 0.07752968007121484
  },
  {
    "run": 4,
    "score": 0.33210066895730217
  },
  {
    "run": 5,
    "score": 0.2134477700113154
  },
  {
    "run": 7,
    "score": 0.2373548518360899
  },
  {
    "run": 11,
    "score": 0.14937501573848333
  },
  {
    "run": 12,
    "score": 0.3218340376198757
  },
  {
    "run": 13,
    "score": 0.43806330867779497
  },
  {
    "run": 14,
    "score": 0.49082981430000006
  }
];

export function priorityDisplayNumber(sourceRun: number) {
  const index = priorityCalibration.findIndex(r => r.run === sourceRun);
  return index < 0 ? undefined : index + 1;
}
