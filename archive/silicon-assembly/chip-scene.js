/*
 * Silicon workbench — an original, dependency-free Canvas 2D scene.
 * A deterministic timeline stages placement, routing, verification and activity.
 * A gate-level schematic is drawn on the left; the silicon assembly stays on the right.
 * Package geometry and transistor sprites are cached; both scenes share one clock.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('chip-scene');
  const themeButton = document.querySelector('.theme-toggle');
  const motionButton = document.querySelector('.motion-toggle');
  const mobileSpace = document.querySelector('.mobile-scene-space');
  const sceneViews = document.querySelector('.scene-views');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const root = document.documentElement;

  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark' : systemTheme.matches;

  function updateThemeButton() {
    themeButton.classList.toggle('is-dark', isDark());
    themeButton.setAttribute('aria-label', `Switch to ${isDark() ? 'light' : 'dark'} theme`);
  }

  themeButton.addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    root.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (_) { /* Storage is optional. */ }
  });
  updateThemeButton();

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const schematic = window.ArcverexSchematic.create();
  sceneViews.hidden = false;

  const ISO = Math.sqrt(3) / 2;
  const TAU = Math.PI * 2;
  const CYCLE = 28;
  const COUNT = 36;
  const LAND_TIME = 1.65;
  const CELL_GAP = 0.265;
  const TOP = 29;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);

  const PALETTES = {
    light: {
      dark: false,
      ink: '#425d56', muted: '#778b83', guide: '#819d8e',
      top: '#293f42', topEnd: '#1a3035', left: '#1b2c31', right: '#102125',
      edge: '#688780', rim: '#354f50', lower: '#91a89b',
      die: '#183032', dieEnd: '#122628', dieEdge: '#759f90',
      etch: '#335b53', trace: '#65998a', signal: '#a2f5cf',
      copper: '#e0b580', copperSide: '#8b6545', copperDark: '#574839',
      metal: '#b7cec0', metalSide: '#5e897e', well: '#366255',
      gate: '#edc48c', gateSide: '#977342', glow: '#88d9b2',
      shadow: 'rgba(27, 57, 44, .23)', shadowClear: 'rgba(27, 57, 44, 0)',
    },
    dark: {
      dark: true,
      ink: '#abc1b3', muted: '#718d7f', guide: '#5a8170',
      top: '#263d3c', topEnd: '#152b2e', left: '#182a2c', right: '#0e1c20',
      edge: '#607f72', rim: '#324d48', lower: '#526e61',
      die: '#142b2b', dieEnd: '#0b1e20', dieEdge: '#577e6b',
      etch: '#27483e', trace: '#56816c', signal: '#b2f9d5',
      copper: '#dab88a', copperSide: '#886c47', copperDark: '#564b37',
      metal: '#b1cdbb', metalSide: '#567a6b', well: '#355d49',
      gate: '#f2d49c', gateSide: '#a88750', glow: '#8edbab',
      shadow: 'rgba(0, 0, 0, .55)', shadowClear: 'rgba(0, 0, 0, 0)',
    },
  };

  let palette = PALETTES[isDark() ? 'dark' : 'light'];
  let width = 0, height = 0, dpr = 1, scenes = [], mobile = false;
  let schematicScene = null, mobileView = 'silicon';
  let frame = 0, lastTime = 0, elapsed = 3.8, userPaused = false;
  let mobileVisible = true, resizeQueued = false, sceneDirty = true;
  let pointer = { x: 0, y: 0 }, camera = { x: 0, y: 0 };

  // Seeded variation keeps the composition stable across resizing and themes.
  function random(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  class Painter {
    constructor(context, scale, ox = 0, oy = 0) {
      this.ctx = context;
      this.scale = scale;
      this.ox = ox;
      this.oy = oy;
    }

    p(x, y, z = 0) {
      return [this.ox + (x - y) * ISO * this.scale,
        this.oy + ((x + y) * 0.5 - z) * this.scale];
    }

    path(points, close = false) {
      const c = this.ctx;
      c.beginPath();
      points.forEach((p, i) => {
        const at = this.p(...p);
        if (i === 0) c.moveTo(...at); else c.lineTo(...at);
      });
      if (close) c.closePath();
    }

    line(points, color, weight = 0.6, alpha = 1) {
      const c = this.ctx;
      c.save();
      c.globalAlpha *= alpha;
      this.path(points);
      c.strokeStyle = color;
      c.lineWidth = weight * this.scale;
      c.lineJoin = 'round';
      c.stroke();
      c.restore();
    }

    plane(x, y, w, d, z, fill, stroke, weight = 0.65) {
      const c = this.ctx;
      this.path([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], true);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight * this.scale; c.stroke(); }
    }

    box(x, y, w, d, z, h, top, left, right, edge) {
      const c = this.ctx;
      this.path([[x, y + d, z], [x + w, y + d, z],
        [x + w, y + d, z + h], [x, y + d, z + h]], true);
      c.fillStyle = left; c.fill();
      this.path([[x + w, y, z], [x + w, y + d, z],
        [x + w, y + d, z + h], [x + w, y, z + h]], true);
      c.fillStyle = right; c.fill();
      this.plane(x, y, w, d, z + h, top, edge);
    }

    dot(x, y, z, radius, color) {
      const c = this.ctx;
      c.beginPath();
      c.ellipse(...this.p(x, y, z), radius * this.scale,
        radius * this.scale * 0.58, 0, 0, TAU);
      c.fillStyle = color;
      c.fill();
    }
  }

  function surface(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr);
    c.height = Math.ceil(h * dpr);
    const context = c.getContext('2d');
    context.scale(dpr, dpr);
    return { canvas: c, ctx: context, width: w, height: h };
  }

  function makeCells(seed) {
    const rng = random(seed);
    const cells = Array.from({ length: COUNT }, (_, i) => ({
      col: i % 6, row: Math.floor(i / 6),
      x: (i % 6 - 2.5) * 22, y: (Math.floor(i / 6) - 2.5) * 22,
      variation: rng(), startX: (rng() - 0.5) * 94,
      startY: (rng() - 0.5) * 60, lift: 90 + rng() * 45,
      rank: i,
    }));
    const order = [...cells].sort((a, b) =>
      (a.col + a.row + a.variation * 4) - (b.col + b.row + b.variation * 4));
    order.forEach((cell, rank) => { cell.rank = rank; });
    return cells;
  }

  function makeRoutes(cells) {
    const routes = [];
    cells.forEach(cell => {
      if (cell.col < 5) {
        const neighbor = cells[cell.row * 6 + cell.col + 1];
        routes.push({
          points: [[cell.x + 7, cell.y, TOP + 1], [cell.x + 10, cell.y, TOP + 1],
            [cell.x + 12, cell.y + 3, TOP + 1], [neighbor.x - 8, cell.y + 3, TOP + 1]],
          start: 10.6 + Math.max(cell.rank, neighbor.rank) * 0.09,
          copper: cell.row % 2 === 0,
        });
      }
      if (cell.row < 5 && cell.col % 2 === 0) {
        const neighbor = cells[(cell.row + 1) * 6 + cell.col];
        routes.push({
          points: [[cell.x, cell.y + 8, TOP + 1], [cell.x, neighbor.y - 8, TOP + 1]],
          start: 11.2 + Math.max(cell.rank, neighbor.rank) * 0.07,
          copper: false,
        });
      }
    });
    // Two clock rails frame the placed cells, with chamfered branch connections.
    [-1, 1].forEach((side, i) => {
      routes.push({
        points: [[side * 70, -65, TOP + 1], [side * 70, 59, TOP + 1],
          [side * 64, 65, TOP + 1], [-side * 64, 65, TOP + 1]],
        start: 13.3 + i * 0.7, copper: i === 1,
      });
    });
    return routes;
  }

  function drawSurround(p, side) {
    const c = p.ctx, col = palette, rng = random(side + 22);
    // Faint registration grid and routed lanes form a technical drawing beneath the object.
    for (let i = -3; i <= 3; i++) {
      p.line([[-159, i * 44, -31], [159, i * 44, -31]], col.guide, 0.5, 0.1);
      p.line([[i * 44, -159, -31], [i * 44, 159, -31]], col.guide, 0.5, 0.1);
    }
    c.save();
    c.setLineDash([2 * p.scale, 5 * p.scale]);
    p.plane(-144, -144, 288, 288, -31, null, col.guide, 0.65);
    c.restore();

    for (let i = 0; i < 10; i++) {
      const along = -88 + i * 19;
      const reach = 137 + rng() * 33;
      const lane = along + (i % 2 ? 18 : -18);
      const z = -24;
      p.line([[108, along, z], [reach - 10, along, z],
        [reach, lane, z], [reach + 30, lane, z]], col.guide, 0.8, 0.24);
      p.line([[along, 108, z], [along, reach - 10, z],
        [lane, reach, z], [lane, reach + 30, z]], col.guide, 0.8, 0.24);
      p.dot(reach + 30, lane, z, 1.8, col.guide);
      p.dot(lane, reach + 30, z, 1.8, col.guide);
      if (i % 2 === 0) {
        p.line([[-108, along, z], [-reach + 8, along, z],
          [-reach, along - 12, z], [-reach, along - 40, z]], col.guide, 0.65, 0.22);
      }
    }

    [[-144, -144], [144, -144], [-144, 144], [144, 144]].forEach(([x, y]) => {
      p.line([[x - 5, y, -31], [x + 5, y, -31]], col.guide, 0.9, 0.6);
      p.line([[x, y - 5, -31], [x, y + 5, -31]], col.guide, 0.9, 0.6);
    });
  }

  function drawPackage(p, side) {
    const c = p.ctx, col = palette, s = p.scale;
    drawSurround(p, side);

    const shadowAt = p.p(0, 0, -30);
    const shadow = c.createRadialGradient(...shadowAt, 10, ...shadowAt, 205 * s);
    shadow.addColorStop(0, col.shadow);
    shadow.addColorStop(1, col.shadowClear);
    c.save();
    c.translate(...shadowAt);
    c.scale(1, 0.58);
    c.translate(-shadowAt[0], -shadowAt[1]);
    c.fillStyle = shadow;
    c.fillRect(shadowAt[0] - 210 * s, shadowAt[1] - 210 * s, 420 * s, 420 * s);
    c.restore();

    const top = c.createLinearGradient(...p.p(-108, -108, 0), ...p.p(108, 108, 0));
    top.addColorStop(0, col.top); top.addColorStop(1, col.topEnd);
    p.box(-113, -113, 226, 226, -20, 7, col.lower, col.left, col.right, col.edge);
    p.box(-110, -110, 220, 220, -13, 5, col.rim, col.left, col.right, col.edge);
    p.box(-108, -108, 216, 216, -8, 16, top, col.left, col.right, col.edge);
    p.plane(-104, -104, 208, 208, 8.1, null, col.edge, 0.4);

    // Sidewall laminations and exposed castellated copper contacts.
    [-12, -5, 1].forEach(z => {
      p.line([[-108, 108, z], [108, 108, z], [108, -108, z]], col.edge, 0.45, 0.5);
    });
    for (let i = 0; i < 20; i++) {
      const q = -94 + i * 9.8;
      p.box(q, -116, 4.8, 13, -6, 4, col.copper, col.copperSide, col.copperDark);
      p.box(-116, q, 13, 4.8, -6, 4, col.copper, col.copperSide, col.copperDark);
      p.box(q, 103, 4.8, 13, -6, 4, col.copper, col.copperSide, col.copperDark);
      p.box(103, q, 13, 4.8, -6, 4, col.copper, col.copperSide, col.copperDark);
      p.line([[q + 2, 109, -5], [q + 2, 115, -5]], col.gate, 0.6, 0.6);
    }

    p.plane(-95, -95, 190, 190, 8.2, null, col.etch, 1);
    p.plane(-89, -89, 178, 178, 8.3, null, col.trace, 0.4);
    p.box(-81, -81, 162, 162, 9, 12, col.rim, col.left, col.right, col.edge);
    const die = c.createLinearGradient(...p.p(-76, -76, TOP), ...p.p(76, 76, TOP));
    die.addColorStop(0, col.die); die.addColorStop(1, col.dieEnd);
    p.box(-76, -76, 152, 152, 21, 8, die, col.left, col.right, col.dieEdge);
    p.plane(-73, -73, 146, 146, TOP + 0.1, null, col.etch, 0.5);

    // The die is etched even between assembly cycles.
    for (let n = -70; n <= 70; n += 5.5) {
      p.line([[-70, n, TOP + 0.2], [70, n, TOP + 0.2]], col.etch, 0.35, 0.52);
      p.line([[n, -70, TOP + 0.2], [n, 70, TOP + 0.2]], col.etch, 0.35, 0.52);
    }
    for (let row = 0; row < 6; row++) {
      for (let column = 0; column < 6; column++) {
        const x = (column - 2.5) * 22, y = (row - 2.5) * 22;
        p.plane(x - 8, y - 9, 16, 18, TOP + 0.3, null, col.trace, 0.45);
        p.line([[x - 3, y, TOP + 0.4], [x + 3, y, TOP + 0.4]], col.trace, 0.5, 0.7);
        p.line([[x, y - 3, TOP + 0.4], [x, y + 3, TOP + 0.4]], col.trace, 0.5, 0.7);
      }
    }

    for (let i = 0; i < 17; i++) {
      const q = -67 + i * 8.4;
      const paths = [
        [[q, -74, TOP + 1], [q, -83, TOP + 7], [q, -98, 10]],
        [[-74, q, TOP + 1], [-83, q, TOP + 7], [-98, q, 10]],
        [[q, 74, TOP + 1], [q, 83, TOP + 7], [q, 98, 10]],
        [[74, q, TOP + 1], [83, q, TOP + 7], [98, q, 10]],
      ];
      paths.forEach(points => {
        p.line(points, col.copperDark, 1.3);
        p.line(points, col.copper, 0.5, 0.85);
        const end = points[2];
        p.plane(end[0] - 1.8, end[1] - 1.8, 3.6, 3.6, end[2], col.copper);
      });
    }

    // Pin-one marker and alignment targets.
    p.dot(-99, -99, 9, 2.2, col.copper);
    p.line([[-100, 91, 9], [-100, 100, 9], [-91, 100, 9]], col.metal, 0.8, 0.8);
    p.line([[91, -100, 9], [100, -100, 9], [100, -91, 9]], col.metal, 0.8, 0.8);
  }

  function buildTransistor(scale, variant) {
    const sheet = surface(54 * scale, 47 * scale);
    const p = new Painter(sheet.ctx, scale, 27 * scale, 29 * scale);
    const col = palette;
    p.box(-7.5, -8.5, 15, 17, 0, 1.8, col.well, col.left, col.right, col.trace);
    // Source/drain, three silicon fins, and a copper gate crossing the channel.
    p.box(-7, -6, 3.5, 12, 1.8, 2.5, col.metal, col.metalSide, col.well);
    p.box(3.5, -6, 3.5, 12, 1.8, 2.5, col.metal, col.metalSide, col.well);
    [-4, 0, 4].forEach(y => {
      p.box(-5.2, y - 0.65, 10.4, 1.3, 2.1, 3.8, col.signal, col.metalSide, col.well);
    });
    p.box(-1.5, -8, 3, 16, 2.1, variant ? 6.4 : 5.8, col.gate, col.gateSide, col.copperDark);
    p.plane(-0.9, -6.5, 1.4, 13, variant ? 8.6 : 8, col.metal);
    [-5.1, 5.1].forEach(x => {
      [-3.5, 3.5].forEach(y => p.box(x - 0.8, y - 0.8, 1.6, 1.6, 4.3, 1.4,
        col.gate, col.gateSide, col.copperDark));
    });
    return sheet;
  }

  function createScene(cx, cy, scale, side) {
    const cells = makeCells(11 + side * 37);
    const base = surface(580 * scale, 420 * scale);
    const origin = { x: 290 * scale, y: 195 * scale };
    drawPackage(new Painter(base.ctx, scale, origin.x, origin.y), side);
    return { cx, cy, scale, side, cells, routes: makeRoutes(cells), base, origin,
      sprites: [buildTransistor(scale, 0), buildTransistor(scale, 1)] };
  }

  function resize() {
    resizeQueued = false;
    width = window.innerWidth;
    height = window.innerHeight;
    // Cap both density and total pixels on large/retina monitors.
    dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5500000 / (width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    palette = PALETTES[isDark() ? 'dark' : 'light'];
    mobile = width < 1200;
    if (mobile) {
      mobileSpace.dataset.view = mobileView;
      const rect = mobileSpace.getBoundingClientRect();
      const scale = Math.min(1, (width - 34) / 450, (rect.height - 12) / 386);
      const cy = rect.top + rect.height * 0.5 + 14;
      scenes = mobileView === 'silicon' ? [createScene(width / 2, cy, scale, 1)] : [];
      schematicScene = { cx: width / 2, cy, scale };
      mobileVisible = rect.bottom > 0 && rect.top < height;
    } else {
      const content = document.querySelector('.columns').getBoundingClientRect();
      const gutter = Math.min(content.left, width - content.right);
      const scale = Math.min(1.24, (gutter - 38) / 455, (height - 90) / 530);
      const cy = clamp(height * 0.53, 248 * scale, height - 187 * scale);
      scenes = [createScene(width - gutter * 0.5, cy + 22 * scale, scale, 1)];
      schematicScene = { cx: gutter * 0.5, cy: cy + 22 * scale, scale };
      mobileVisible = true;
    }
    sceneDirty = true;
    syncPlayback();
  }

  function pathProgress(p, points, progress, color, weight, alpha = 1) {
    if (progress <= 0) return;
    const c = p.ctx;
    const projected = points.map(point => p.p(...point));
    const lengths = projected.slice(1).map((point, i) =>
      Math.hypot(point[0] - projected[i][0], point[1] - projected[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let remaining = total * clamp(progress);
    c.save();
    c.globalAlpha *= alpha;
    c.beginPath(); c.moveTo(...projected[0]);
    for (let i = 0; i < lengths.length; i++) {
      const amount = lengths[i] ? Math.min(1, remaining / lengths[i]) : 1;
      c.lineTo(mix(projected[i][0], projected[i + 1][0], amount),
        mix(projected[i][1], projected[i + 1][1], amount));
      remaining -= lengths[i];
      if (remaining <= 0) break;
    }
    c.strokeStyle = color;
    c.lineWidth = weight * p.scale;
    c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    c.restore();
  }

  function pointOnPath(p, points, progress) {
    const coords = points.map(point => p.p(...point));
    const lengths = coords.slice(1).map((point, i) =>
      Math.hypot(point[0] - coords[i][0], point[1] - coords[i][1]));
    let at = lengths.reduce((a, b) => a + b, 0) * progress;
    for (let i = 0; i < lengths.length; i++) {
      if (at <= lengths[i]) {
        const amount = lengths[i] ? at / lengths[i] : 0;
        return [mix(coords[i][0], coords[i + 1][0], amount),
          mix(coords[i][1], coords[i + 1][1], amount)];
      }
      at -= lengths[i];
    }
    return coords[coords.length - 1];
  }

  function drawRoutes(p, scene, time, fade) {
    const c = p.ctx;
    scene.routes.forEach((route, i) => {
      const progress = smooth((time - route.start) / 1.8);
      if (!progress) return;
      const color = route.copper ? palette.copper : palette.signal;
      pathProgress(p, route.points, progress, color, 0.85, fade * 0.67);
      if (progress < 1) {
        const point = pointOnPath(p, route.points, progress);
        c.save();
        c.globalAlpha *= fade;
        c.fillStyle = palette.signal;
        c.shadowColor = palette.glow; c.shadowBlur = 7 * p.scale;
        c.beginPath(); c.arc(...point, 1.25 * p.scale, 0, TAU); c.fill();
        c.restore();
      } else if (time > 19.6 && i % 3 === 0) {
        const point = pointOnPath(p, route.points, (time * 0.45 + i * 0.173) % 1);
        c.save();
        c.globalAlpha *= fade * 0.9;
        c.fillStyle = palette.signal;
        c.beginPath(); c.arc(...point, 1.1 * p.scale, 0, TAU); c.fill();
        c.restore();
      }
    });
  }

  function drawCell(p, scene, cell, time, fade) {
    const age = time - 0.2 - cell.rank * CELL_GAP;
    if (age < 0) return;
    const c = p.ctx, s = p.scale;
    const progress = clamp(age / LAND_TIME);
    const approach = easeOut(progress / 0.72);
    const descent = smooth((progress - 0.12) / 0.88);
    const retiring = smooth((time - 25.1 - cell.rank * 0.023) / 1.6);
    const x = cell.x + cell.startX * (1 - approach);
    const y = cell.y + cell.startY * (1 - approach);
    const lift = cell.lift * (1 - descent) + retiring * 28;
    const alpha = smooth(progress / 0.18) * (1 - retiring);
    if (alpha <= 0) return;

    c.save();
    c.globalAlpha *= alpha;
    if (progress < 1) {
      // A restrained targeting reticle and its actual contact shadow.
      c.save();
      c.globalAlpha *= 0.48;
      p.plane(cell.x - 9, cell.y - 10, 18, 20, TOP + 0.5, null, palette.signal, 0.8);
      c.setLineDash([1.5 * s, 4 * s]);
      p.line([[cell.x, cell.y, TOP + 2], [x, y, TOP + lift - 2]], palette.signal, 0.6, 0.6);
      c.restore();
      c.save();
      c.globalAlpha *= 0.2 + progress * 0.3;
      p.plane(x - 8, y - 9, 16, 18, TOP + 0.7, '#061d16');
      c.restore();
    }

    const point = p.p(x, y, TOP + lift + 0.8);
    const sprite = scene.sprites[cell.rank % 2];
    c.drawImage(sprite.canvas, point[0] - 27 * s, point[1] - 29 * s, sprite.width, sprite.height);

    const sinceLanding = age - LAND_TIME;
    if (sinceLanding > 0 && sinceLanding < 0.9) {
      const ring = sinceLanding / 0.9;
      c.save();
      c.globalAlpha *= (1 - ring) * 0.55;
      const inset = 9 + ring * 6;
      p.plane(cell.x - inset, cell.y - inset, inset * 2, inset * 2, TOP + 0.6,
        null, palette.signal, 0.8);
      c.restore();
    }

    // The verification plane illuminates each row at the moment it passes.
    const verified = (time - 17) / 3.2;
    const rowAt = (cell.y + 75) / 150;
    const scanLight = Math.max(0, 1 - Math.abs(verified - rowAt) * 12);
    const liveLight = time > 20.4 && cell.rank % 7 === 0
      ? (Math.sin(time * 2.1 + cell.rank) * 0.5 + 0.5) * 0.6 : 0;
    const illumination = Math.max(scanLight, liveLight) * fade;
    if (illumination > 0.01 && progress === 1) {
      c.save();
      c.globalAlpha *= illumination;
      c.shadowBlur = 9 * s;
      c.shadowColor = palette.glow;
      p.dot(cell.x, cell.y, TOP + 9, 1.5, palette.signal);
      c.restore();
    }
    c.restore();
  }

  function drawScan(p, time, fade) {
    const scan = (time - 17) / 3.2;
    if (scan <= 0 || scan >= 1) return;
    const c = p.ctx, y = mix(-75, 75, scan), s = p.scale;
    const envelope = smooth(scan / 0.12) * smooth((1 - scan) / 0.12) * fade;
    c.save();
    c.globalAlpha = envelope;
    const high = p.p(0, y, TOP + 58), low = p.p(0, y, TOP);
    const beam = c.createLinearGradient(...high, ...low);
    beam.addColorStop(0, 'rgba(147, 240, 188, 0)');
    beam.addColorStop(1, 'rgba(147, 240, 188, 0.15)');
    p.path([[-74, y, TOP], [74, y, TOP], [74, y, TOP + 58], [-74, y, TOP + 58]], true);
    c.fillStyle = beam; c.fill();
    c.shadowBlur = 10 * s; c.shadowColor = palette.glow;
    p.line([[-74, y, TOP + 0.8], [74, y, TOP + 0.8]], palette.signal, 1.7);
    c.shadowBlur = 0;
    for (let i = 1; i <= 8; i++) {
      const trailY = y - i * 1.3;
      if (trailY > -75) p.line([[-74, trailY, TOP + 0.6], [74, trailY, TOP + 0.6]],
        palette.signal, 1, (1 - i / 9) * 0.1);
    }
    c.restore();
  }

  function drawScene(scene, time) {
    const s = scene.scale;
    const dx = reducedMotion.matches ? 0 : camera.x * (scene.side ? -1 : 1) * s;
    const dy = reducedMotion.matches ? 0 : camera.y * s;
    const p = new Painter(ctx, s, scene.cx + dx, scene.cy + dy);
    ctx.drawImage(scene.base.canvas, p.ox - scene.origin.x, p.oy - scene.origin.y,
      scene.base.width, scene.base.height);
    const fade = 1 - smooth((time - 25.2) / 2.4);
    drawRoutes(p, scene, time, fade);
    // Back-to-front order is deterministic; airborne parts are painted last.
    const airborne = [];
    scene.cells.forEach(cell => {
      const age = time - 0.2 - cell.rank * CELL_GAP;
      if (age < LAND_TIME) airborne.push(cell);
      else drawCell(p, scene, cell, time, fade);
    });
    drawScan(p, time, fade);
    airborne.sort((a, b) => b.rank - a.rank).forEach(cell => drawCell(p, scene, cell, time, fade));
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    if (mobile && !mobileVisible) return;
    if (!mobile || mobileView === 'schematic') {
      const time = reducedMotion.matches ? 23.4 : elapsed % CYCLE;
      schematic.draw(ctx, schematicScene, time, palette, reducedMotion.matches, mobile);
    }
    scenes.forEach(scene => {
      const time = reducedMotion.matches ? 23.4 : (elapsed + scene.side * 5.8) % CYCLE;
      drawScene(scene, time);
    });
    sceneDirty = false;
  }

  function isRunning() {
    return !userPaused && !reducedMotion.matches && !document.hidden && mobileVisible;
  }

  function tick(now) {
    frame = 0;
    if (!isRunning()) return;
    if (lastTime) elapsed += Math.min((now - lastTime) / 1000, 0.06);
    lastTime = now;
    camera.x += (pointer.x - camera.x) * 0.035;
    camera.y += (pointer.y - camera.y) * 0.035;
    render();
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    motionButton.hidden = reducedMotion.matches;
    motionButton.setAttribute('aria-pressed', String(userPaused));
    motionButton.setAttribute('aria-label', `${userPaused ? 'Resume' : 'Pause'} background animation`);
    motionButton.querySelector('span').textContent = `${userPaused ? 'Resume' : 'Pause'} animation`;
    if (sceneDirty) render();
    if (isRunning()) frame = requestAnimationFrame(tick);
  }

  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    syncPlayback();
  });

  sceneViews.addEventListener('click', event => {
    const button = event.target.closest('[data-scene-view]');
    if (!button || button.dataset.sceneView === mobileView) return;
    mobileView = button.dataset.sceneView;
    sceneViews.querySelectorAll('button').forEach(view => {
      view.setAttribute('aria-pressed', String(view === button));
    });
    resize();
  });

  window.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches || userPaused || mobile) return;
    pointer = { x: (event.clientX / width - 0.5) * 8,
      y: (event.clientY / height - 0.5) * 6 };
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; });

  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(resize);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if (!mobile) return;
    const rect = mobileSpace.getBoundingClientRect();
    const cy = rect.top + rect.height * 0.5 + 14;
    if (scenes.length) scenes[0].cy = cy;
    schematicScene.cy = cy;
    const visible = rect.bottom > 0 && rect.top < height;
    sceneDirty = true;
    if (visible !== mobileVisible) {
      mobileVisible = visible;
      syncPlayback();
    } else if (!isRunning()) render();
  }, { passive: true });

  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', () => {
    sceneDirty = true;
    camera = { x: 0, y: 0 };
    syncPlayback();
  });
  systemTheme.addEventListener('change', () => { updateThemeButton(); resize(); });
  new MutationObserver(() => { updateThemeButton(); resize(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('pageshow', () => { sceneDirty = true; syncPlayback(); });
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  });

  resize();
})();
