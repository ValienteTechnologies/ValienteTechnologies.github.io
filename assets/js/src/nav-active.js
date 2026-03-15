(function () {
  var navLinks = document.querySelectorAll('#mainNav .nav-link');
  if (!navLinks.length) return;

  var normalize = function (path) {
    if (!path) return '/';
    var a = document.createElement('a');
    a.href = path;
    var clean = (a.pathname || '/')
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '');
    if (clean.length > 1 && clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean || '/';
  };

  var currentPath = normalize(window.location.pathname);

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('http') === 0) return;
    if (normalize(href) === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();
