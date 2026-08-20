import type { TemplateRecord } from "../types";
import { generateRealEstateLuxuryCss } from "./real-estate-luxury-css";

/**
 * Stylesheet for the Cars Luxury mobile card layout.
 * Shares every token, radius and shadow with the Real Estate Luxury card so both
 * templates read as one Z Card family; only the hero composition differs
 * (landscape floating vehicle image instead of a portrait property thumb).
 */
export function generateCarsLuxuryCss(template: TemplateRecord): string {
  const fit = template.theme.heroImageFit ?? "cover";
  const focusMap = { top: "50% 18%", center: "50% 50%", bottom: "50% 82%" } as const;
  const focus = focusMap[template.theme.heroImageFocus ?? "center"];
  const zoom = template.theme.heroImageZoom ?? 1;
  return `${generateRealEstateLuxuryCss(template)}
/* ---------- cars layout ---------- */
.zc-root--cars {
  --zc-hero-fit: ${fit};
  --zc-hero-focus: ${focus};
  --zc-hero-zoom: ${zoom};
}

/* image loading placeholder (shimmer until the asset is decoded) */
.zc-img--loading {
  background-color: #f1f1f1;
  background-image: linear-gradient(100deg, #f1f1f1 20%, #fafafa 42%, #f1f1f1 64%);
  background-size: 260% 100%;
  animation: zc-shimmer 1.15s linear infinite;
}
.zc-img--loading.zc-hero__carimg { min-height: 150px; }
.zc-img--error { background: var(--zc-card); }
@keyframes zc-shimmer {
  0% { background-position: 130% 0; }
  100% { background-position: -130% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .zc-img--loading { animation: none; }
}

.zc-qr__canvas { width: 232px; height: 232px; display: block; image-rendering: pixelated; border-radius: 8px; }

.zc-qr__copy {
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 11px 22px;
  border-radius: 999px;
  color: #111111;
  background: var(--zc-gold, #d4af37);
}

.zc-root--cars { padding-bottom: 140px; }

.zc-hero--cars .zc-hero__cover {
  height: calc(330px - (var(--p) * 150px));
  background: linear-gradient(170deg, #1b1b1b 0%, #4a4a4a 44%, #ffffff 100%);
}
.zc-hero--cars .zc-hero__coverimg { opacity: calc(0.9 - (var(--p) * 0.5)); }
.zc-hero--cars .zc-hero__scrim {
  background: linear-gradient(to bottom, rgba(17,17,17,0.28) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0.98) 100%);
}
.zc-hero__car {
  --p: 0;
  position: absolute;
  inset-inline: 6%;
  bottom: 8px;
  display: flex;
  justify-content: center;
  transform: scale(calc(1 - (var(--p) * 0.22))) translateY(calc(var(--p) * -14px));
  opacity: calc(1 - (var(--p) * 0.25));
  transition: opacity 0.12s linear;
  will-change: transform;
}
.zc-hero__carimg {
  width: 100%;
  height: clamp(140px, 42vw, 200px);
  max-height: 200px;
  object-fit: var(--zc-hero-fit, cover);
  object-position: var(--zc-hero-focus, 50% 50%);
  transform: scale(var(--zc-hero-zoom, 1));
  border-radius: 28px;
  filter: drop-shadow(0 26px 34px rgba(17, 17, 17, 0.34));
}
.zc-hero--cars .zc-hero__coverimg {
  object-position: var(--zc-hero-focus, 50% 50%);
}

.zc-sticky__thumb--car {
  width: 46px; height: 34px;
  border-radius: 12px;
  object-fit: contain;
  background: var(--zc-card);
}

.zc-hero--cars .zc-hero__body {
  margin-top: 4px;
  align-items: flex-start;
  text-align: start;
  gap: 9px;
  padding: 0 22px 24px;
}
.zc-hero__tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.zc-vpill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: var(--zc-shadow-soft);
  font-size: 12px; font-weight: 600;
}
.zc-vpill__ico { width: 14px; height: 14px; color: var(--zc-gold); }

.zc-hero--cars .zc-hero__title { font-size: 29px; line-height: 1.16; }
.zc-hero--cars .zc-hero__price { margin: 0; font-size: 22px; }
.zc-hero--cars .zc-hero__meta { justify-content: flex-start; gap: 14px; row-gap: 6px; }
.zc-hero__metaitem { font-size: 13.5px; color: var(--zc-muted); }
.zc-hero__metaitem--ico { display: inline-flex; align-items: center; gap: 6px; color: var(--zc-text); }
.zc-hero__metaitem--ico svg { width: 16px; height: 16px; color: var(--zc-gold); }
.zc-hero--cars .zc-hero__loc {
  display: inline-flex; align-items: center; gap: 6px;
  margin: 0;
  font-size: 13.5px; color: var(--zc-muted);
}
.zc-hero--cars .zc-hero__loc svg { width: 15px; height: 15px; color: var(--zc-gold); }
.zc-hero--cars .zc-hero__desc { max-width: none; margin: 4px 0 0; }

.zc-root--cars .zc-chip { display: inline-flex; align-items: center; gap: 7px; }
.zc-chip__ico { width: 13px; height: 13px; color: var(--zc-gold); flex: none; }

.zc-agent__namerow { display: flex; align-items: center; gap: 7px; }
.zc-agent__check {
  width: 18px; height: 18px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--zc-gold);
  color: #ffffff;
}
.zc-agent__check svg { width: 11px; height: 11px; }

.zc-root--cars .zc-social { gap: 10px; }
.zc-root--cars .zc-social__item {
  width: 46px; height: 46px;
  border: 0;
  border-radius: 999px;
  background: var(--zc-card);
  color: var(--zc-text);
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: var(--zc-shadow-soft);
  transition: transform 0.22s var(--zc-ease);
}
.zc-root--cars .zc-social__item:active { transform: scale(0.94); }
.zc-root--cars .zc-social__item svg { width: 19px; height: 19px; color: var(--zc-gold); }
.zc-social__txt { font-size: 13px; font-weight: 700; letter-spacing: 0.01em; }
`;
}
