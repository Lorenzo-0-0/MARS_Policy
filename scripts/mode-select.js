/* mode-select.js — Pick Cup / Pick Vegetable "ours" tile.
   Click a chip to switch the MARS video between its two sampled modes.
   Swaps the <video> src + poster on the existing element, so the control
   bar / lazy-autoplay wiring from comparison.js stays attached. */
(() => {
  document.querySelectorAll('[data-mode-tile]').forEach((tile) => {
    const video = tile.querySelector('.cmp__media video');
    const btns = [...tile.querySelectorAll('.mode-pick__btn')];
    if (!video || btns.length < 2) return;

    btns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.classList.contains('is-active')) return;
        btns.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        if (btn.dataset.poster) video.setAttribute('poster', btn.dataset.poster);
        video.setAttribute('src', btn.dataset.src);
        video.load();
        video.play().catch(() => {});
      });
    });
  });
})();
