/* MARS Policy — VideoPlayer
   Bind to every [data-vp].
   Default 2× muted loop, hover-revealed controls, scrub, speed cycle,
   keyboard (← → space).  Lazy src via IntersectionObserver.
*/

(function () {
  const fmt = (t) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  class VideoPlayer {
    constructor(root) {
      this.root = root;
      this.video = root.querySelector('.vp__video');
      this.scrub = root.querySelector('.vp__scrub');
      this.fill  = root.querySelector('.vp__scrub-fill');
      this.thumb = root.querySelector('.vp__scrub-thumb');
      this.time  = root.querySelector('.vp__time');
      this.speedBtn = root.querySelector('.vp__speed');
      this.ppBig = root.querySelector('.vp__playpause');
      this.ppMini = root.querySelector('.vp__pp-mini');

      this.speeds = (this.speedBtn?.dataset.speeds || '1,2,4').split(',').map(Number);
      this.defaultRate = parseFloat(root.dataset.defaultRate || '2');
      this.currentRate = this.defaultRate;

      this._wasPlaying = false;
      this._scrubbing = false;

      this._bind();
      this._lazyLoad();
    }

    _bind() {
      const v = this.video;

      v.addEventListener('timeupdate', () => this._sync());
      v.addEventListener('loadedmetadata', () => this._sync());
      v.addEventListener('play', () => this.root.classList.add('is-playing'));
      v.addEventListener('pause', () => this.root.classList.remove('is-playing'));

      // Click overlay or mini button to toggle
      const toggle = () => (v.paused ? v.play() : v.pause());
      this.ppBig?.addEventListener('click', toggle);
      this.ppMini?.addEventListener('click', toggle);

      // Scrub (mouse + touch)
      this.scrub?.addEventListener('pointerdown', (e) => this._scrubStart(e));

      // Speed cycle
      this.speedBtn?.addEventListener('click', () => this._cycleSpeed());

      // Keyboard
      this.scrub?.addEventListener('keydown', (e) => this._keys(e));
      this.root.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggle();
        }
      });
      // Make root focusable for keyboard
      if (!this.root.hasAttribute('tabindex')) this.root.tabIndex = -1;
    }

    _lazyLoad() {
      // If src already set externally (e.g. method-toggle for Pick Cup/Vege), respect it.
      const hasSrc = this.video.src || this.video.querySelector('source');
      if (hasSrc) {
        this._applyRate();
        this.video.play().catch(() => {});
        return;
      }
      // Otherwise wait until near viewport
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(this.root);
          this._applyInitialSrc();
        });
      }, { rootMargin: '300px' });
      io.observe(this.root);
    }

    _applyInitialSrc() {
      // For VP wrapping a cycle/method video, source list may be on a sibling attribute
      // — but in v2 the wrapper holds the data and we rely on outside setSrc().
      // The simplest path: if there's a data-initial-src, use it.
      const initial = this.root.dataset.initialSrc;
      if (initial) this.setSrc(initial);
    }

    setSrc(url) {
      if (!url) return;
      const wasPlaying = !this.video.paused;
      this.video.src = url;
      this.video.load();
      this._applyRate();
      // Try to play; many browsers require user-initiated.
      const p = this.video.play();
      if (p && p.catch) p.catch(() => {});
      if (wasPlaying) this.root.classList.add('is-playing');
    }

    _applyRate() {
      this.video.playbackRate = this.currentRate;
      if (this.speedBtn) this.speedBtn.textContent = `${this.currentRate}×`;
    }

    _cycleSpeed() {
      const i = this.speeds.indexOf(this.currentRate);
      const next = this.speeds[(i + 1) % this.speeds.length];
      this.currentRate = next;
      this._applyRate();
    }

    _sync() {
      const v = this.video;
      if (!isFinite(v.duration) || v.duration === 0) {
        if (this.time) this.time.textContent = '0:00 / 0:00';
        return;
      }
      const pct = (v.currentTime / v.duration) * 100;
      if (this.fill) this.fill.style.width = pct + '%';
      if (this.thumb) this.thumb.style.left = pct + '%';
      if (this.time) this.time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
      if (this.scrub) this.scrub.setAttribute('aria-valuenow', String(Math.round(pct)));
    }

    _scrubStart(e) {
      e.preventDefault();
      this._scrubbing = true;
      this._wasPlaying = !this.video.paused;
      this.video.pause();
      this.root.classList.add('is-scrubbing');
      this._scrubMove(e);

      const move = (ev) => this._scrubMove(ev);
      const up = () => {
        this._scrubbing = false;
        this.root.classList.remove('is-scrubbing');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (this._wasPlaying) this.video.play().catch(() => {});
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }

    _scrubMove(e) {
      if (!this.scrub) return;
      const rect = this.scrub.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const v = this.video;
      if (isFinite(v.duration)) v.currentTime = x * v.duration;
      this._sync();
    }

    _keys(e) {
      const v = this.video;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isFinite(v.duration)) v.currentTime = Math.min(v.duration, v.currentTime + 5);
      }
    }
  }

  // Auto-bootstrap all [data-vp]
  function init() {
    document.querySelectorAll('[data-vp]').forEach((el) => {
      if (el.__vp) return;
      el.__vp = new VideoPlayer(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for cross-script use (method-toggle.js will look at root.__vp)
  window.MARS_VideoPlayer = VideoPlayer;
})();
