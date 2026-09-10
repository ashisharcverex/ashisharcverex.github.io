/* A decorative RTL editor and transcript. Every gesture uses the shared clock. */
(() => {
  'use strict';

  const session = window.ArcverexSession;
  const escape = text => String(text).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const binary = value => value.toString(2).padStart(4, '0');
  const code = [
    '// 4-bit ALU · registered output',
    'assign p = a ^ b;',
    'assign g = a & b;',
    "assign c[0] = 1'b0;",
    '',
    'for (genvar i = 0; i < 4; i++) begin',
    '  assign c[i+1] =',
    '    g[i] | (p[i] & c[i]);',
    'end',
    '',
    'always_comb begin',
    '  case (op)',
    "    2'b00: d = p ^ c[3:0];",
    "    2'b01: d = p;",
    "    2'b10: d = g;",
    "    2'b11: d = p | g;",
    '  endcase',
    'end',
    '',
    'always_ff @(posedge clk)',
    '  q <= d;',
  ].join('\n');

  // These are illustrative local build steps, not a connected command shell.
  const build = [
    [0, '$ make elaborate', 'command'],
    [0.10, 'read  rtl/alu4.sv', 'muted'],
    [0.19, 'bind  a[3:0], b[3:0], op[1:0]', 'normal'],
    [0.31, 'emit  4 × propagate / generate', 'normal'],
    [0.43, 'emit  sum + carry logic', 'normal'],
    [0.55, 'link  c[0] → c[4]', 'normal'],
    [0.67, 'map   ADD / XOR / AND / OR', 'normal'],
    [0.79, 'link  muxes → output registers', 'normal'],
    [0.89, 'OK    netlist connected', 'pass'],
  ];
  const checks = [
    [0, '$ make lint', 'command'],
    [0.18, 'scan  combinational paths', 'normal'],
    [0.37, 'check carry chain + clock net', 'normal'],
    [0.56, 'OK    no floating inputs', 'pass'],
    [0.72, 'OK    design checks complete', 'pass'],
    [0.88, '$ make test', 'command'],
  ];

  function highlight(text) {
    if (text.trimStart().startsWith('//')) return `<span class="term-comment">${escape(text)}</span>`;
    return text.split(/(\b(?:assign|for|genvar|begin|end|always_comb|always_ff|case|endcase|posedge)\b|\d+'b[01]*|\b\d+\b)/g)
      .map(token => /^(assign|for|genvar|begin|end|always_comb|always_ff|case|endcase|posedge)$/.test(token)
        ? `<span class="term-keyword">${token}</span>`
        : /^\d/.test(token) ? `<span class="term-number">${escape(token)}</span>` : escape(token)).join('');
  }

  function logRows(events, progress, seconds) {
    return events.filter(([at]) => progress >= at).map(([at, text, kind]) => ({
      text: text.slice(0, Math.floor((progress - at) * seconds * 48)), kind,
    }));
  }

  class Terminal {
    constructor(parent) {
      this.element = document.createElement('div');
      this.element.className = 'engineering-terminal';
      this.element.innerHTML = `
        <div class="terminal-header">
          <span class="terminal-window-marks"><i></i><i></i><i></i></span>
          <svg class="terminal-robot" viewBox="0 0 60 60" fill="none" aria-hidden="true">
            <path class="robot-frame" d="M30 11V6M8 27H5v12h3m44-12h3v12h-3"/>
            <circle class="robot-antenna" cx="30" cy="5" r="2"/>
            <rect class="robot-case" x="9" y="12" width="42" height="39" rx="11"/>
            <path class="robot-frame" d="M19 51v4m22-4v4M18 17h8"/>
            <rect class="robot-screen" x="14" y="20" width="32" height="25" rx="6"/>
            <g class="robot-eyes"><rect x="20" y="26" width="5" height="6" rx="1.5"/><rect x="35" y="26" width="5" height="6" rx="1.5"/></g>
            <path class="robot-mouth" d="M26 37h8"/>
          </svg>
        </div>
        <div class="terminal-tab"><span class="terminal-file-icon">&lt;/&gt;</span><span class="terminal-file"></span><span class="terminal-file-state"></span></div>
        <div class="terminal-viewport"><div class="terminal-lines"></div></div>
        <div class="terminal-footer">
          <div class="terminal-status"><span class="terminal-status-light"></span><span class="terminal-status-text"></span><span class="terminal-progress-text"></span></div>
          <div class="terminal-stages">${['RTL', 'BUILD', 'CHECK', 'TEST'].map(name => `<span><i></i>${name}</span>`).join('')}</div>
        </div>`;
      parent.append(this.element);
      this.lines = this.element.querySelector('.terminal-lines');
      this.viewport = this.element.querySelector('.terminal-viewport');
      this.file = this.element.querySelector('.terminal-file');
      this.fileState = this.element.querySelector('.terminal-file-state');
      this.status = this.element.querySelector('.terminal-status-text');
      this.progress = this.element.querySelector('.terminal-progress-text');
      this.stages = [...this.element.querySelectorAll('.terminal-stages > span')];
      this.eyes = this.element.querySelector('.robot-eyes');
      this.eyeRects = [...this.eyes.children];
      this.mouth = this.element.querySelector('.robot-mouth');
      this.antenna = this.element.querySelector('.robot-antenna');
      this.previousContent = '';
      this.previousPhase = '';
      this.previousStep = -1;
      this.previousCompleted = -1;
    }

    layout({ x, y, width, height, visible }) {
      this.element.hidden = !visible;
      Object.assign(this.element.style, {
        left: `${Math.round(x)}px`, top: `${Math.round(y)}px`,
        width: `${Math.round(width)}px`, height: `${Math.round(height)}px`,
      });
    }

    content(state) {
      const { phase, progress, completed } = state;
      if (phase.id === 'rtl') {
        const typed = code.slice(0, Math.floor(Math.min(1, progress / 0.89) * code.length));
        return typed.split('\n').map((line, index, lines) =>
          `<div class="terminal-line terminal-code"><span class="terminal-line-number">${index + 8}</span><span>${highlight(line)}${index === lines.length - 1 ? '<i class="terminal-cursor"></i>' : ''}</span></div>`).join('');
      }
      let rows;
      if (phase.id === 'build' || phase.id === 'check') {
        const events = phase.id === 'build' ? build : checks;
        rows = logRows(events, progress, (phase.end - phase.start) * session.duration / 28);
      } else {
        rows = [
          { text: '$ make test', kind: 'command' },
          { text: 'run   tb/alu4_tb.sv', kind: 'muted' },
          { text: '@(posedge clk) → compare q', kind: 'muted' },
          { text: '', kind: 'normal' },
        ];
        session.examples.slice(0, completed).forEach(example => {
          rows.push({ text: `PASS  ${session.operations[example.operation].padEnd(3)}  a=${binary(example.a)}  b=${binary(example.b)}`, kind: 'pass' });
          rows.push({ text: `      q=${binary(example.result)}${example.operation === 0 ? `  carry=${example.carry}` : ''}`, kind: 'muted' });
        });
        if (phase.id === 'done') {
          const { passed, total } = session.verification;
          rows.push({ text: '', kind: 'normal' },
            { text: `${passed === total ? 'PASS' : 'FAIL'}  ${passed} / ${total} combinations`, kind: passed === total ? 'pass' : 'error' },
            { text: `${total - passed} mismatches · session complete`, kind: 'muted' });
        } else {
          rows.push({ text: completed < session.examples.length ? 'wait  next clock edge' : 'check all input combinations…', kind: 'muted' });
        }
      }
      return rows.map(({ text, kind }, index) =>
        `<div class="terminal-line terminal-log term-${kind}"><span>${escape(text)}${index === rows.length - 1 && phase.id !== 'done' ? '<i class="terminal-cursor"></i>' : ''}</span></div>`).join('');
    }

    draw(state) {
      if (this.element.hidden) return;
      // Text and robot gestures need only 24 updates/sec; the circuit stays smooth.
      const step = Math.floor(state.time * session.duration / 28 * 24);
      if (step === this.previousStep && this.previousPhase === state.phase.id &&
        this.previousCompleted === state.completed) return;
      this.previousStep = step;
      this.previousCompleted = state.completed;
      const { phase, phaseIndex, time, progress, reduced } = state;
      if (this.previousPhase !== phase.id) {
        this.previousPhase = phase.id;
        this.element.dataset.phase = phase.id;
        this.file.textContent = phase.file;
        this.fileState.textContent = phase.id === 'rtl' ? 'editing' : phase.id === 'done' ? 'complete' : 'running';
        this.status.textContent = phase.label;
      }
      const content = this.content(state);
      if (content !== this.previousContent) {
        this.previousContent = content;
        this.lines.innerHTML = content;
        this.viewport.scrollTop = this.viewport.scrollHeight;
      }
      this.progress.textContent = phase.id === 'done' ? '✓' : `${Math.floor(progress * 100).toString().padStart(2, '0')}%`;
      this.stages.forEach((stage, index) => {
        stage.dataset.state = index < phaseIndex ? 'complete' : index === phaseIndex ? 'active' : 'pending';
        stage.style.setProperty('--stage-progress', index < phaseIndex ? 1 : index === phaseIndex ? progress : 0);
      });

      const blink = !reduced && time % 3.6 > 3.44;
      const happy = phase.id === 'done';
      const eyeHeight = blink ? 1 : happy ? 3 : 6;
      this.eyeRects.forEach(eye => { eye.setAttribute('height', eyeHeight); eye.setAttribute('y', 29 - eyeHeight / 2); });
      const glance = reduced || happy ? 0 : phase.id === 'rtl' ? Math.sin(time * 2.4) * 1.3 : Math.sin(time * 1.2) * 0.8;
      this.eyes.setAttribute('transform', `translate(${glance.toFixed(2)} ${phase.id === 'rtl' ? 1 : 0})`);
      this.mouth.setAttribute('d', happy ? 'M25 36q5 6 10 0' : phase.id === 'check' ? 'M27 37h6' : 'M26 37h8');
      this.antenna.setAttribute('opacity', reduced || happy ? '1' : (0.55 + Math.sin(time * 5) * 0.25).toFixed(2));
      this.element.style.setProperty('--cursor-opacity', reduced ? 0 : time % 0.7 < 0.43 ? 1 : 0);
    }
  }

  window.ArcverexTerminal = Object.freeze({ create: parent => new Terminal(parent) });
})();
