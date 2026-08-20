import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateThemeWithAi } from "@/lib/ai.functions";
import { usedFields } from "@/builder/runtime/generate";
import { STYLE_PRESETS, themeForStyle, type ThemeConfig, type TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";

const COLORS: [keyof ThemeConfig, string][] = [
  ["background", "Background"],
  ["surface", "Surface"],
  ["text", "Text"],
  ["muted", "Muted"],
  ["accent", "Accent"],
  ["accentText", "Accent text"],
  ["border", "Border"],
];

const FONTS = [
  "'Inter', system-ui, sans-serif",
  "'Playfair Display', Georgia, serif",
  "'Cormorant Garamond', Georgia, serif",
  "'Libre Baskerville', Georgia, serif",
  "'JetBrains Mono', ui-monospace, monospace",
];

export function PropertiesPane({
  template,
  onPatch,
}: {
  template: TemplateRecord;
  onPatch: (patch: Partial<TemplateRecord>) => void;
}) {
  const { t } = useI18n();
  const runAi = useServerFn(generateThemeWithAi);
  const [prompt, setPrompt] = useState(template.styleDescription);
  const [busy, setBusy] = useState(false);

  const theme = template.theme;
  const setTheme = (patch: Partial<ThemeConfig>) => onPatch({ theme: { ...theme, ...patch } });

  async function generate() {
    setBusy(true);
    try {
      const result = await runAi({
        data: {
          cardType: template.cardType,
          styleDescription: prompt || template.styleDescription || theme.style,
          stylePreset: theme.style,
          sectionIds: template.sectionOrder,
          usedFieldKeys: usedFields(template).map((f) => f.key),
          referenceNotes: template.reference.notes ?? "",
          direction: template.direction,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { sectionOrder, rationale, ...next } = result.theme;
      onPatch({
        theme: { ...theme, ...next },
        sectionOrder,
        styleDescription: prompt || template.styleDescription,
      });
      toast.success("Theme generated", { description: rationale });
    } catch (error) {
      console.error(error);
      toast.error("AI generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {t("properties")}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-3">
        <section className="space-y-2 rounded-lg border border-border bg-card p-3">
          <Label htmlFor="aiPrompt" className="text-xs">
            {t("aiGenerate")}
          </Label>
          <Textarea
            id="aiPrompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-xs"
            placeholder="Luxury real-estate card, dark green, gold accents, serif headings"
          />
          <Button size="sm" className="w-full gap-2" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {busy ? "Generating…" : t("aiGenerate")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            AI changes visual theme and section order only. API keys stay locked to the contract.
          </p>
        </section>

        <section className="space-y-2">
          <Label className="text-xs">Style preset</Label>
          <div className="flex flex-wrap gap-1">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => onPatch({ theme: themeForStyle(preset) })}
                className={`rounded border px-2 py-1 text-[11px] transition-colors ${
                  theme.style === preset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs">Colors</Label>
          {COLORS.map(([key, label]) => (
            <div key={String(key)} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={label}
                value={String(theme[key])}
                onChange={(e) => setTheme({ [key]: e.target.value } as Partial<ThemeConfig>)}
                className="size-7 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="flex-1 text-xs text-muted-foreground">{label}</span>
              <Input
                value={String(theme[key])}
                onChange={(e) => setTheme({ [key]: e.target.value } as Partial<ThemeConfig>)}
                className="h-7 w-24 font-mono text-[11px]"
              />
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Heading font</Label>
            <select
              value={theme.headingFont}
              onChange={(e) => setTheme({ headingFont: e.target.value })}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {[...new Set([theme.headingFont, ...FONTS])].map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Body font</Label>
            <select
              value={theme.bodyFont}
              onChange={(e) => setTheme({ bodyFont: e.target.value })}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {[...new Set([theme.bodyFont, ...FONTS])].map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Corner radius · {theme.radius}px</Label>
            <input
              type="range"
              min={0}
              max={40}
              value={theme.radius}
              onChange={(e) => setTheme({ radius: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          {(
            [
              ["density", ["compact", "regular", "roomy"]],
              ["heroStyle", ["cover", "portrait", "framed", "none"]],
              ["contactStyle", ["floating", "inline", "list"]],
            ] as const
          ).map(([key, options]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
              <div className="flex gap-1">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setTheme({ [key]: option } as Partial<ThemeConfig>)}
                    className={`flex-1 rounded border px-1 py-1 text-[10px] transition-colors ${
                      theme[key] === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Hero image · crop &amp; fit
            </Label>
            <div className="space-y-1">
              <Label className="text-xs">Fit</Label>
              <div className="flex gap-1">
                {(["cover", "contain"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTheme({ heroImageFit: option })}
                    className={`flex-1 rounded border px-1 py-1 text-[10px] transition-colors ${
                      (theme.heroImageFit ?? "cover") === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Focal point</Label>
              <div className="flex gap-1">
                {(["top", "center", "bottom"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTheme({ heroImageFocus: option })}
                    className={`flex-1 rounded border px-1 py-1 text-[10px] transition-colors ${
                      (theme.heroImageFocus ?? "center") === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zoom · {(theme.heroImageZoom ?? 1).toFixed(2)}x</Label>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.02}
                value={theme.heroImageZoom ?? 1}
                onChange={(e) => setTheme({ heroImageZoom: Number(e.target.value) })}
                className="w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <Label htmlFor="upper" className="text-xs">
              Uppercase labels
            </Label>
            <button
              id="upper"
              role="switch"
              aria-checked={theme.uppercaseLabels}
              onClick={() => setTheme({ uppercaseLabels: !theme.uppercaseLabels })}
              className={`relative h-5 w-9 rounded-full border transition-colors ${
                theme.uppercaseLabels ? "border-primary bg-primary" : "border-border bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 size-3.5 rounded-full bg-background transition-all ${
                  theme.uppercaseLabels ? "left-4.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs">Direction</Label>
          <div className="flex gap-1">
            {(["rtl", "ltr", "both", "auto"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => onPatch({ direction: dir })}
                className={`flex-1 rounded border px-1 py-1 font-mono text-[10px] uppercase transition-colors ${
                  template.direction === dir
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
