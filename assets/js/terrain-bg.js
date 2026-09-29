/**
 * terrain-bg.js — a subtle, full-viewport topographic contour texture
 * behind the page content. Perlin-noise terrain, marching-squares
 * contour lines, redrawn on theme change and resize. A new random seed
 * each page load gives a different (but equally subtle) terrain.
 *
 * Tuned deliberately faint: this is a background texture for an
 * academic site, not a feature. If it's fighting for attention, the
 * settings below are wrong — go quieter, not louder.
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.id = "terrain-bg";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  // ---- Perlin noise (classic, permutation-table based) -------------
  const basePermutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68,
    175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
    229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
    89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
    198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
    118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
    189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 145, 31, 179,
    228, 167, 215, 221, 214, 11, 12, 222, 114, 67, 29, 24, 72, 243, 141,
    128, 195, 78, 66, 215, 61, 156, 180,
  ];

  const p = new Uint8Array(512);
  function initNoise(seed) {
    const perm = basePermutation.slice();
    // Simple seeded shuffle so each page load gets different terrain.
    let s = seed;
    function rand() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    }
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) {
      p[i] = perm[i % perm.length];
      p[256 + i] = p[i];
    }
  }
  initNoise(Math.floor(Math.random() * 100000));

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(t, a, b) {
    return a + t * (b - a);
  }
  function grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  function perlin2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
    );
  }
  function terrainHeight(x, y, octaves, persistence) {
    let total = 0;
    let freq = 1;
    let amp = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      total += perlin2D(x * freq, y * freq) * amp;
      max += amp;
      amp *= persistence;
      freq *= 2.1;
    }
    return Math.min(1, Math.max(0, (total / max + 1) / 2));
  }

  // ---- Tunables (0.5x scale, 40 bands, full contrast, 2.5px lines,
  //      seeded terrain each load) -----------------------------------
  const SETTINGS = {
    scale: 0.5,
    levels: 40,
    contrast: 0.5,
    lineWidth: 0.5,
    gridStep: 12,
  };

  let heights = null;
  let cols = 0;
  let rows = 0;

  // Fixed palettes, independent of the page's text/border theme
  // variables (those were near-invisible against their own
  // background by design — this needs an actual, distinct hue).
  // Slate-blue in the valleys rising to warm terracotta at the
  // peaks (light theme); teal rising to warm amber (dark theme).
  const PALETTES = {
    light: [
      { h: 0.0, c: [90, 120, 150] },
      { h: 0.55, c: [150, 130, 100] },
      { h: 1.0, c: [175, 95, 60] },
    ],
    dark: [
      { h: 0.0, c: [45, 140, 160] },
      { h: 0.55, c: [110, 150, 150] },
      { h: 1.0, c: [230, 165, 90] },
    ],
  };

  function colorForHeight(h, alpha) {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const stops = dark ? PALETTES.dark : PALETTES.light;

    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (h >= stops[i].h && h <= stops[i + 1].h) {
        a = stops[i];
        b = stops[i + 1];
        break;
      }
    }
    const span = b.h - a.h || 1;
    const t = (h - a.h) / span;
    const r = Math.round(a.c[0] + t * (b.c[0] - a.c[0]));
    const g = Math.round(a.c[1] + t * (b.c[1] - a.c[1]));
    const bl = Math.round(a.c[2] + t * (b.c[2] - a.c[2]));
    return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
  }

  function computeGrid() {
    const step = SETTINGS.gridStep;
    cols = Math.ceil(canvas.width / step) + 1;
    rows = Math.ceil(canvas.height / step) + 1;
    const noiseScale = 0.0016 / SETTINGS.scale;
    heights = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        heights[r * cols + c] = terrainHeight(c * step * noiseScale, r * step * noiseScale, 4, 0.5);
      }
    }
  }

  function render() {
    if (!heights) return;
    const step = SETTINGS.gridStep;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let lvl = 1; lvl < SETTINGS.levels; lvl++) {
      const threshold = lvl / SETTINGS.levels;
      const isIndex = lvl % 5 === 0;
      ctx.beginPath();
      ctx.lineWidth = isIndex ? SETTINGS.lineWidth * 1.6 : SETTINGS.lineWidth;
      const alpha = (isIndex ? 1 : 0.6) * SETTINGS.contrast;
      ctx.strokeStyle = colorForHeight(threshold, alpha);

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const h0 = heights[r * cols + c];
          const h1 = heights[r * cols + (c + 1)];
          const h3 = heights[(r + 1) * cols + c];
          const x = c * step;
          const y = r * step;

          if ((h0 < threshold) !== (h1 < threshold)) {
            const t = (threshold - h0) / (h1 - h0);
            ctx.moveTo(x + t * step, y);
            ctx.lineTo(x + t * step, y + step * 0.5);
          }
          if ((h0 < threshold) !== (h3 < threshold)) {
            const t = (threshold - h0) / (h3 - h0);
            ctx.moveTo(x, y + t * step);
            ctx.lineTo(x + step * 0.5, y + t * step);
          }
        }
      }
      ctx.stroke();
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeGrid();
    render();
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // Redraw with the new palette when the theme changes.
  const observer = new MutationObserver(() => render());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
})();
