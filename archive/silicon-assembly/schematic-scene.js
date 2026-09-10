/* An original gate-level, four-bit ALU drawing. Shared playback lives in chip-scene.js. */
(() => {
  'use strict';

  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const mix = (a, b, t) => a + (b - a) * t;
  const VECTORS = [[3, 5, 0], [9, 7, 0], [10, 6, 1], [13, 11, 2], [9, 6, 3]];

  // The drawing and its signal colors use these same gate equations.
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

  function quadratic(points, control, end) {
    const start = points[points.length - 1];
    for (let i = 1; i <= 14; i++) {
      const t = i / 14, u = 1 - t;
      points.push([u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
        u * u * start[1] + 2 * u * t * control[1] + t * t * end[1]]);
    }
    return points;
  }

  function makePath(points) {
    const path = new Path2D();
    let length = 0;
    points.forEach((p, i) => {
      if (!i) path.moveTo(...p);
      else {
        path.lineTo(...p);
        length += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
      }
    });
    return { path, points, length };
  }

  function along(path, progress) {
    let remaining = path.length * clamp(progress);
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1], b = path.points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (remaining <= length) {
        const t = length ? remaining / length : 0;
        return [mix(a[0], b[0], t), mix(a[1], b[1], t)];
      }
      remaining -= length;
    }
    return path.points[path.points.length - 1];
  }

  class Schematic {
    constructor() {
      this.paths = [];
      this.gates = [];
      this.junctions = [];
      this.build();
    }

    line(points, start, { bit = -1, net = '', type = 'wire', stage = 0 } = {}) {
      const path = { ...makePath(points), start, bit, net, type, stage };
      path.duration = type === 'symbol' ? 0.95 : Math.min(2.2, 0.5 + path.length / 165);
      this.paths.push(path);
      return path;
    }

    dot(x, y, start, bit = -1, net = '') {
      this.junctions.push({ x, y, start, bit, net });
    }

    gate(type, x, y, bit, net, start, stage) {
      let outline;
      if (type === 'and') {
        outline = [[x + 5, y - 10], [x + 17, y - 10]];
        quadratic(outline, [x + 30, y - 10], [x + 30, y]);
        quadratic(outline, [x + 30, y + 10], [x + 17, y + 10]);
        outline.push([x + 5, y + 10], [x + 5, y - 10]);
      } else {
        outline = [[x + 2, y - 10]];
        quadratic(outline, [x + 21, y - 11], [x + 30, y]);
        quadratic(outline, [x + 21, y + 11], [x + 2, y + 10]);
        quadratic(outline, [x + 12, y], [x + 2, y - 10]);
        if (type === 'xor') {
          const arc = [[x - 2, y - 10]];
          quadratic(arc, [x + 8, y], [x - 2, y + 10]);
          this.line(arc, start + 0.2, { type: 'symbol', bit, net, stage });
        }
      }
      const path = this.line(outline, start, { type: 'symbol', bit, net, stage });
      [-5, 5].forEach(pin => this.line([[x - 5, y + pin], [x + 6, y + pin]], start + 0.2,
        { type: 'symbol', bit, stage }));
      this.gates.push({ path, x, y, bit, net, start, stage });
      return path;
    }

    build() {

      for (let bit = 0; bit < 4; bit++) {
        const y = 46 + bit * 96;
        const gateTime = 0.3 + bit * 1.05;
        const routeTime = 3.2 + bit * 1.65;
        const wire = (points, net, stage = 0, delay = 0) =>
          this.line(points, routeTime + stage * 0.36 + delay, { bit, net, stage });

        this.gate('xor', 60, y, bit, 'p', gateTime, 1);
        this.gate('and', 60, y + 34, bit, 'g', gateTime + 0.18, 1);
        this.gate('xor', 155, y, bit, 'sum', gateTime + 0.45, 3);
        this.gate('and', 155, y + 34, bit, 'h', gateTime + 0.63, 3);
        this.gate('or', 231, y + 34, bit, 'cout', gateTime + 0.85, 4);
        this.gate('or', 231, y - 20, bit, 'or', gateTime + 1.05, 2);

        // Four mux inputs select sum, propagate (XOR), generate (AND), or OR.
        const mux = [[300, y - 17], [324, y - 7], [324, y + 25],
          [300, y + 35], [300, y - 17]];
        this.line(mux, gateTime + 1.3, { type: 'symbol', bit, net: 'output', stage: 5 });

        this.line([[352, y - 7], [378, y - 7], [378, y + 26], [352, y + 26], [352, y - 7]],
          gateTime + 1.55, { type: 'symbol', bit, net: 'q', stage: 6 });
        this.line([[360, y + 26], [365, y + 20], [370, y + 26]],
          gateTime + 1.65, { type: 'symbol', bit, stage: 6 });

        wire([[17, y - 5], [55, y - 5]], 'a');
        wire([[17, y + 5], [55, y + 5]], 'b');
        wire([[31, y - 5], [31, y + 29], [55, y + 29]], 'a', 0, 0.18);
        wire([[42, y + 5], [42, y + 39], [55, y + 39]], 'b', 0, 0.24);
        this.dot(31, y - 5, routeTime + 0.5, bit, 'a');
        this.dot(42, y + 5, routeTime + 0.5, bit, 'b');

        wire([[90, y], [117, y], [117, y - 5], [150, y - 5]], 'p', 1);
        wire([[117, y], [117, y + 29], [150, y + 29]], 'p', 1, 0.15);
        this.dot(117, y, routeTime + 1, bit, 'p');
        wire([[90, y], [99, y], [99, y - 38], [284, y - 38], [284, y + 3], [300, y + 3]], 'p', 2);
        wire([[117, y], [117, y - 30], [214, y - 30], [214, y - 25], [226, y - 25]], 'p', 2, 0.15);
        wire([[90, y + 34], [105, y + 34], [105, y - 22], [221, y - 22], [221, y - 15], [226, y - 15]], 'g', 2);
        wire([[90, y + 34], [105, y + 34], [105, y + 48], [280, y + 48], [280, y + 15], [300, y + 15]], 'g', 2, 0.2);
        this.dot(105, y + 34, routeTime + 1.2, bit, 'g');

        wire([[185, y], [276, y], [276, y - 9], [300, y - 9]], 'sum', 3);
        wire([[185, y + 34], [204, y + 34], [204, y + 39], [226, y + 39]], 'h', 3);
        wire([[105, y + 48], [216, y + 48], [216, y + 29], [226, y + 29]], 'g', 3, 0.12);
        this.dot(216, y + 48, routeTime + 1.8, bit, 'g');
        wire([[261, y - 20], [290, y - 20], [290, y + 27], [300, y + 27]], 'or', 3);

        // Ripple carry: C(i+1) = Gi | (Pi & Ci), passed to the following slice.
        wire([[132, y + 5], [150, y + 5]], 'cin', 2);
        wire([[132, y + 5], [132, y + 39], [150, y + 39]], 'cin', 2, 0.16);
        this.dot(132, y + 5, routeTime + 1.5, bit, 'cin');
        if (!bit) {
          wire([[132, 0], [132, y + 5]], 'cin', 1);
        }
        if (bit < 3) {
          wire([[261, y + 34], [271, y + 34], [271, y + 59], [132, y + 59], [132, y + 101]], 'cout', 4);
        } else {
          wire([[261, y + 34], [271, y + 34], [271, y + 59], [318, y + 59]], 'cout', 4);
        }

        wire([[324, y + 9], [352, y + 9]], 'output', 5);
        wire([[378, y + 9], [404, y + 9]], 'q', 6);
        this.line([[294, y + 40], [312, y + 40], [312, y + 30]],
          7 + bit * 0.7, { type: 'control' });
        this.dot(294, y + 40, 8 + bit * 0.7);
        this.line([[342, y + 33], [365, y + 33], [365, y + 26]],
          8 + bit * 0.7, { type: 'clock' });
        this.dot(342, y + 33, 9 + bit * 0.7);
      }

      this.line([[294, 0], [294, 374]], 6.2, { type: 'control' });
      this.line([[342, 0], [342, 367]], 7.2, { type: 'clock' });
    }

    draw(context, scene, time, palette, reduced, mobile) {
      const scale = scene.scale * (mobile ? 0.98 : 0.86);
      const c = context;
      const dark = palette.dark;
      const wireColor = dark ? '#759b8a' : '#79968b';
      const symbolColor = dark ? '#a4c5b4' : '#406b5b';
      const accent = dark ? '#dfbb82' : '#a27a40';
      const signal = dark ? '#c0f9d6' : '#237950';
      const fade = 1 - smooth((time - 25.6) / 2.1);
      const live = time >= 18 && time < 25.6;
      const vectorClock = Math.max(0, time - 18);
      const vectorIndex = Math.floor(vectorClock / 1.48) % VECTORS.length;
      const example = evaluate(...VECTORS[reduced ? 0 : vectorIndex]);
      const travel = reduced ? 1 : clamp((vectorClock % 1.48) / 1.03);
      // D flip-flops hold the previous result until the illustrated clock edge.
      const latched = travel >= 0.84 ? example : vectorIndex
        ? evaluate(...VECTORS[vectorIndex - 1]) : evaluate(0, 0, 0);

      c.save();
      c.translate(scene.cx - 213 * scale, scene.cy - 199 * scale);
      c.scale(scale, scale);
      c.lineCap = 'round';
      c.lineJoin = 'round';

      // A quiet registration frame remains when a new drawing starts.
      c.strokeStyle = wireColor; c.lineWidth = 0.5; c.globalAlpha = 0.23;
      [[-12, -29], [438, -29], [-12, 405], [438, 405]].forEach(([x, y]) => {
        c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y);
        c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke();
      });

      // Ghosted construction lines make every partial frame intentional.
      c.globalAlpha = dark ? 0.055 : 0.07;
      c.lineWidth = 0.65;
      for (const path of this.paths) c.stroke(path.path);

      for (const path of this.paths) {
        const progress = reduced ? 1 : smooth((time - path.start) / path.duration);
        if (!progress) continue;
        const net = path.bit < 0 ? 0 : path.net === 'q'
          ? latched.bits[path.bit].output : example.bits[path.bit][path.net];
        const activated = live && travel > path.stage / 8;
        const copper = path.type === 'clock' || path.type === 'control' || path.net === 'cout' || path.net === 'cin';
        c.strokeStyle = copper ? accent : path.type === 'symbol' ? symbolColor : wireColor;
        c.lineWidth = path.type === 'symbol' ? 1.1 : copper ? 0.95 : 0.8;
        c.globalAlpha = fade * (path.type === 'symbol' ? 0.95 : 0.7);
        if (activated && net) {
          c.strokeStyle = copper ? accent : signal;
          c.globalAlpha = fade;
          c.lineWidth += 0.15;
        }
        if (live && path.type === 'clock' && travel >= 0.82 && travel <= 0.96) {
          c.strokeStyle = dark ? '#f5d3a0' : '#987036';
          c.globalAlpha = fade;
          c.lineWidth = 1.7;
        }
        if (progress < 1) c.setLineDash([path.length * progress, path.length + 1]);
        c.stroke(path.path);
        c.setLineDash([]);

        if (progress < 1 && path.type !== 'symbol') {
          const point = along(path, progress);
          c.globalAlpha = fade * 0.9;
          c.fillStyle = copper ? accent : signal;
          c.beginPath(); c.arc(...point, 1.5, 0, Math.PI * 2); c.fill();
        } else if (live && path.type === 'wire' && net && travel > path.stage / 8 && travel < (path.stage + 2) / 8) {
          const point = along(path, (travel - path.stage / 8) * 4);
          c.globalAlpha = fade;
          c.fillStyle = signal;
          c.beginPath(); c.arc(...point, 1.5, 0, Math.PI * 2); c.fill();
        }
      }

      for (const dot of this.junctions) {
        const alpha = reduced ? 1 : smooth(time - dot.start);
        if (!alpha) continue;
        c.globalAlpha = alpha * fade * 0.85;
        c.fillStyle = dot.bit < 0 ? accent : wireColor;
        c.beginPath(); c.arc(dot.x, dot.y, 1.6, 0, Math.PI * 2); c.fill();
      }

      if (time > 14.5 && time < 18 && !reduced) {
        const check = (time - 14.5) / 3.5;
        const y = check * 394;
        c.globalAlpha = Math.sin(check * Math.PI) * 0.45;
        c.strokeStyle = signal; c.lineWidth = 0.65;
        c.setLineDash([2, 4]);
        c.beginPath(); c.moveTo(-6, y); c.lineTo(430, y); c.stroke(); c.setLineDash([]);
      }

      if (live || reduced) {
        for (let bit = 0; bit < 4; bit++) {
          const y = 46 + bit * 96;
          c.globalAlpha = fade * 0.75;
          c.strokeStyle = accent; c.lineWidth = 1;
          c.beginPath(); c.moveTo(300, y - 9 + example.operation * 12);
          c.lineTo(324, y + 9); c.stroke();
        }
      }
      c.restore();
    }
  }

  window.ArcverexSchematic = Object.freeze({ create: () => new Schematic(), evaluate });
})();
