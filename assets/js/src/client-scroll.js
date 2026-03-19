// Infinite auto-scroll for clients/references section
(function () {
  'use strict';

  function initClientScroll() {
    const track = document.getElementById('scrolling-clients');
    if (!track) return;

    // Shuffle children in place (Fisher-Yates)
    const items = Array.from(track.children);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      track.appendChild(items[j]);
      items[j] = items[i];
    }

    // Clone all items for seamless infinite loop
    Array.from(track.children).forEach(function (el) {
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    // Start after images load (or 500ms fallback)
    const images = track.querySelectorAll('img');
    let started = false;

    function start() {
      if (started) return;
      started = true;
      run();
    }

    if (images.length === 0) {
      start();
    } else {
      let loaded = 0;
      function onLoad() { if (++loaded >= images.length) start(); }
      images.forEach(function (img) {
        if (img.complete) { onLoad(); }
        else {
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onLoad);
        }
      });
      setTimeout(start, 500);
    }

    function run() {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const speed = isMobile ? 3.0 : 1.0; // px per 16.67ms frame
      const half = track.scrollWidth / 2;  // cached — DOM won't change after init

      let pos = 0;
      let paused = false;
      let rafId;
      let lastTime = performance.now();

      // Seamless wrap: when we've scrolled one full copy, jump back silently
      // Use cached `pos` (not track.scrollLeft) to avoid a forced reflow on every frame
      function wrap() {
        if (pos >= half) {
          pos -= half;
          track.scrollLeft = pos;
        }
      }

      function animate(now) {
        if (!paused) {
          const dt = Math.min(now - lastTime, 100);
          pos += speed * (dt / 16.67);
          track.scrollLeft = pos;
          wrap();
        }
        lastTime = now;
        rafId = requestAnimationFrame(animate);
      }

      // Pause on hover
      track.addEventListener('mouseenter', function () { paused = true; });
      track.addEventListener('mouseleave', function () {
        pos = track.scrollLeft;
        paused = false;
      });

      // Pause on touch, resume after momentum settles
      let touching = false;
      let touchTimeout;

      function resumeAfterTouch() {
        touchTimeout = setTimeout(function () {
          pos = track.scrollLeft;
          wrap();
          paused = false;
        }, 1500);
      }

      track.addEventListener('touchstart', function () {
        touching = true;
        paused = true;
        clearTimeout(touchTimeout);
      }, { passive: true });

      track.addEventListener('touchend', function () {
        touching = false;
        resumeAfterTouch();
      }, { passive: true });

      track.addEventListener('touchcancel', function () {
        touching = false;
        resumeAfterTouch();
      }, { passive: true });

      // Pause when tab is hidden
      let hiddenPaused = false;
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          if (!paused) { paused = true; hiddenPaused = true; }
        } else if (hiddenPaused) {
          pos = track.scrollLeft;
          paused = false;
          hiddenPaused = false;
        }
      });

      rafId = requestAnimationFrame(animate);

      window.addEventListener('beforeunload', function () {
        cancelAnimationFrame(rafId);
        clearTimeout(touchTimeout);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientScroll);
  } else {
    initClientScroll();
  }
})();
