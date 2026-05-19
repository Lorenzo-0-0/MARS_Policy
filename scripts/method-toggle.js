/* v3 — cycle behaviour only.
   Method comparison is now a 3-column grid (no tab toggling needed).
   Bench tabs and appendix toggle are gone too. */

(function () {

  // Cycle behaviour for Push-T / Push Cube (single-method, multiple clips).
  document.querySelectorAll('.js-cycle').forEach((video) => {
    let clips;
    try { clips = JSON.parse(video.dataset.clips); }
    catch (e) { console.warn('Bad data-clips on', video, e); return; }
    if (!Array.isArray(clips) || clips.length === 0) return;

    let idx = clips.indexOf(video.getAttribute('src'));
    if (idx < 0) idx = 0;

    video.loop = false;
    video.addEventListener('ended', () => {
      idx = (idx + 1) % clips.length;
      const vpRoot = video.closest('[data-vp]');
      const vp = vpRoot && vpRoot.__vp;
      if (vp) vp.setSrc(clips[idx]);
      else { video.src = clips[idx]; video.load(); video.play().catch(() => {}); }
    });
  });

})();
