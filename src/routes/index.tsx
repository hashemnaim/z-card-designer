import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Download, FileJson, Loader2, PenSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARD_TYPES, CARD_TYPE_LABELS, getContract, type CardType } from "@/contracts";
import { deleteTemplate, duplicateTemplate } from "@/builder/store";
import { useTemplates } from "@/builder/use-templates";
import { exportTemplateZip } from "@/builder/export";
import { validateTemplate } from "@/builder/validate";
import { usageBuckets } from "@/builder/runtime/generate";
import type { TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Z Card Template Builder — Template Library" },
      {
        name: "description",
        content:
          "Internal authoring tool for Z Card UI templates: contract-driven fields, live preview, validation and standalone ZIP export.",
      },
      { property: "og:title", content: "Z Card Template Builder — Template Library" },
      {
        property: "og:description",
        content:
          "Author Z Card templates from official data contracts and export dependency-free packages.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { t, lang } = useI18n();
  const { templates, refresh, loading } = useTemplates();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CardType | "all">("all");

  const filtered = useMemo(() => {
    const list = templates ?? [];
    return list.filter((tpl) => {
      const matchesType = filter === "all" || tpl.cardType === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.id.toLowerCase().includes(q) ||
        tpl.theme.style.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [templates, filter, query]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("library")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="h-9 w-56"
            />
            <div className="flex gap-1">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                {t("allTypes")}
              </FilterChip>
              {CARD_TYPES.map((type) => (
                <FilterChip key={type} active={filter === type} onClick={() => setFilter(type)}>
                  {CARD_TYPE_LABELS[type][lang]}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {CARD_TYPES.map((type) => {
            const contract = getContract(type);
            const count = (templates ?? []).filter((tpl) => tpl.cardType === type).length;
            return (
              <div key={type} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CARD_TYPE_LABELS[type].icon}</span>
                  <span className="text-sm font-medium">{CARD_TYPE_LABELS[type][lang]}</span>
                  <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                    {count}
                  </Badge>
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {contract.card_type} · {contract.schema_version} · {contract.fields.length} keys
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading library…
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid-bg flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
              <FileJson className="size-8 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">{t("empty")}</p>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/new">
                  <Plus className="size-3.5" />
                  {t("newTemplate").replace("+ ", "")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((tpl) => (
                <TemplateCard key={tpl.id} template={tpl} onChange={refresh} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function TemplateCard({
  template,
  onChange,
}: {
  template: TemplateRecord;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const report = validateTemplate(template);
  const buckets = usageBuckets(template);
  const theme = template.theme;

  async function download() {
    setBusy(true);
    try {
      const result = await exportTemplateZip(template);
      toast.success(`${result.fileName} exported`);
    } catch (error) {
      console.error(error);
      toast.error("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="flex h-24 items-end gap-2 p-3"
        style={{ background: `linear-gradient(135deg, ${theme.surface}, ${theme.background})` }}
      >
        <span
          className="rounded-md px-2 py-1 font-mono text-[10px]"
          style={{ background: theme.accent, color: theme.accentText }}
        >
          {theme.style}
        </span>
        <span
          className="rounded-md border px-2 py-1 font-mono text-[10px]"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          {theme.heroStyle} · {theme.contactStyle}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-sm font-medium leading-tight">{template.name}</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            {template.id} · v{template.version}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {template.cardType}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {template.direction}
          </Badge>
          <Badge
            variant={report.ok ? "default" : "destructive"}
            className="font-mono text-[10px]"
          >
            {report.ok ? "valid" : `${report.checks.filter((c) => c.level === "fail").length} fail`}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {buckets.required.length} required · {buckets.recommended.length} recommended ·{" "}
          {buckets.optional.length} optional
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          <Button
            size="sm"
            className="h-7"
            onClick={() => navigate({ to: "/t/$templateId", params: { templateId: template.id } })}
          >
            {t("open")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1"
            onClick={() =>
              window.open(
                `/editor/${template.id}`,
                `zcard-editor-${template.id}`,
                "popup=yes,width=1280,height=900",
              )
            }
          >
            <PenSquare className="size-3" />
            Editor window
          </Button>


          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1"
            onClick={download}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
            {t("export")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={() => {
              const copy = duplicateTemplate(template.id);
              if (copy) toast.success(`Duplicated as ${copy.id}`);
              onChange();
            }}
          >
            <Copy className="size-3" />
            {t("duplicate")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-destructive hover:text-destructive"
            onClick={() => {
              deleteTemplate(template.id);
              toast.success(`${template.id} deleted`);
              onChange();
            }}
          >
            <Trash2 className="size-3" />
            {t("delete")}
          </Button>
        </div>
      </div>
    </article>
  );
}
