/*
* Smooth scroll from the hero's "See my projects" cue down to the portfolio.
*/

(function () {
  "use strict";

  var link = document.querySelector(".scroll-down");
  var target = document.getElementById("main");
  if (!link || !target) return;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  link.addEventListener("click", function (e) {
    e.preventDefault();

    var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);

    try {
      window.scrollTo({ top: top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    } catch (err) {
      // Older browsers: no options object, so jump straight there.
      window.scrollTo(0, top);
    }
  });
})();
