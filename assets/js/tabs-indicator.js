/**
 * tabs-indicator.js — a sliding pill behind whichever .tab button is
 * currently active inside a .tabs container. Purely visual: it reads
 * the .is-active class (set by each page's own filter logic) and
 * animates a shared background to match, on click and on resize.
 * Works for any number of .tabs containers on the page.
 */
(function () {
  function attach(container) {
    let indicator = container.querySelector(".tab-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "tab-indicator";
      indicator.setAttribute("aria-hidden", "true");
      container.prepend(indicator);
    }

    const buttons = () => Array.from(container.querySelectorAll(".tab"));

    function moveTo(btn) {
      if (!btn) return;
      indicator.style.width = `${btn.offsetWidth}px`;
      indicator.style.left = `${btn.offsetLeft}px`;
    }

    function currentActive() {
      return container.querySelector(".tab.is-active") || buttons()[0];
    }

    indicator.style.transition = "none";
    moveTo(currentActive());
    requestAnimationFrame(() => {
      indicator.style.transition = "";
    });

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn || !container.contains(btn)) return;
      // Wait a tick so the page's own click handler (which sets
      // .is-active) runs first, then slide to the new active button.
      requestAnimationFrame(() => moveTo(currentActive()));
    });

    window.addEventListener("resize", () => {
      indicator.style.transition = "none";
      moveTo(currentActive());
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    });

    // Expose for scripts that rebuild tabs dynamically (e.g. after
    // fetching data and re-labelling buttons with counts).
    container._refreshTabIndicator = () => moveTo(currentActive());
  }

  function init() {
    document.querySelectorAll(".tabs").forEach(attach);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
