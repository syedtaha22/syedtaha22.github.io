/**
 * project-carousel.js — a small, dependency-free carousel for the
 * "Things I've built" panel. Supports click, keyboard arrows (when
 * focused), touch swipe, and autoplay.
 *
 * Looping is done with clone slides: a copy of the first slide is
 * appended after the last, and a copy of the last slide is prepended
 * before the first. Moving "next" past the real last slide always
 * continues sliding forward onto that clone; once the transition ends
 * we silently (no animation) snap the track back to the real first
 * slide, which sits at the identical visual position. Same idea in
 * reverse for "prev" past the first slide. This is what keeps the
 * motion going the same direction the whole way around instead of
 * visibly reversing through every slide to wrap back to the start.
 *
 * The container height is fixed to the tallest real slide (measured
 * once, after images load) so switching slides never shifts the
 * arrows, dots, or anything below the carousel.
 */
(function () {
  const wrap = document.querySelector(".carousel-wrap");
  const root = document.getElementById("project-carousel");
  if (!root || !wrap) return;

  const track = document.getElementById("carousel-track");
  const realSlides = Array.from(track.children);
  const n = realSlides.length;
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  const dotsWrap = document.getElementById("carousel-dots");

  if (n === 0) return;

  // Clone last -> prepend, clone first -> append.
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[n - 1].cloneNode(true);
  firstClone.setAttribute("aria-hidden", "true");
  lastClone.setAttribute("aria-hidden", "true");
  track.appendChild(firstClone);
  track.insertBefore(lastClone, realSlides[0]);

  // Track positions: 0 = clone-of-last, 1..n = real slides, n+1 = clone-of-first.
  let pos = 1;
  const AUTOPLAY_MS = 6000;
  let autoplayTimer = null;

  realSlides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1} of ${n}`);
    dot.addEventListener("click", () => {
      goToReal(i);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function measureMaxHeight() {
    let max = 0;
    realSlides.forEach((s) => {
      max = Math.max(max, s.offsetHeight);
    });
    return max;
  }
  function applyFixedHeight() {
    root.style.height = `${measureMaxHeight()}px`;
  }

  function updateDots() {
    // Real slide index for track position pos: 1..n -> 0..n-1.
    // For the clone positions (0 or n+1) show the dot for the slide
    // that clone visually represents (last or first, respectively).
    let realIndex;
    if (pos === 0) realIndex = n - 1;
    else if (pos === n + 1) realIndex = 0;
    else realIndex = pos - 1;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === realIndex));
  }

  function setTransform(withTransition) {
    track.style.transition = withTransition
      ? ""
      : "none";
    track.style.transform = `translateX(-${pos * 100}%)`;
  }

  function goToPos(newPos) {
    pos = newPos;
    setTransform(true);
    updateDots();
  }

  function goToReal(i) {
    goToPos(i + 1);
  }

  function next() {
    goToPos(pos + 1);
  }
  function prev() {
    goToPos(pos - 1);
  }

  // After a transition onto a clone, snap invisibly to the matching
  // real slide at the same visual position.
  track.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    if (pos === n + 1) {
      pos = 1;
      setTransform(false);
      updateDots();
      // Force reflow so the next transform change (if any) animates
      // again instead of being merged with this instant jump.
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight;
    } else if (pos === 0) {
      pos = n;
      setTransform(false);
      updateDots();
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight;
    }
  });

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  function restartAutoplay() {
    startAutoplay();
  }

  window.addEventListener("resize", () => {
    setTransform(false);
    applyFixedHeight();
  });

  prevBtn.addEventListener("click", () => {
    prev();
    restartAutoplay();
  });
  nextBtn.addEventListener("click", () => {
    next();
    restartAutoplay();
  });

  root.setAttribute("tabindex", "0");
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prev();
      restartAutoplay();
    }
    if (e.key === "ArrowRight") {
      next();
      restartAutoplay();
    }
  });

  let startX = null;
  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  track.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
      restartAutoplay();
    }
    startX = null;
  });

  // Pause autoplay while the pointer or keyboard focus is anywhere
  // near the carousel, resume when it leaves.
  wrap.addEventListener("mouseenter", stopAutoplay);
  wrap.addEventListener("mouseleave", startAutoplay);
  wrap.addEventListener("focusin", stopAutoplay);
  wrap.addEventListener("focusout", startAutoplay);

  // Initial paint: position at the first real slide with no animation.
  setTransform(false);
  updateDots();
  applyFixedHeight();

  // Images load asynchronously; re-measure once they're all in so the
  // fixed height accounts for the tallest slide correctly.
  const images = Array.from(track.querySelectorAll("img"));
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener("load", applyFixedHeight, { once: true });
    }
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    startAutoplay();
  }
})();
