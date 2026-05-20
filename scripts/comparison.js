/* comparison.js — §05 side-by-side comparison tiles.
   - Lazy autoplay (play in view, pause off-screen) so a dozen real-robot
     clips don't all decode at once.
   - Default 2× playback (real-robot footage is slow); viewers can change it.
   - Per-tile control bar: play/pause + draggable progress (scrub) + speed
     cycle (1× / 1.5× / 2× / 3×). */
(() => {
  const tiles = document.querySelectorAll('.cmp__media');
  if (!tiles.length) return;

  const SPEEDS = [1, 1.5, 2, 3];
  const DEFAULT_RATE = 2;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmt = (t) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  tiles.forEach((media) => {
    const video = media.querySelector('video');
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    let rate = DEFAULT_RATE;
    const applyRate = () => { try { video.playbackRate = rate; } catch (e) {} };
    video.addEventListener('loadedmetadata', applyRate);
    video.addEventListener('play', applyRate);
    applyRate();

    // --- build control bar -------------------------------------------------
    const ctrl = document.createElement('div');
    ctrl.className = 'cmp__ctrl';
    ctrl.innerHTML =
      '<button class="cmp__pp" type="button" aria-label="Play / pause"></button>' +
      '<div class="cmp__scrub" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<div class="cmp__scrub-fill"></div><div class="cmp__scrub-thumb"></div>' +
      '</div>' +
      '<span class="cmp__time">0:00</span>' +
      '<button class="cmp__speed" type="button" aria-label="Playback speed">2×</button>';
    media.appendChild(ctrl);

    const pp = ctrl.querySelector('.cmp__pp');
    const scrub = ctrl.querySelector('.cmp__scrub');
    const fill = ctrl.querySelector('.cmp__scrub-fill');
    const thumb = ctrl.querySelector('.cmp__scrub-thumb');
    const timeEl = ctrl.querySelector('.cmp__time');
    const speedBtn = ctrl.querySelector('.cmp__speed');

    const syncPP = () => media.classList.toggle('is-playing', !video.paused);
    video.addEventListener('play', syncPP);
    video.addEventListener('pause', syncPP);

    const toggle = () => { video.paused ? video.play().catch(() => {}) : video.pause(); };
    pp.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    media.addEventListener('click', (e) => {
      if (e.target.closest('.cmp__ctrl')) return; // clicks on the bar don't toggle
      toggle();
    });

    video.addEventListener('timeupdate', () => {
      if (!isFinite(video.duration) || video.duration === 0) return;
      const pct = (video.currentTime / video.duration) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
      timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
      scrub.setAttribute('aria-valuenow', String(Math.round(pct)));
    });

    // scrub (pointer + keyboard)
    let scrubbing = false, wasPlaying = false;
    const seekTo = (clientX) => {
      const r = scrub.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if (isFinite(video.duration)) video.currentTime = x * video.duration;
    };
    scrub.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      scrubbing = true; wasPlaying = !video.paused; video.pause();
      media.classList.add('is-scrubbing');
      seekTo(e.clientX);
      const move = (ev) => seekTo(ev.clientX);
      const up = () => {
        scrubbing = false; media.classList.remove('is-scrubbing');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (wasPlaying) video.play().catch(() => {});
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    scrub.addEventListener('keydown', (e) => {
      if (!isFinite(video.duration)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 2); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 2); }
    });

    // speed cycle
    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = SPEEDS.indexOf(rate);
      rate = SPEEDS[(i + 1) % SPEEDS.length];
      applyRate();
      speedBtn.textContent = (Number.isInteger(rate) ? rate : rate.toFixed(1)) + '×';
    });
  });

  // --- lazy play / pause ---------------------------------------------------
  const start = (v) => v.play().catch(() => {});
  if (reduce || !('IntersectionObserver' in window)) {
    tiles.forEach((m) => start(m.querySelector('video')));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target.querySelector('video');
      if (!v) return;
      if (e.isIntersecting) start(v); else v.pause();
    });
  }, { rootMargin: '200px 0px', threshold: 0.2 });
  tiles.forEach((m) => io.observe(m));
})();
