import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, PenSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveTemplate } from "@/builder/store";
import { validateTemplate } from "@/builder/validate";
import type { TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";
import { FieldsPane } from "./FieldsPane";
import { PropertiesPane } from "./PropertiesPane";
import { PreviewFrame } from "./PreviewFrame";
import { DataPane } from "./DataPane";
import { ValidationPane } from "./ValidationPane";
import { FilesPane } from "./FilesPane";
import { ContentPane } from "./ContentPane";

type Tab = "content" | "design" | "data" | "validation" | "files";

export function Workspace({
  template: initial,
  onChange,
}: {
  template: TemplateRecord;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [template, setTemplate] = useState(initial);
  const [payload, setPayload] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("content");

  function patch(next: Partial<TemplateRecord>) {
    const updated = saveTemplate({ ...template, ...next, updatedAt: new Date().toISOString() });
    setTemplate(updated);
    onChange();
  }

  const previewData = useMemo(() => {
    if (!payload) return template.demoData;
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return template.demoData;
    }
  }, [payload, template.demoData]);

  const report = validateTemplate(template);

  const TABS: [Tab, string][] = [
    ["content", "Content"],
    ["design", t("properties")],
    ["data", t("apiPayload")],
    ["validation", t("validation")],
    ["files", "Package Files"],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
        <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
          <Link to="/">
            <ChevronLeft className="size-4" />
            {t("library")}
          </Link>
        </Button>
        <div>
          <p className="text-sm font-medium leading-tight">{template.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {template.id} · v{template.version} · {template.schemaVersion}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5"
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
          <Badge variant="secondary" className="font-mono text-[10px]">
            {template.cardType}
          </Badge>
          <Badge variant={report.ok ? "default" : "destructive"} className="font-mono text-[10px]">
            {report.ok ? "valid" : "invalid"}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground">{t("save")}</span>
        </div>

      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_420px]">
        <aside className="min-h-0 border-b border-border lg:border-b-0 lg:border-r">
          <FieldsPane template={template} onPatch={patch} />
        </aside>

        <main className="flex min-h-0 min-h-[520px] flex-col">
          <PreviewFrame template={template} data={previewData} />
        </main>

        <aside className="flex min-h-0 flex-col border-t border-border lg:border-l lg:border-t-0">
          <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-1.5">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  tab === key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {tab === "content" && (
              <ContentPane template={template} onPatch={patch} onPayload={setPayload} />
            )}
            {tab === "design" && <PropertiesPane template={template} onPatch={patch} />}
            {tab === "data" && (
              <DataPane
                key={template.demoData === initial.demoData ? "demo" : "custom"}
                template={template}
                onPatch={patch}
                payload={payload}
                onPayload={setPayload}
              />
            )}
            {tab === "validation" && <ValidationPane template={template} />}
            {tab === "files" && <FilesPane template={template} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
