import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Wizard } from "@/builder/wizard/Wizard";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New Template Wizard — Z Card Template Builder" },
      {
        name: "description",
        content:
          "Guided wizard to define card type, style, visual reference, field priority, language and template identity.",
      },
      { property: "og:title", content: "New Template Wizard — Z Card Template Builder" },
      {
        property: "og:description",
        content: "Define a Z Card template from its official data contract in six guided steps.",
      },
    ],
  }),
  component: NewTemplatePage,
});

function NewTemplatePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader action="none" />
      <Wizard />
    </div>
  );
}
