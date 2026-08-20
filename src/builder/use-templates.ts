import { useCallback, useEffect, useState } from "react";
import { getTemplate, listTemplates } from "./store";
import type { TemplateRecord } from "./types";

/** Reads the local template store after hydration and stays in sync with changes. */
export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateRecord[] | null>(null);

  const refresh = useCallback(() => setTemplates(listTemplates()), []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("zcard-store-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("zcard-store-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { templates, refresh, loading: templates === null };
}

export function useTemplate(id: string) {
  const [template, setTemplate] = useState<TemplateRecord | null | undefined>(undefined);

  const refresh = useCallback(() => setTemplate(getTemplate(id) ?? null), [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { template, setTemplate, refresh, loading: template === undefined };
}
