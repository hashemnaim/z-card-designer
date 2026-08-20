import personal from "./personal.template.json";
import realEstate from "./real-estate.template.json";
import cars from "./cars.template.json";

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "integer"
  | "currency"
  | "date"
  | "image"
  | "gallery"
  | "video_url"
  | "google_map"
  | "select"
  | "multiselect"
  | "checkbox"
  | "switch"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "instagram"
  | "linkedin";

export interface ContractField {
  id: number;
  key: string;
  name: string;
  type: string;
  options: string[] | null;
  is_required: boolean;
  is_global: boolean;
}

export interface ContractSection {
  id: string;
  fields: string[];
  hide_when_empty: boolean;
}

export interface DataContract {
  template_contract_version: string;
  schema_version: string;
  card_type: string;
  category: { id: number; slug: string; name: string; icon: string; type: string };
  field_usage: { required: string[]; optional: string[] };
  sections: ContractSection[];
  fields: ContractField[];
}

export const CARD_TYPES = ["personal", "real-estate", "cars"] as const;
export type CardType = (typeof CARD_TYPES)[number];

const REGISTRY: Record<CardType, DataContract> = {
  personal: personal as unknown as DataContract,
  "real-estate": realEstate as unknown as DataContract,
  cars: cars as unknown as DataContract,
};

export function getContract(cardType: CardType): DataContract {
  return REGISTRY[cardType];
}

export function listContracts(): DataContract[] {
  return CARD_TYPES.map((t) => REGISTRY[t]);
}

export function getField(cardType: CardType, key: string): ContractField | undefined {
  return getContract(cardType).fields.find((f) => f.key === key);
}

/** All API keys declared by the contract. Used as the strict allowlist. */
export function contractKeys(cardType: CardType): string[] {
  return getContract(cardType).fields.map((f) => f.key);
}

export function sectionOf(cardType: CardType, key: string): string {
  const s = getContract(cardType).sections.find((x) => x.fields.includes(key));
  return s?.id ?? "other";
}

/** Fields grouped by contract section, in contract order. */
export function fieldsBySection(cardType: CardType): { id: string; fields: ContractField[] }[] {
  const contract = getContract(cardType);
  const groups = contract.sections.map((s) => ({
    id: s.id,
    fields: s.fields
      .map((k) => contract.fields.find((f) => f.key === k))
      .filter((f): f is ContractField => Boolean(f)),
  }));
  const claimed = new Set(contract.sections.flatMap((s) => s.fields));
  const rest = contract.fields.filter((f) => !claimed.has(f.key));
  if (rest.length) groups.push({ id: "other", fields: rest });
  return groups;
}

export const SECTION_LABELS: Record<string, { en: string; ar: string }> = {
  profile: { en: "Profile", ar: "الملف الشخصي" },
  contact: { en: "Contact", ar: "التواصل" },
  social: { en: "Social", ar: "التواصل الاجتماعي" },
  media: { en: "Media", ar: "الوسائط" },
  services: { en: "Services", ar: "الخدمات" },
  achievements: { en: "Achievements", ar: "الإنجازات" },
  property: { en: "Property", ar: "العقار" },
  specifications: { en: "Specifications", ar: "المواصفات" },
  agent: { en: "Agent", ar: "الوكيل" },
  location: { en: "Location", ar: "الموقع" },
  vehicle: { en: "Vehicle", ar: "المركبة" },
  pricing: { en: "Pricing", ar: "السعر" },
  features: { en: "Features", ar: "المميزات" },
  seller: { en: "Seller", ar: "البائع" },
  other: { en: "Other", ar: "أخرى" },
};

export const CARD_TYPE_LABELS: Record<CardType, { en: string; ar: string; icon: string }> = {
  personal: { en: "Personal", ar: "بطاقة شخصية", icon: "💼" },
  "real-estate": { en: "Real Estate", ar: "عقارات", icon: "🏛️" },
  cars: { en: "Cars", ar: "سيارات", icon: "🚗" },
};
