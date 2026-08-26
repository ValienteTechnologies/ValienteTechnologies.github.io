// BadgerEye terminal exit: the prompt line types, holds, deletes and
// rotates through its phrases while the terminal is on screen. The real
// heading text lives in a visually hidden span; this span is decorative.
(function () {
  var el = document.querySelector('.be-exit__type');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var phrases;
  try { phrases = JSON.parse(el.getAttribute('data-phrases')); } catch (e) { return; }
  if (!phrases || phrases.length < 2) return;

  var idx = 0;
  var running = false;
  var timer = null;

  function schedule(fn, ms) { timer = setTimeout(fn, ms); }

  function typeTo(text, done) {
    var i = 0;
    (function step() {
      if (!running) return;
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) { schedule(step, 38); } else { done(); }
    })();
  }

  function deleteAll(done) {
    (function step() {
      if (!running) return;
      var t = el.textContent;
      if (!t.length) { done(); return; }
      el.textContent = t.slice(0, -1);
      schedule(step, 20);
    })();
  }

  function cycle() {
    if (!running) return;
    schedule(function () {
      deleteAll(function () {
        idx = (idx + 1) % phrases.length;
        typeTo(phrases[idx], cycle);
      });
    }, 2800);
  }

  function start() { if (running) return; running = true; cycle(); }
  function stop() { running = false; if (timer) clearTimeout(timer); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(el);
  } else {
    start();
  }
})();
