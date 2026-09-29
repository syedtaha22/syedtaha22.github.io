/**
 * nav-indicator.js — positions the accent pill under the current page's
 * nav link. It does NOT follow the cursor on hover: hover gets its own
 * lightweight highlight in CSS (.site-nav a:hover), so the filled pill
 * only ever means "you are here," never "you're about to click here."
 */
(function () {
  function init() {
    const nav = document.getElementById("site-nav");
    if (!nav) return;

    const indicator = nav.querySelector(".nav-indicator");
    const links = Array.from(nav.querySelectorAll("a"));
    if (!indicator || links.length === 0) return;

    const current = nav.querySelector('a[aria-current="page"]') || links[0];
    current.classList.add("is-current");

    function moveTo(el) {
      indicator.style.width = `${el.offsetWidth}px`;
      indicator.style.left = `${el.offsetLeft}px`;
    }

    // Position instantly on load — no slide-in from the corner.
    indicator.style.transition = "none";
    moveTo(current);
    requestAnimationFrame(() => {
      indicator.style.transition = "";
    });

    window.addEventListener("resize", () => {
      indicator.style.transition = "none";
      moveTo(current);
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
