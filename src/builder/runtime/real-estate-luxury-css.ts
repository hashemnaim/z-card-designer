import type { TemplateRecord } from "../types";

/**
 * Standalone stylesheet for the Real Estate Luxury mobile card layout.
 * White canvas, #F8F8F8 cards, luxury gold accent, 28px radii, no borders.
 */
export function generateRealEstateLuxuryCss(template: TemplateRecord): string {
  const t = template.theme;
  const gold = t.accent || "#D4AF37";
  const heading = t.headingFont || "'Playfair Display', Georgia, serif";
  const body = t.bodyFont || "'Inter', system-ui, sans-serif";
  const bg = t.background || "#ffffff";
  const card = t.surface || "#f8f8f8";
  const text = t.text || "#111111";
  const muted = t.muted || "#777777";
  const radius = Math.max(0, Math.min(40, Number(t.radius ?? 28)));
  const radiusSm = Math.max(0, Math.round(radius * 0.64));
  const gap = t.density === "compact" ? 10 : t.density === "roomy" ? 22 : 16;
  const labelCase = t.uppercaseLabels ? "uppercase" : "none";

  return `/* ${template.id} — Z Card Real Estate Luxury card (standalone, mobile 9:19) */
:root {
  --zc-bg: ${bg};
  --zc-card: ${card};
  --zc-gold: ${gold};
  --zc-gold-soft: color-mix(in srgb, ${gold} 12%, ${bg});
  --zc-text: ${text};
  --zc-muted: ${muted};
  --zc-radius: ${radius}px;
  --zc-radius-sm: ${radiusSm}px;
  --zc-gap: ${gap}px;
  --zc-label-case: ${labelCase};
  --zc-shadow: 0 18px 46px -22px color-mix(in srgb, ${text} 24%, transparent);
  --zc-shadow-soft: 0 10px 30px -18px color-mix(in srgb, ${text} 20%, transparent);
  --zc-heading: ${heading};
  --zc-body: ${body};
  --zc-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
}


* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--zc-bg); }
body {
  font-family: var(--zc-body);
  color: var(--zc-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }

.zc-root {
  position: relative;
  max-width: 460px;
  margin: 0 auto;
  padding-bottom: 132px;
  background: var(--zc-bg);
}

/* ---------- sticky glass header ---------- */
.zc-sticky {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 40;
  display: flex;
  justify-content: center;
  padding: 10px 14px;
  opacity: 0;
  transform: translateY(-14px);
  pointer-events: none;
  transition: opacity 0.36s var(--zc-ease), transform 0.36s var(--zc-ease);
}
.zc-sticky.is-on { opacity: 1; transform: none; pointer-events: auto; }
.zc-sticky__in {
  width: 100%;
  max-width: 432px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(22px) saturate(180%);
  box-shadow: var(--zc-shadow-soft);
}
.zc-sticky__thumb { width: 40px; height: 40px; border-radius: 999px; object-fit: cover; flex: none; }
.zc-sticky__col { display: flex; flex-direction: column; min-width: 0; }
.zc-sticky__title {
  font-family: var(--zc-heading);
  font-size: 14px;
  letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.zc-sticky__price { font-size: 12px; color: var(--zc-gold); font-weight: 600; letter-spacing: 0.01em; }

/* ---------- hero ---------- */
.zc-hero { position: relative; }
.zc-hero__cover {
  --p: 0;
  position: relative;
  height: calc(300px - (var(--p) * 130px));
  overflow: hidden;
  border-bottom-left-radius: var(--zc-radius);
  border-bottom-right-radius: var(--zc-radius);
  background: var(--zc-card);
  will-change: height;
}
.zc-hero__coverimg {
  width: 100%; height: 100%;
  object-fit: cover;
  transform: scale(calc(1 + (var(--p) * 0.06)));
  opacity: calc(1 - (var(--p) * 0.35));
  transition: opacity 0.12s linear;
}
.zc-hero__scrim {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(17,17,17,0.16) 0%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.96) 100%);
}
.zc-hero__body {
  position: relative;
  margin-top: -46px;
  padding: 0 22px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.zc-hero__float {
  --p: 0;
  position: relative;
  width: 96px; height: 96px;
  border-radius: 30px;
  padding: 5px;
  background: #ffffff;
  box-shadow: var(--zc-shadow);
  transform: scale(calc(1 - (var(--p) * 0.18))) translateY(calc(var(--p) * -8px));
  opacity: calc(1 - (var(--p) * 0.15));
  will-change: transform;
}
.zc-hero__floatimg { width: 100%; height: 100%; border-radius: 25px; object-fit: cover; }
.zc-verified {
  position: absolute;
  inset-inline-end: -4px;
  bottom: -4px;
  width: 28px; height: 28px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--zc-gold);
  color: #ffffff;
  box-shadow: 0 6px 16px -6px rgba(212, 175, 55, 0.9);
}
.zc-verified svg { width: 15px; height: 15px; }

.zc-status {
  margin-top: 4px;
  padding: 5px 14px;
  border-radius: 999px;
  background: var(--zc-gold-soft);
  color: color-mix(in srgb, var(--zc-gold) 78%, #111111);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.zc-hero__title {
  margin: 2px 0 0;
  font-family: var(--zc-heading);
  font-size: 27px;
  line-height: 1.2;
  letter-spacing: -0.015em;
}
.zc-hero__meta {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  gap: 10px;
  font-size: 13px; color: var(--zc-muted);
}
.zc-hero__type { position: relative; }
.zc-hero__loc { display: inline-flex; align-items: center; gap: 5px; }
.zc-hero__loc svg { width: 14px; height: 14px; }
.zc-hero__price {
  margin: 6px 0 0;
  font-family: var(--zc-heading);
  font-size: 21px;
  font-weight: 600;
  color: color-mix(in srgb, var(--zc-gold) 82%, #111111);
  letter-spacing: 0.01em;
}
.zc-hero__desc {
  margin: 2px 0 6px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--zc-muted);
  max-width: 34ch;
}

/* ---------- buttons ---------- */
.zc-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 50px;
  width: 100%;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 15px; font-weight: 600;
  transition: transform 0.24s var(--zc-ease), box-shadow 0.24s var(--zc-ease);
}
.zc-btn:active { transform: scale(0.975); }
.zc-btn--gold {
  background: linear-gradient(135deg, color-mix(in srgb, var(--zc-gold) 88%, #ffffff), var(--zc-gold));
  color: #ffffff;
  box-shadow: 0 14px 30px -14px rgba(212, 175, 55, 0.75);
}
.zc-btn--ghost { background: var(--zc-card); color: var(--zc-text); }

/* ---------- accordions ---------- */
.zc-sections { display: flex; flex-direction: column; gap: 12px; padding: 4px 18px 0; }
.zc-acc {
  border-radius: var(--zc-radius);
  background: var(--zc-card);
  overflow: hidden;
  transition: background 0.3s var(--zc-ease), box-shadow 0.3s var(--zc-ease);
}
.zc-acc.is-open { background: #ffffff; box-shadow: var(--zc-shadow-soft); }
.zc-acc__head {
  width: 100%;
  display: flex; align-items: center; gap: 13px;
  padding: 17px 18px;
  text-align: start;
}
.zc-acc__ico {
  width: 38px; height: 38px; flex: none;
  border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #ffffff;
  color: var(--zc-gold);
  box-shadow: var(--zc-shadow-soft);
}
.zc-acc.is-open .zc-acc__ico { background: var(--zc-gold-soft); }
.zc-acc__ico svg { width: 18px; height: 18px; }
.zc-acc__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.zc-acc__title { font-family: var(--zc-heading); font-size: 15px; letter-spacing: -0.005em; }
.zc-acc__preview {
  font-size: 12px; color: var(--zc-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.zc-acc.is-open .zc-acc__preview { opacity: 0; height: 0; }
.zc-acc__chev { color: var(--zc-muted); display: inline-flex; transition: transform 0.34s var(--zc-ease); }
.zc-acc__chev svg { width: 18px; height: 18px; }
.zc-acc.is-open .zc-acc__chev { transform: rotate(180deg); color: var(--zc-gold); }
.zc-acc__panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.42s var(--zc-ease);
}
.zc-acc__inner { padding: 0 18px 20px; }
.zc-stack { display: flex; flex-direction: column; gap: 12px; }

/* ---------- overview stats ---------- */
.zc-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.zc-stat {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 14px;
  border-radius: var(--zc-radius-sm);
  background: var(--zc-card);
}
.zc-acc.is-open .zc-stat { background: #fafafa; }
.zc-stat__ico { color: var(--zc-gold); display: inline-flex; }
.zc-stat__ico svg { width: 18px; height: 18px; }
.zc-stat__col { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.zc-stat__label { font-size: 11px; color: var(--zc-muted); letter-spacing: 0.02em; }
.zc-stat__value { font-size: 15px; font-weight: 600; }
.zc-ready {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 15px;
  border-radius: 999px;
  background: var(--zc-gold-soft);
  color: color-mix(in srgb, var(--zc-gold) 76%, #111111);
  font-size: 12px; font-weight: 600;
}
.zc-ready__ico { width: 15px; height: 15px; }

/* ---------- chips ---------- */
.zc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.zc-chip {
  padding: 9px 15px;
  border-radius: 999px;
  background: var(--zc-card);
  font-size: 13px;
}
.zc-acc.is-open .zc-chip { background: #fafafa; }

/* ---------- description ---------- */
.zc-prose { margin: 0; font-size: 14px; line-height: 1.8; color: var(--zc-muted); }
.zc-prose.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.zc-more {
  align-self: flex-start;
  padding: 0;
  font-size: 13px; font-weight: 600;
  color: var(--zc-gold);
}

/* ---------- gallery ---------- */
.zc-slider {
  display: flex; gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.zc-slider::-webkit-scrollbar { display: none; }
.zc-slide {
  flex: 0 0 62%;
  aspect-ratio: 4 / 3;
  border-radius: var(--zc-radius-sm);
  overflow: hidden;
  scroll-snap-align: start;
  background: var(--zc-card);
  padding: 0;
}
.zc-slide__img { width: 100%; height: 100%; object-fit: cover; }

/* ---------- video ---------- */
.zc-video {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  border-radius: var(--zc-radius-sm);
  overflow: hidden;
  background: var(--zc-card);
}
.zc-video__img { width: 100%; height: 100%; object-fit: cover; }
.zc-video__play {
  position: absolute; inset: 0; margin: auto;
  width: 62px; height: 62px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  color: var(--zc-text);
  box-shadow: var(--zc-shadow);
}
.zc-video__play svg { width: 26px; height: 26px; }

/* ---------- location ---------- */
.zc-map {
  position: relative;
  display: block;
  height: 132px;
  border-radius: var(--zc-radius-sm);
  overflow: hidden;
  background: linear-gradient(150deg, #f3f3f3, #ececec);
}
.zc-map__grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(17,17,17,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(17,17,17,0.06) 1px, transparent 1px);
  background-size: 26px 26px;
}
.zc-map__pin {
  position: absolute; inset: 0; margin: auto;
  width: 42px; height: 42px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #ffffff;
  color: var(--zc-gold);
  box-shadow: var(--zc-shadow);
}
.zc-map__pin svg { width: 20px; height: 20px; }
.zc-address { display: flex; flex-direction: column; gap: 3px; }
.zc-address__line { font-size: 14px; color: var(--zc-muted); }
.zc-address__line:first-child { color: var(--zc-text); font-weight: 600; }

/* ---------- agent ---------- */
.zc-agent { display: flex; align-items: center; gap: 14px; }
.zc-agent__photo { width: 62px; height: 62px; border-radius: 999px; object-fit: cover; box-shadow: var(--zc-shadow-soft); }
.zc-agent__col { display: flex; flex-direction: column; gap: 2px; }
.zc-agent__name { font-family: var(--zc-heading); font-size: 16px; }
.zc-agent__title { font-size: 13px; color: var(--zc-muted); }
.zc-agent__company { font-size: 12px; color: var(--zc-gold); font-weight: 600; }
.zc-agent__actions { display: flex; gap: 8px; }
.zc-agent__actions .zc-act { flex: 1; }

/* ---------- action button ---------- */
.zc-act {
  display: inline-flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 8px 6px;
  border-radius: var(--zc-radius-sm);
  transition: transform 0.22s var(--zc-ease);
}
.zc-act:active { transform: scale(0.94); }
.zc-act__ico {
  width: 40px; height: 40px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--zc-gold-soft);
  color: color-mix(in srgb, var(--zc-gold) 80%, #111111);
}
.zc-act__ico svg { width: 18px; height: 18px; }
.zc-act__txt { font-size: 11px; color: var(--zc-muted); }

/* ---------- floating action bar ---------- */
.zc-bar {
  position: fixed;
  bottom: 14px; left: 0; right: 0;
  z-index: 45;
  display: flex; justify-content: center;
  padding: 0 16px;
  pointer-events: none;
}
.zc-bar__in {
  width: 100%; max-width: 424px;
  display: flex; justify-content: space-between; gap: 2px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 0 20px 48px -20px rgba(17, 17, 17, 0.34);
  pointer-events: auto;
}
.zc-bar .zc-act { flex: 1; padding: 2px 0; }
.zc-bar .zc-act__ico { width: 36px; height: 36px; background: #ffffff; }
.zc-bar .zc-act__txt { font-size: 10px; }

/* ---------- overlays ---------- */
.zc-overlay {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center;
  padding: 22px;
  background: rgba(17, 17, 17, 0.72);
  backdrop-filter: blur(16px);
  opacity: 0;
  transition: opacity 0.24s var(--zc-ease);
}
.zc-overlay.is-on { opacity: 1; }
.zc-overlay__close {
  position: absolute; top: 16px; inset-inline-end: 18px;
  width: 38px; height: 38px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #111111;
  font-size: 15px;
}
.zc-overlay__body { width: 100%; }
.zc-lightbox {
  display: flex; gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.zc-lightbox::-webkit-scrollbar { display: none; }
.zc-lightbox__cell {
  flex: 0 0 100%;
  scroll-snap-align: center;
  border-radius: var(--zc-radius);
  overflow: hidden;
}
.zc-lightbox__img { width: 100%; max-height: 70vh; object-fit: cover; }
.zc-qr { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.zc-qr__frame { padding: 16px; border-radius: var(--zc-radius); background: #ffffff; box-shadow: var(--zc-shadow); }
.zc-qr__img { width: 208px; height: 208px; }
.zc-qr__caption { margin: 0; color: rgba(255,255,255,0.86); font-size: 14px; text-align: center; }

.zc-toast {
  position: fixed; bottom: 96px; left: 50%;
  transform: translate(-50%, 12px);
  z-index: 70;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.9);
  color: #ffffff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.26s var(--zc-ease), transform 0.26s var(--zc-ease);
}
.zc-toast.is-on { opacity: 1; transform: translate(-50%, 0); }

/* theme-driven typography casing (Properties → Uppercase labels) */
.zc-acc__title, .zc-spec__label, .zc-label { text-transform: var(--zc-label-case, none); }

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
`;
}
