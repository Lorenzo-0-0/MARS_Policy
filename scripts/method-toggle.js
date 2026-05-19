/* v8 — task-mode toggle (Mode A / Mode B per task).
   Each `.task-card--mode-toggle` carries:
     - `.mode-tabs > .mode-tab[data-mode]` buttons
     - `.vp[data-task-modes]` JSON  { "A": { src, caption }, "B": { src, caption } }
     - `[data-mode-caption]` paragraph that swaps with the active mode
*/

(function () {

  document.querySelectorAll('.task-card--mode-toggle').forEach((card) => {
    const tabs = [...card.querySelectorAll('.mode-tab')];
    const vpRoot = card.querySelector('[data-vp]');
    if (!vpRoot || tabs.length === 0) return;

    let modes;
    try { modes = JSON.parse(vpRoot.dataset.taskModes || '{}'); }
    catch (e) { console.warn('Bad data-task-modes on', vpRoot, e); return; }

    const captionEl = card.querySelector('[data-mode-caption]');

    function setMode(key) {
      const m = modes[key];
      if (!m) return;
      tabs.forEach((b) => {
        const on = b.dataset.mode === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const vp = vpRoot.__vp;
      if (vp) {
        vp.setSrc(m.src);
      } else {
        const v = vpRoot.querySelector('video');
        if (v) { v.src = m.src; v.load(); v.play().catch(() => {}); }
      }
      if (captionEl && m.caption) captionEl.textContent = m.caption;
    }

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
  });

  // Cycle behaviour for Push-T / Push Cube (legacy, kept if any .js-cycle survives)
  document.querySelectorAll('.js-cycle').forEach((video) => {
    let clips;
    try { clips = JSON.parse(video.dataset.clips); }
    catch (e) { return; }
    if (!Array.isArray(clips) || clips.length === 0) return;
    let idx = clips.indexOf(video.getAttribute('src'));
    if (idx < 0) idx = 0;
    video.loop = false;
    video.addEventListener('ended', () => {
      idx = (idx + 1) % clips.length;
      const root = video.closest('[data-vp]');
      const vp = root && root.__vp;
      if (vp) vp.setSrc(clips[idx]);
      else { video.src = clips[idx]; video.load(); video.play().catch(() => {}); }
    });
  });

})();
