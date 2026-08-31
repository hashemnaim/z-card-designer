import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveTemplate } from "@/builder/store";
import { validateTemplate } from "@/builder/validate";
import { exportTemplateZip } from "@/builder/export";
import { useTemplate } from "@/builder/use-templates";
import { PreviewFrame } from "@/builder/editor/PreviewFrame";
import { ContentPane } from "@/builder/editor/ContentPane";
import { PropertiesPane } from "@/builder/editor/PropertiesPane";
import { FieldsPane } from "@/builder/editor/FieldsPane";
import { ValidationPane } from "@/builder/editor/ValidationPane";
import type { TemplateRecord } from "@/builder/types";

export const Route = createFileRoute("/editor/$templateId")({
  head: () => ({
    meta: [
      { title: "Template Editor Window — Z Card Template Builder" },
      {
        name: "description",
        content:
          "Standalone editor window to change a Z Card template design, texts and images, then export it as a dependency-free package.",
      },
      { property: "og:title", content: "Template Editor Window — Z Card Template Builder" },
      {
        property: "og:description",
        content: "Edit design, content and images of a Z Card template and export a standalone ZIP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorWindowPage,
});

type Tab = "design" | "content" | "sections" | "validation";

function EditorWindowPage() {
  const { templateId } = Route.useParams();
  const { template, loading, refresh } = useTemplate(templateId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">
          No template found with id <span className="font-mono">{templateId}</span>.
        </p>
        <Button asChild size="sm">
          <Link to="/">Back to library</Link>
        </Button>
      </div>
    );
  }

  return <EditorWindow template={template} onChange={refresh} />;
}

function EditorWindow({
  template: initial,
  onChange,
}: {
  template: TemplateRecord;
  onChange: () => void;
}) {
  const [template, setTemplate] = useState(initial);
  const [tab, setTab] = useState<Tab>("design");
  const [busy, setBusy] = useState(false);

  function patch(next: Partial<TemplateRecord>) {
    const updated = saveTemplate({ ...template, ...next, updatedAt: new Date().toISOString() });
    setTemplate(updated);
    onChange();
  }

  const report = useMemo(() => validateTemplate(template), [template]);

  async function exportStandalone() {
    if (!report.ok) {
      toast.error("Fix validation failures before exporting.");
      setTab("validation");
      return;
    }
    setBusy(true);
    try {
      const result = await exportTemplateZip(template);
      toast.success(`${result.fileName} exported`, {
        description: `${result.files.length} files · ${result.assets} images · ${(
          result.bytes / 1024
        ).toFixed(1)} KB`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  const TABS: [Tab, string][] = [
    ["design", "Design"],
    ["content", "Content & Images"],
    ["sections", "Sections"],
    ["validation", "Validation"],
  ];

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium leading-tight">
            Editor · {template.name}
          </h1>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {template.id} · v{template.version} · {template.schemaVersion}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {template.cardType}
          </Badge>
          <Badge variant={report.ok ? "default" : "destructive"} className="font-mono text-[10px]">
            {report.ok ? "valid" : "invalid"}
          </Badge>
          <Button size="sm" className="h-7 gap-1.5" onClick={exportStandalone} disabled={busy}>
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            Export standalone ZIP
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2"
            onClick={() => {
              if (window.opener) window.close();
              else window.history.back();
            }}
          >
            <X className="size-3" />
            Close
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px]">
        <main className="flex min-h-[520px] min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <PreviewFrame template={template} data={template.demoData} />
        </main>

        <aside className="flex min-h-0 flex-col">
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
            {tab === "design" && <PropertiesPane template={template} onPatch={patch} />}
            {tab === "content" && (
              <ContentPane template={template} onPatch={patch} onPayload={() => {}} />
            )}
            {tab === "sections" && <FieldsPane template={template} onPatch={patch} />}
            {tab === "validation" && <ValidationPane template={template} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
