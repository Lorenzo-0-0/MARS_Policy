/* overview-video.js — the feature overview video shows its native controls
   ONLY while hovered: a clean poster/frame at rest, full controls (progress,
   play, volume, fullscreen) the moment the cursor is over it, hidden again on
   leave. Playback continues if the cursor leaves mid-play.

   The <video> keeps its `controls` attribute in markup so that, without JS or on
   touch devices (which can't hover), the native controls remain available. Here
   we only strip them on hover-capable pointers and re-add on hover. */
(() => {
  const vids = document.querySelectorAll('.overview__video');
  if (!vids.length) return;

  // Touch / no-hover devices: leave the native controls on (tap works there).
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  vids.forEach((v) => {
    v.removeAttribute('controls');                                    // clean at rest
    v.addEventListener('mouseenter', () => v.setAttribute('controls', ''));
    v.addEventListener('mouseleave', () => v.removeAttribute('controls'));
  });
})();
