/* Shared layout, themes, and playback for the robot terminal and ALU drawing. */
(() => {
  'use strict';

  const root = document.documentElement;
  const canvas = document.getElementById('chip-scene');
  const themeButton = document.querySelector('.theme-toggle');
  const motionButton = document.querySelector('.motion-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = matchMedia('(max-width: 1199px)');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;

  function updateThemeButton() {
    themeButton.classList.toggle('is-dark', isDark());
    themeButton.setAttribute('aria-label', `Switch to ${isDark() ? 'light' : 'dark'} theme`);
  }
  themeButton.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) { /* Storage is optional. */ }
  });
  updateThemeButton();

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const schematic = window.ArcverexSchematic.create();
  const terminal = window.ArcverexTerminal.create(document.querySelector('.bg-art'));

  let width = 0, height = 0, mobile = false;
  let schematicScene, terminalScene;
  let frame = 0, lastTime = 0, elapsed = 0, userPaused = false;
  let resizeQueued = false, sceneDirty = true;

  function resize() {
    resizeQueued = false;
    width = root.clientWidth;
    height = innerHeight;
    mobile = mobileLayout.matches;
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(5000000 / (width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (mobile) {
      // Keep narrow screens focused on the page copy and pause the artwork.
      terminalScene = { x: 0, y: 0, width: 0, height: 0, visible: false };
      terminal.layout(terminalScene);
    } else {
      const content = document.querySelector('.columns').getBoundingClientRect();
      const gutter = Math.min(content.left, width - content.right);
      const cy = height * 0.53;
      const panelWidth = Math.min(428, gutter - 42);
      const panelHeight = Math.min(460, height - 132);
      terminalScene = { x: (gutter - panelWidth) / 2,
        y: clamp(cy - panelHeight / 2, 40, height - panelHeight - 84),
        width: panelWidth, height: panelHeight, visible: true };
      schematicScene = { cx: width - gutter / 2, cy,
        scale: Math.min(1.28, (gutter - 38) / (450 * 0.86), (height - 100) / (434 * 0.86)) };
      terminal.layout(terminalScene);
    }
    sceneDirty = true;
    syncPlayback();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    if (mobile) { sceneDirty = false; return; }
    const state = window.ArcverexSession.frame(elapsed, reducedMotion.matches);
    terminal.draw(state);
    schematic.draw(ctx, schematicScene, state, { dark: isDark() }, false);
    sceneDirty = false;
  }

  function isRunning() {
    return !userPaused && !reducedMotion.matches && !document.hidden && !mobile;
  }

  function tick(now) {
    frame = 0;
    if (!isRunning()) return;
    if (lastTime) elapsed += Math.min((now - lastTime) / 1000, 0.06);
    lastTime = now;
    render();
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    motionButton.hidden = reducedMotion.matches || mobile;
    motionButton.setAttribute('aria-pressed', String(userPaused));
    motionButton.setAttribute('aria-label', `${userPaused ? 'Resume' : 'Pause'} background animation`);
    motionButton.querySelector('span').textContent = `${userPaused ? 'Resume' : 'Pause'} animation`;
    if (sceneDirty) render();
    if (isRunning()) frame = requestAnimationFrame(tick);
  }

  motionButton.addEventListener('click', () => { userPaused = !userPaused; syncPlayback(); });
  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(resize);
  }, { passive: true });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', () => { sceneDirty = true; syncPlayback(); });
  systemTheme.addEventListener('change', () => { updateThemeButton(); sceneDirty = true; syncPlayback(); });
  new MutationObserver(() => { updateThemeButton(); sceneDirty = true; syncPlayback(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('pageshow', () => { sceneDirty = true; syncPlayback(); });
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  });
  resize();
})();
