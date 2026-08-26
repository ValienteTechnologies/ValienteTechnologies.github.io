// BadgerEye ring eye: the pupil follows the cursor while the eye is on
// screen. Writes --px/--py custom properties consumed by the pupil's
// transform in CSS. No-ops on touch-only devices and for reduced motion.
(function () {
  var eye = document.querySelector('.be-cta__eye');
  if (!eye) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var MAX = 30; // px the pupil may travel from center
  var targetX = 0;
  var targetY = 0;
  var curX = 0;
  var curY = 0;
  var running = false;
  var rafId = null;

  function onMove(e) {
    var rect = eye.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = e.clientX - cx;
    var dy = e.clientY - cy;
    var dist = Math.hypot(dx, dy);
    if (dist === 0) return;
    // Approach MAX smoothly as the cursor moves away
    var r = MAX * (dist / (dist + 160));
    targetX = (dx / dist) * r;
    targetY = (dy / dist) * r;
  }

  function tick() {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    eye.style.setProperty('--px', curX.toFixed(2) + 'px');
    eye.style.setProperty('--py', curY.toFixed(2) + 'px');
    rafId = running ? requestAnimationFrame(tick) : null;
  }

  function start() {
    if (running) return;
    running = true;
    document.addEventListener('mousemove', onMove, { passive: true });
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    document.removeEventListener('mousemove', onMove);
    if (rafId) cancelAnimationFrame(rafId);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(eye);
  } else {
    start();
  }
})();
