import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  CARD_TYPES,
  CARD_TYPE_LABELS,
  SECTION_LABELS,
  fieldsBySection,
  getContract,
  type CardType,
} from "@/contracts";
import { createTemplate, defaultFieldUsage, idExists, slugify } from "@/builder/store";
import { STYLE_PRESETS, themeForStyle, type Direction, type FieldUsage } from "@/builder/types";
import { humanize } from "@/builder/runtime/generate";
import { useI18n } from "@/lib/i18n";

const USAGES: FieldUsage[] = ["required", "recommended", "optional", "unused"];

const STEP_KEYS = [
  "cardType",
  "style",
  "reference",
  "fields",
  "language",
  "identity",
  "summary",
] as const;

export function Wizard() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [style, setStyle] = useState<string>("Luxury");
  const [styleDescription, setStyleDescription] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refNotes, setRefNotes] = useState("");
  const [refImage, setRefImage] = useState<string | undefined>(undefined);
  const [fieldUsage, setFieldUsage] = useState<Record<string, FieldUsage>>({});
  const [direction, setDirection] = useState<Direction>("rtl");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0.0");

  const contract = cardType ? getContract(cardType) : null;

  const suggested = useMemo(() => {
    if (!cardType) return { name: "", id: "", slug: "" };
    const stylePart = slugify(style || "custom");
    return {
      name: `${style} ${CARD_TYPE_LABELS[cardType].en}`,
      id: `${cardType}-${stylePart}-v1`,
      slug: `${cardType}-${stylePart}`,
    };
  }, [cardType, style]);

  function chooseCardType(type: CardType) {
    setCardType(type);
    setFieldUsage(defaultFieldUsage(type));
  }

  function applySuggested() {
    setName(suggested.name);
    setId(suggested.id);
    setSlug(suggested.slug);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setRefImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  const languages = direction === "ltr" ? ["en"] : direction === "rtl" ? ["ar"] : ["ar", "en"];

  const usedCount = Object.values(fieldUsage).filter((u) => u !== "unused").length;

  const canNext = (() => {
    if (step === 0) return Boolean(cardType);
    if (step === 1) return Boolean(style || styleDescription.trim());
    if (step === 3) return usedCount > 0;
    if (step === 5)
      return (
        Boolean(name.trim()) &&
        /^[a-z0-9-]+$/.test(id) &&
        /^\d+\.\d+\.\d+$/.test(version) &&
        !idExists(id)
      );
    return true;
  })();

  function next() {
    if (step === 4 && !name) applySuggested();
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  }

  function submit() {
    if (!cardType) return;
    const record = createTemplate({
      cardType,
      name: name.trim(),
      id,
      slug: slug || slugify(id),
      version,
      style,
      styleDescription: styleDescription.trim() || style,
      direction,
      languages,
      fieldUsage,
      reference: { imageDataUrl: refImage, url: refUrl.trim(), notes: refNotes.trim() },
      theme: themeForStyle(style),
    });
    toast.success(`Template ${record.id} created`);
    navigate({ to: "/t/$templateId", params: { templateId: record.id } });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex flex-1 items-center gap-2">
            <div
              className={`flex size-6 items-center justify-center rounded-full border font-mono text-[11px] ${
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-3" /> : i + 1}
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {t("step")} {step + 1} / {STEP_KEYS.length}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {t(STEP_KEYS[step] as "cardType")}
      </h1>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {CARD_TYPES.map((type) => {
              const c = getContract(type);
              const active = cardType === type;
              return (
                <button
                  key={type}
                  onClick={() => chooseCardType(type)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="text-2xl">{CARD_TYPE_LABELS[type].icon}</div>
                  <div className="mt-2 font-medium">{CARD_TYPE_LABELS[type][lang]}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{type}</div>
                  <Separator className="my-3" />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      schema: <span className="font-mono">{c.schema_version}</span>
                    </div>
                    <div>
                      {c.fields.length} fields · {c.field_usage.required.length} required
                    </div>
                    <div>{c.sections.length} sections</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setStyle(preset)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    style === preset
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="styleDesc">Custom style description</Label>
              <Textarea
                id="styleDesc"
                rows={5}
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                placeholder="Create a luxury personal digital identity card inspired by Apple Contacts: white background, subtle gold accents, large photography, floating contact buttons and premium typography."
              />
              <p className="text-xs text-muted-foreground">
                Used for AI theme generation in the workspace. It never changes the data contract.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              A reference only guides layout, hierarchy and spacing. The data contract stays
              untouched.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) readFile(file);
                  }}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
                  <ImagePlus className="size-4" />
                  Upload image / screenshot
                </Button>
              </div>
              {refImage && (
                <div className="relative">
                  <img
                    src={refImage}
                    alt="Visual reference"
                    className="h-28 rounded-md border border-border object-cover"
                  />
                  <button
                    onClick={() => setRefImage(undefined)}
                    className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1"
                    aria-label="Remove reference"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="refUrl">Reference URL</Label>
                <Input
                  id="refUrl"
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refNotes">Notes</Label>
                <Input
                  id="refNotes"
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                  placeholder="Large hero, sticky call button, serif headings"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && contract && cardType && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-mono">
                {contract.schema_version}
              </Badge>
              <span>{usedCount} fields used by this design</span>
            </div>
            {fieldsBySection(cardType).map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {SECTION_LABELS[group.id]?.[lang] ?? group.id}
                </p>
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {group.fields.map((field) => (
                    <div
                      key={field.key}
                      className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
                    >
                      <div className="min-w-52 flex-1">
                        <div className="font-mono text-xs text-foreground">{field.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {lang === "ar" ? field.name : humanize(field.key)} ·{" "}
                          <span className="font-mono">{field.type}</span>
                          {field.is_required && (
                            <span className="ml-1 text-primary">· contract required</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {USAGES.map((usage) => (
                          <button
                            key={usage}
                            disabled={field.is_required && usage === "unused"}
                            onClick={() =>
                              setFieldUsage((prev) => ({ ...prev, [field.key]: usage }))
                            }
                            className={`rounded-md border px-2 py-1 text-[11px] transition-colors disabled:opacity-30 ${
                              (fieldUsage[field.key] ?? "unused") === usage
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {t(usage)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["rtl", "Arabic / RTL"],
                ["ltr", "English / LTR"],
                ["both", "Arabic + English"],
                ["auto", "Auto"],
              ] as [Direction, string][]
            ).map(([value, title]) => (
              <button
                key={value}
                onClick={() => setDirection(value)}
                className={`rounded-lg border p-4 text-left ${
                  direction === value ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <div className="font-medium">{title}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
              </button>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={applySuggested} className="gap-2">
              <Sparkles className="size-3.5" />
              Use suggested identity
            </Button>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tname">Template Name</Label>
                <Input
                  id="tname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={suggested.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tid">Template ID</Label>
                <Input
                  id="tid"
                  className="font-mono"
                  value={id}
                  onChange={(e) => setId(slugify(e.target.value))}
                  placeholder={suggested.id}
                />
                {id && idExists(id) && (
                  <p className="text-xs text-destructive">This Template ID already exists.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tslug">Slug</Label>
                <Input
                  id="tslug"
                  className="font-mono"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder={suggested.slug}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tver">Version</Label>
                <Input
                  id="tver"
                  className="font-mono"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 6 && cardType && contract && (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Card Type", cardType],
                ["Schema Version", contract.schema_version],
                ["Template ID", id],
                ["Slug", slug],
                ["Version", version],
                ["Style", style],
                ["Direction", direction],
                ["Languages", languages.join(", ")],
                ["Used fields", String(usedCount)],
                ["Demo file", `${id}.demo.json`],
                ["Reference", refImage ? "image" : refUrl || refNotes || "none"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-background p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-mono text-sm">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              Confirm these specifications to create the template and open the workspace.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          {t("back")}
        </Button>
        {step < STEP_KEYS.length - 1 ? (
          <Button onClick={next} disabled={!canNext} className="gap-1">
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} className="gap-1">
            {t("create")}
          </Button>
        )}
      </div>
    </div>
  );
}
