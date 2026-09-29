/**
 * theme.js — light / dark / system theme switcher.
 *
 * The theme is applied as early as possible (this script is loaded
 * synchronously in <head>, not deferred) so there's no flash of the
 * wrong theme on load. The dropdown wiring waits for the DOM as usual.
 */
(function () {
  const STORAGE_KEY = "theme-preference";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function getPref() {
    return localStorage.getItem(STORAGE_KEY) || "system";
  }

  function effectiveTheme(pref) {
    return pref === "system" ? (media.matches ? "dark" : "light") : pref;
  }

  function applyTheme(pref) {
    root.setAttribute("data-theme", effectiveTheme(pref));
  }

  // Apply immediately — this runs before <body> paints.
  applyTheme(getPref());

  media.addEventListener("change", () => {
    if (getPref() === "system") applyTheme("system");
  });

  function init() {
    const trigger = document.getElementById("theme-trigger");
    const menu = document.getElementById("theme-menu");
    if (!trigger || !menu) return;

    function updateActiveOption() {
      const pref = getPref();
      menu.querySelectorAll(".theme-option").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.themeChoice === pref);
      });
    }

    let closeTimer = null;

    function openMenu() {
      clearTimeout(closeTimer);
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      trigger.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      closeTimer = setTimeout(() => {
        menu.hidden = true;
      }, 200);
    }

    updateActiveOption();

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    menu.querySelectorAll(".theme-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEY, btn.dataset.themeChoice);
        applyTheme(btn.dataset.themeChoice);
        updateActiveOption();
        closeMenu();
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.hidden && !e.target.closest(".theme-switcher")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) closeMenu();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
