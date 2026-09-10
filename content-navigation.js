/* Swap only the copy; the engineering session remains mounted and keeps its clock. */
(() => {
  'use strict';

  const panels = [...document.querySelectorAll('[data-content]')];
  const links = [...document.querySelectorAll('[data-content-link]')];
  const overview = document.querySelector('[data-scene-view="overview"]');
  const sectionFromURL = () => location.hash === '#careers' ? 'careers' : 'about';

  function showSection(section, focus = false) {
    for (const panel of panels) {
      const selected = panel.dataset.content === section;
      panel.hidden = !selected;
      panel.inert = !selected;
    }
    for (const link of links) {
      if (link.dataset.contentLink === section) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.title = section === 'careers' ? 'Careers — arcverex' : 'arcverex';
    overview.textContent = section === 'careers' ? 'Careers' : 'About';
    window.dispatchEvent(new CustomEvent('arcverex:sectionchange', { detail: { section } }));
    if (focus) {
      document.querySelector(`[data-content="${section}"] h1`).focus({ preventScroll: true });
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-content-link]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const section = link.dataset.contentLink;
    if (sectionFromURL() !== section) history.pushState(null, '', `#${section}`);
    showSection(section, true);
  });

  const restore = () => showSection(sectionFromURL(), true);
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', restore);
  showSection(sectionFromURL());
})();
