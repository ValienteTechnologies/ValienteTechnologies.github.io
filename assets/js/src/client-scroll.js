// One-time setup for the clients/references logo marquee.
//
// The marquee itself is a pure CSS transform animation (see
// _sass/components/_client-scroll.scss) — this script does nothing but
// randomize the logo order once on load. No animation loop, no scroll
// writes, no per-frame DOM reads. The track holds two identical copies of
// the logo row (rendered server-side by Liquid) so the CSS loop is
// seamless; both copies must end up in the same shuffled order or the
// loop would visibly jump, so the same permutation is applied to both.
(function () {
  'use strict';

  function initClientScroll() {
    const viewport = document.getElementById('scrolling-clients');
    if (!viewport) return;

    const track = viewport.querySelector('.client-marquee__track');
    if (!track) return;

    const children = Array.from(track.children);
    const half = children.length / 2;
    if (half === 0 || !Number.isInteger(half)) return;

    const firstCopy = children.slice(0, half);
    const secondCopy = children.slice(half);

    // Fisher-Yates over the index order, then apply that same order to
    // both copies so the two halves stay identical (required for the
    // -50% CSS loop to be seamless).
    const order = firstCopy.map(function (_, i) { return i; });
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    const fragment = document.createDocumentFragment();
    order.forEach(function (i) { fragment.appendChild(firstCopy[i]); });
    order.forEach(function (i) { fragment.appendChild(secondCopy[i]); });
    track.appendChild(fragment);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientScroll);
  } else {
    initClientScroll();
  }
})();
