import { Link } from "@tanstack/react-router";
import { Languages, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function AppHeader({ action }: { action?: "new" | "none" }) {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{t("appName")}</span>
        </Link>
        <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
          internal · v1
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="gap-1.5 font-mono text-xs"
          >
            <Languages className="size-3.5" />
            {lang === "en" ? "AR" : "EN"}
          </Button>
          {action !== "none" && (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/new">
                <Plus className="size-3.5" />
                {t("newTemplate").replace("+ ", "")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
