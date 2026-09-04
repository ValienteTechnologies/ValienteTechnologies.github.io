// Language nudge banner: remembers an explicit dropdown language choice, and
// (independently) decides whether to reveal the dismissible nudge banner
// based on the visitor's browser language. Never redirects.
(function () {
  var KEY = "ve-lang";
  var DISMISS_KEY = "ve-lang-nudge-dismissed";

  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[data-lang]");
    if (a) {
      try { localStorage.setItem(KEY, a.getAttribute("data-lang")); } catch (_) {}
    }
  }, true);

  function init() {
    var banner = document.getElementById("langNudge");
    if (!banner) return;

    try {
      if (localStorage.getItem(KEY) || localStorage.getItem(DISMISS_KEY)) return;
    } catch (_) {
      return;
    }

    var targetLang = banner.getAttribute("data-target-lang");
    var browserLangs = navigator.languages || [navigator.language];
    var primaries = [];
    for (var i = 0; i < browserLangs.length; i++) {
      if (browserLangs[i]) {
        primaries.push(String(browserLangs[i]).toLowerCase().split("-")[0]);
      }
    }
    var hasTr = primaries.indexOf("tr") !== -1;

    var show = false;
    if (targetLang === "en" && !hasTr) {
      show = true;
    } else if (targetLang === "tr" && hasTr) {
      show = true;
    }
    if (!show) return;

    banner.removeAttribute("hidden");
    document.body.classList.add("has-lang-nudge");

    function setHeight(px) {
      document.body.style.setProperty("--lang-nudge-height", px + "px");
    }

    // Measured at show time and re-measured whenever the banner's own size
    // changes (font load, text reflow, viewport width), not per-frame.
    setHeight(banner.offsetHeight);

    var resizeObserver = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(function (entries) {
        var entry = entries[0];
        if (!entry) return;
        var height = (entry.borderBoxSize && entry.borderBoxSize[0] && entry.borderBoxSize[0].blockSize)
          || banner.offsetHeight;
        setHeight(height);
      });
      resizeObserver.observe(banner);
    } else {
      window.addEventListener("resize", function () {
        setHeight(banner.offsetHeight);
      });
    }

    var closeBtn = banner.querySelector(".lang-nudge__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        try { localStorage.setItem(DISMISS_KEY, "1"); } catch (_) {}
        banner.setAttribute("hidden", "");
        document.body.classList.remove("has-lang-nudge");
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
