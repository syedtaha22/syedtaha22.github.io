"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

const AUTOPLAY_MS = 6000;

const pad = (n: number) => String(n).padStart(2, "0");

function Slide({ project, index, total, clone }: { project: Project; index: number; total: number; clone?: boolean }) {
  const { title, meta, body, link } = project;
  const label = `${pad(index + 1)} / ${pad(total)}`;
  const external = link && /^https?:/.test(link.href);
  const linkEl =
    link &&
    (external ? (
      <a href={link.href}>{link.label}</a>
    ) : (
      <Link href={link.href}>{link.label}</Link>
    ));

  return (
    <article
      className="carousel-slide"
      aria-hidden={clone || undefined}
      inert={clone || undefined}
    >
      <div className="slide-text">
        <span className="slide-index">{label}</span>
        <h3>{title}</h3>
        <p className="slide-meta">{meta}</p>
        <p>{body}</p>
        {linkEl && <p className="links">{linkEl}</p>}
      </div>
    </article>
  );
}

/**
 * Looping carousel. Looping uses clone slides: a copy of the last slide
 * sits before the first, and a copy of the first sits after the last.
 * Moving past either end slides onto the clone, then (once the
 * transition ends) snaps without animation to the matching real slide,
 * which sits at the identical visual position. Motion keeps going the
 * same direction instead of visibly rewinding through every slide.
 *
 * Track positions: 0 = clone of last, 1..n = real slides, n+1 = clone of first.
 *
 * The container height is fixed to the tallest real slide so switching
 * slides never shifts the arrows, dots, or anything below.
 */
export default function ProjectCarousel({ projects }: { projects: Project[] }) {
  const n = projects.length;
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [paused, setPaused] = useState(false);
  // Bumped on any manual navigation so the autoplay timer restarts.
  const [autoplayEpoch, setAutoplayEpoch] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) => {
      setAnimate(true);
      setPos((p) => Math.min(n + 1, Math.max(0, p + dir)));
    },
    [n]
  );

  const goToReal = (i: number) => {
    setAnimate(true);
    setPos(i + 1);
    setAutoplayEpoch((e) => e + 1);
  };

  const manual = (dir: 1 | -1) => {
    step(dir);
    setAutoplayEpoch((e) => e + 1);
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, autoplayEpoch, step]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const real = Array.from(track.children).slice(1, n + 1) as HTMLElement[];
    const measure = () => {
      root.style.height = `${Math.max(...real.map((s) => s.offsetHeight))}px`;
    };
    measure();
    // Slide heights change with viewport width, image loads, and font loads.
    const observer = new ResizeObserver(measure);
    real.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [n]);

  // After a transition onto a clone, snap invisibly to the real slide.
  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (pos === n + 1) {
      setAnimate(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimate(false);
      setPos(n);
    }
  };

  const activeIndex = pos === 0 ? n - 1 : pos === n + 1 ? 0 : pos - 1;

  return (
    <div
      className="carousel-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="project-carousel"
        id="project-carousel"
        ref={rootRef}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Selected projects"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") manual(-1);
          if (e.key === "ArrowRight") manual(1);
        }}
      >
        <div
          className="carousel-track"
          id="carousel-track"
          ref={trackRef}
          style={{
            transform: `translateX(-${pos * 100}%)`,
            transition: animate ? undefined : "none",
          }}
          onTransitionEnd={onTransitionEnd}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 40) manual(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          <Slide project={projects[n - 1]} index={n - 1} total={n} clone />
          {projects.map((p, i) => (
            <Slide key={p.title} project={p} index={i} total={n} />
          ))}
          <Slide project={projects[0]} index={0} total={n} clone />
        </div>
      </div>

      <button className="carousel-nav prev" id="carousel-prev" type="button" aria-label="Previous project" onClick={() => manual(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button className="carousel-nav next" id="carousel-next" type="button" aria-label="Next project" onClick={() => manual(1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <div className="carousel-dots" id="carousel-dots">
        {projects.map((p, i) => (
          <button
            key={p.title}
            className={i === activeIndex ? "carousel-dot is-active" : "carousel-dot"}
            type="button"
            aria-label={`Go to slide ${i + 1} of ${n}`}
            onClick={() => goToReal(i)}
          />
        ))}
      </div>
    </div>
  );
}
