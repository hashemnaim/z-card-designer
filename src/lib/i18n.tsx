import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UiLang = "en" | "ar";

const DICT = {
  appName: { en: "Z Card Template Builder", ar: "منشئ قوالب زد كارد" },
  tagline: {
    en: "Author, preview, validate and export standalone Z Card templates.",
    ar: "أنشئ وعاين وتحقق وصدّر قوالب زد كارد المستقلة.",
  },
  newTemplate: { en: "+ New Template", ar: "+ قالب جديد" },
  library: { en: "Template Library", ar: "مكتبة القوالب" },
  allTypes: { en: "All types", ar: "كل الأنواع" },
  search: { en: "Search templates", ar: "ابحث في القوالب" },
  open: { en: "Open", ar: "فتح" },
  duplicate: { en: "Duplicate", ar: "تكرار" },
  export: { en: "Export", ar: "تصدير" },
  delete: { en: "Delete", ar: "حذف" },
  empty: {
    en: "No templates yet. Start the wizard to create your first template.",
    ar: "لا توجد قوالب بعد. ابدأ المعالج لإنشاء أول قالب.",
  },
  step: { en: "Step", ar: "خطوة" },
  next: { en: "Next", ar: "التالي" },
  back: { en: "Back", ar: "رجوع" },
  cardType: { en: "Card Type", ar: "نوع البطاقة" },
  style: { en: "Style", ar: "الستايل" },
  reference: { en: "Visual Reference", ar: "المرجع البصري" },
  fields: { en: "Field Priority", ar: "أهمية الحقول" },
  language: { en: "Language & Direction", ar: "اللغة والاتجاه" },
  identity: { en: "Template Identity", ar: "هوية القالب" },
  summary: { en: "Summary", ar: "الملخص" },
  create: { en: "Create Template", ar: "إنشاء القالب" },
  required: { en: "Required", ar: "إلزامي" },
  recommended: { en: "Recommended", ar: "مستحسن" },
  optional: { en: "Optional", ar: "اختياري" },
  unused: { en: "Not used", ar: "غير مستخدم" },
  preview: { en: "Preview", ar: "معاينة" },
  demoData: { en: "Demo Data", ar: "بيانات تجريبية" },
  customJson: { en: "Custom JSON", ar: "JSON مخصص" },
  apiPayload: { en: "API-like Payload", ar: "حِمل مشابه للـAPI" },
  validation: { en: "Validation", ar: "التحقق" },
  properties: { en: "Properties", ar: "الخصائص" },
  contract: { en: "Data Contract", ar: "عقد البيانات" },
  aiGenerate: { en: "Generate with AI", ar: "توليد بالذكاء الاصطناعي" },
  save: { en: "Saved", ar: "تم الحفظ" },
} as const;

export type DictKey = keyof typeof DICT;

interface Ctx {
  lang: UiLang;
  setLang: (lang: UiLang) => void;
  t: (key: DictKey) => string;
}

const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => DICT[k].en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UiLang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("zcard.ui-lang");
    if (stored === "ar" || stored === "en") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("zcard.ui-lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: (key) => DICT[key][lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Picks the right side of a bilingual pair. */
export function pick(lang: UiLang, pair: { en: string; ar: string }) {
  return pair[lang];
}
