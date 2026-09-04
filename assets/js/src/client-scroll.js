// One-time setup for the clients/references logo marquee.
//
// The marquee itself is a pure CSS transform animation (see
// _sass/components/_client-scroll.scss) — this script does nothing but
// randomize the logo order once on load and toggle a pause class on touch.
// No animation loop, no scroll writes, no per-frame DOM reads. The track
// holds two identical copies of the logo row (rendered server-side by
// Liquid) so the CSS loop is seamless; both copies must end up in the same
// shuffled order or the loop would visibly jump, so the same permutation is
// applied to both.
(function () {
  'use strict';

  // :hover never fires on touch devices. Mirror it with an `.is-paused`
  // class: add it on touchstart, remove it 1500ms after the touch ends so
  // the marquee doesn't resume moving out from under a still-reading
  // finger. A new touchstart before that timer fires just resets it.
  function setupTouchPause(viewport) {
    let resumeTimer = null;

    function scheduleResume() {
      if (resumeTimer !== null) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        viewport.classList.remove('is-paused');
        resumeTimer = null;
      }, 1500);
    }

    viewport.addEventListener('touchstart', function () {
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
      viewport.classList.add('is-paused');
    }, { passive: true });

    viewport.addEventListener('touchend', scheduleResume, { passive: true });
    viewport.addEventListener('touchcancel', scheduleResume, { passive: true });
  }

  function initClientScroll() {
    const viewport = document.getElementById('scrolling-clients');
    if (!viewport) return;

    const track = viewport.querySelector('.client-marquee__track');
    if (!track) return;

    setupTouchPause(viewport);

    const children = Array.from(track.children);
    if (children.length === 0) return;
    const half = children.length / 2;

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
