import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Workspace } from "@/builder/editor/Workspace";
import { useTemplate } from "@/builder/use-templates";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/t/$templateId")({
  head: () => ({
    meta: [
      { title: "Template Workspace — Z Card Template Builder" },
      {
        name: "description",
        content:
          "Three-pane workspace: contract fields, live mobile preview from the export runtime, and theme properties.",
      },
      { property: "og:title", content: "Template Workspace — Z Card Template Builder" },
      {
        property: "og:description",
        content: "Edit, preview, validate and export a Z Card template package.",
      },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { templateId } = Route.useParams();
  const { template, loading, refresh } = useTemplate(templateId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader action="none" />
      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading template…
        </div>
      ) : !template ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">
            No template found with id <span className="font-mono">{templateId}</span>.
          </p>
          <Button asChild size="sm">
            <Link to="/">Back to library</Link>
          </Button>
        </div>
      ) : (
        <Workspace template={template} onChange={refresh} />
      )}
    </div>
  );
}
