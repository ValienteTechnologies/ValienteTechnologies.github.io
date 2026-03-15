/**
 * Shuffle testimonials carousel on page load (matches references behavior).
 */
(function() {
  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function init() {
    var carousel = document.getElementById('testimonialsCarousel');
    if (!carousel) return;

    var indicators = carousel.querySelectorAll('.carousel-indicators li');
    var items = carousel.querySelectorAll('.carousel-inner .carousel-item');
    if (indicators.length < 2 || items.length < 2) return;

    var n = items.length;
    var indices = [];
    for (var i = 0; i < n; i++) indices.push(i);
    indices = shuffleArray(indices);

    var indicatorsParent = indicators[0].parentNode;
    var inner = items[0].parentNode;

    indices.forEach(function(origIdx, newPos) {
      var li = indicators[origIdx];
      var item = items[origIdx];
      li.setAttribute('data-slide-to', String(newPos));
      li.classList.toggle('active', newPos === 0);
      indicatorsParent.appendChild(li);
      item.classList.toggle('active', newPos === 0);
      inner.appendChild(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
