import { useEffect } from "react";
import type { RefObject } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";

function loadSvg(svg: SVGSVGElement, width: number, height: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", SVG_NS);
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  const markup = new XMLSerializer().serializeToString(copy).replaceAll("currentColor", "#000");
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not rasterize icon"));
    };
    image.src = url;
  });
}

/**
 * Cuts the labels (or, where a link shows an icon instead, the icons) of
 * a nav's links out of its glass. The visible content of each link is
 * drawn in black onto a canvas the size of the nav, and the canvas is
 * exposed as `--cutout-image`, with the nav's size as `--nav-w` and
 * `--nav-h`. The `.nav-cutout` CSS class subtracts that image from the
 * element it is applied to.
 *
 * The image is drawn from the rendered layout and the loaded font, so it
 * is rebuilt when the nav or any link changes size and once fonts load.
 */
export function useCutoutMask(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;

    let frame = 0;
    let disposed = false;

    async function build() {
      if (!nav || disposed) return;
      const box = nav.getBoundingClientRect();
      const width = nav.offsetWidth;
      const height = nav.offsetHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#000";

      const icons: Promise<void>[] = [];

      nav.querySelectorAll<HTMLElement>("a").forEach((link) => {
        const label = link.querySelector<HTMLElement>(".nav-label");
        const svg = link.querySelector<SVGSVGElement>(".nav-icon svg");

        if (label && getComputedStyle(label).display !== "none") {
          const rect = label.getBoundingClientRect();
          const style = getComputedStyle(label);
          ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
          ctx.textBaseline = "alphabetic";
          const text = label.textContent ?? "";
          const m = ctx.measureText(text);
          const x = rect.left - box.left;
          const y =
            rect.top - box.top +
            (rect.height + m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
          ctx.fillText(text, x, y);
        } else if (svg && svg.getBoundingClientRect().width > 0) {
          const rect = svg.getBoundingClientRect();
          icons.push(
            loadSvg(svg, rect.width, rect.height)
              .then((image) => {
                ctx.drawImage(image, rect.left - box.left, rect.top - box.top);
              })
              .catch(() => {})
          );
        }
      });

      await Promise.all(icons);
      if (disposed) return;

      nav.style.setProperty("--cutout-image", `url(${canvas.toDataURL("image/png")})`);
      nav.style.setProperty("--nav-w", `${width}px`);
      nav.style.setProperty("--nav-h", `${height}px`);
      nav.dataset.cutout = "ready";
    }

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => void build());
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    nav.querySelectorAll("a").forEach((link) => observer.observe(link));
    document.fonts.ready.then(schedule);
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);
}
