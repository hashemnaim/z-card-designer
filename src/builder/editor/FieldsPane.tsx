import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { SECTION_LABELS, fieldsBySection, getContract } from "@/contracts";
import { humanize, usageBuckets } from "@/builder/runtime/generate";
import type { FieldUsage, TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";

const USAGES: FieldUsage[] = ["required", "recommended", "optional", "unused"];

export function FieldsPane({
  template,
  onPatch,
}: {
  template: TemplateRecord;
  onPatch: (patch: Partial<TemplateRecord>) => void;
}) {
  const { t, lang } = useI18n();
  const contract = getContract(template.cardType);
  const buckets = usageBuckets(template);
  const groups = fieldsBySection(template.cardType);
  const order = template.sectionOrder.length
    ? template.sectionOrder
    : contract.sections.map((s) => s.id);

  function setUsage(key: string, usage: FieldUsage) {
    onPatch({ fieldUsage: { ...template.fieldUsage, [key]: usage } });
  }

  function toggleSection(id: string) {
    const hidden = template.hiddenSections.includes(id)
      ? template.hiddenSections.filter((s) => s !== id)
      : [...template.hiddenSections, id];
    onPatch({ hiddenSections: hidden });
  }

  function move(id: string, delta: number) {
    const next = [...order];
    const from = next.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= next.length) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item as string);
    onPatch({ sectionOrder: next });
  }

  const ordered = order
    .map((id) => groups.find((g) => g.id === id))
    .filter((g): g is (typeof groups)[number] => Boolean(g));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {t("contract")} · {template.cardType}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-mono">{template.schemaVersion}</span> · {buckets.required.length}{" "}
          required · {contract.fields.length} keys
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-3">
        {ordered.map((group) => {
          const hidden = template.hiddenSections.includes(group.id);
          return (
            <section key={group.id} className="rounded-lg border border-border bg-card">
              <header className="flex items-center gap-1 border-b border-border px-2 py-1.5">
                <span
                  className={`flex-1 truncate text-xs font-medium ${hidden ? "text-muted-foreground line-through" : ""}`}
                >
                  {SECTION_LABELS[group.id]?.[lang] ?? humanize(group.id)}
                </span>
                <button
                  onClick={() => move(group.id, -1)}
                  aria-label="Move section up"
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  onClick={() => move(group.id, 1)}
                  aria-label="Move section down"
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  onClick={() => toggleSection(group.id)}
                  aria-label="Toggle section visibility"
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  {hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </header>
              <div className="divide-y divide-border">
                {group.fields.map((field) => {
                  const usage = template.fieldUsage[field.key] ?? "unused";
                  return (
                    <div key={field.key} className="px-2 py-2">
                      <div className="flex items-baseline gap-2">
                        <code className="truncate text-[11px] text-foreground">{field.key}</code>
                        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                          {field.type}
                        </span>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {USAGES.map((option) => (
                          <button
                            key={option}
                            disabled={field.is_required && option === "unused"}
                            onClick={() => setUsage(field.key, option)}
                            className={`flex-1 rounded border px-1 py-0.5 text-[10px] transition-colors disabled:opacity-30 ${
                              usage === option
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {t(option)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
