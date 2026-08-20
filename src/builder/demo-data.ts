import { getContract, type CardType, type ContractField } from "@/contracts";
import type { TemplateRecord } from "./types";

const PHOTO = (seed: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&h=${h}`;

const PERSON_PHOTOS = [
  PHOTO("1544005313-94ddf0286df2", 900, 1100),
  PHOTO("1507003211169-0a1dd7228f2d", 900, 1100),
  PHOTO("1573496359142-b8d87734a5a2", 900, 1100),
];
const PROPERTY_PHOTOS = [
  PHOTO("1613977257363-707ba9348227"),
  PHOTO("1600585154340-be6161a56a0c"),
  PHOTO("1600566753190-17f0baa2a6c3"),
  PHOTO("1600607687939-ce8a6c25118c"),
];
const CAR_PHOTOS = [
  PHOTO("1552519507-da3b142c6e3d"),
  PHOTO("1503376780353-7e6692767b70"),
  PHOTO("1494976388531-d1058494cdd8"),
  PHOTO("1583121274602-3e2820c69888"),
];
const CAR_INTERIOR = [PHOTO("1503376780353-7e6692767b70"), PHOTO("1552519507-da3b142c6e3d")];

const TEXT_VALUES: Record<string, Record<string, unknown>> = {
  personal: {
    full_name: "أحمد خالد المنصوري",
    job_title: "مدير الاستثمار العقاري",
    company_name: "شركة زد كارد للاستثمار",
    specialization: "التمويل العقاري وإدارة الأصول",
    short_bio:
      "خبرة تمتد لأكثر من 12 عامًا في إدارة المحافظ العقارية وتطوير الاستثمارات في السوق الخليجي، مع تركيز على الأصول الفاخرة.",
    email_address: "ahmed@zcard.example",
    Phone: "+971501234567",
    WhatsApp: "+971501234567",
    languages: ["العربية", "انجليزي", "الفرنسية"],
    experience_years: 12,
    service_title: "استشارات استثمار عقاري",
    service_description:
      "جلسة استشارية متخصصة لبناء محفظة عقارية متوازنة تناسب أهدافك المالية على المدى الطويل.",
    service_url: "https://zcard.example/services/advisory",
    achievement_title: "جائزة أفضل مستشار عقاري",
    achievement_description: "تكريم عن إدارة محفظة بقيمة 400 مليون درهم خلال عام واحد.",
    achievement_date: "2025-11-14",
    achievement_url: "https://zcard.example/awards/2025",
    achievement_image: PHOTO("1531482615713-2afd69097998"),
    gallery_images: PERSON_PHOTOS,
  },
  "real-estate": {
    property_name: "فيلا الواجهة البحرية — بالم جميرا",
    property_type: "villa",
    property_status: "جاهز للتسليم",
    property_description:
      "فيلا مستقلة بإطلالة بانورامية على البحر، تشطيبات فاخرة، مسبح خاص، وحديقة مصممة بعناية مع مدخل خاص.",
    ready_to_move: true,
    year_built: 2022,
    area: 640,
    area_unit: "m2",
    bedrooms: 5,
    bathrooms: 6,
    parking_spaces: 3,
    agent_name: "ليان عبد الرحمن",
    company_name: "زد كارد العقارية",
    email_address: "sales@zcard.example",
    Phone: "+971555512345",
    WhatsApp: "+971555512345",
    address: "بالم جميرا، الواجهة الغربية",
    city: "دبي",
    state: "دبي",
    country: "الإمارات العربية المتحدة",
    google_maps_url: "https://maps.google.com/?q=25.1121,55.1390",
    map_url: "https://maps.google.com/?q=25.1121,55.1390",
    gallery_images: PROPERTY_PHOTOS,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  cars: {
    title: "مرسيدس S500 — فل كامل",
    brand: "مرسيدس",
    model: "S500",
    trim: "AMG Line",
    year: 2024,
    body_type: "sedan",
    condition: "جديد",
    description:
      "سيارة بحالة الوكالة، صيانة كاملة بالوكيل، مقاعد جلد مهوّاة، نظام صوتي محيطي، وضمان ساري.",
    mileage: 12400,
    engine_size: 3000,
    horsepower: 435,
    fuel_type: "بنزين",
    transmission: "أوتوماتيك",
    drivetrain: "دفع خلفي",
    exterior_color: "أسود أوبسيديان",
    interior_color: "بيج ماكياتو",
    price: 385000,
    currency: ["$"],
    location: "دبي — الخليج التجاري",
    Phone: "+971502223344",
    WhatsApp: "+971502223344",
    seller_name: "خالد الدوسري",
    seller_title: "مستشار مبيعات معتمد",
    seller_company: "زد كارد موتورز",
    seller_avatar: PHOTO("1507003211169-0a1dd7228f2d", 400, 400),
    seller_verified: true,
    verified: true,
    featured_image: CAR_PHOTOS[0],
    gallery_images: CAR_PHOTOS,
    interior_gallery: CAR_INTERIOR,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sunroof: true,
    cruise_control: true,
    rear_camera: true,
    parking_sensors: true,
    navigation: true,
    leather_seats: true,
    bluetooth: true,
    keyless_entry: true,
    apple_carplay: true,
    android_auto: true,
  },
};

/** Extra keys consumed by the Real Estate Luxury mobile-card layout. */
const REAL_ESTATE_LUXURY_EXTRAS: Record<string, unknown> = {
  cover_image: PHOTO("1613977257363-707ba9348227", 1200, 900),
  property_image: PHOTO("1600585154340-be6161a56a0c", 700, 700),
  price: 12000000,
  currency: "EGP",
  short_location: "التجمع الخامس، القاهرة الجديدة",
  verified_badge: true,
  short_description: "فيلا مستقلة عصرية بمسبح خاص وأنظمة منزل ذكي.",
  phone_number: "+201001234567",
  whatsapp_number: "+201001234567",
  property_area: 520,
  feature_name: [
    "مسبح خاص",
    "حديقة",
    "منزل ذكي",
    "مصعد",
    "أمن ٢٤/٧",
    "صالة رياضية",
  ],
  video_thumbnail: PHOTO("1600566753190-17f0baa2a6c3", 1200, 750),
  agent_photo: PHOTO("1507003211169-0a1dd7228f2d", 400, 400),
  agent_title: "مستشار عقاري أول",
  agent_phone: "+201001234567",
  agent_whatsapp: "+201001234567",
  agent_email: "agent@zcard.example",
};

const SOCIALS: Record<string, string> = {
  youtube_url: "https://youtube.com/@zcard",
  tiktok_url: "https://tiktok.com/@zcard",
  x_url: "https://x.com/zcard",
  facebook_url: "https://facebook.com/zcard",
  instagram_url: "https://instagram.com/zcard",
  linkedin_url: "https://linkedin.com/company/zcard",
};

function fallbackValue(field: ContractField): unknown {
  switch (field.type) {
    case "textarea":
      return "نص تعريفي تجريبي للمعاينة فقط.";
    case "integer":
      return 4;
    case "currency":
      return 250000;
    case "email":
      return "info@zcard.example";
    case "phone":
      return "+971500000000";
    case "date":
      return "2026-01-15";
    case "url":
      return "https://zcard.example";
    case "image":
      return PHOTO("1503376780353-7e6692767b70", 800, 800);
    case "gallery":
      return PROPERTY_PHOTOS.slice(0, 2);
    case "video_url":
      return "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    case "google_map":
      return "https://maps.google.com/?q=25.2048,55.2708";
    case "checkbox":
    case "switch":
      return true;
    case "select":
      return field.options?.[0] ?? "خيار";
    case "multiselect":
      return field.options?.slice(0, 2) ?? ["خيار"];
    default:
      return field.name;
  }
}

/** Builds demo data using ONLY official contract API keys, for the used fields. */
export function generateDemoData(
  cardType: CardType,
  fieldUsage: Record<string, string>,
): Record<string, unknown> {
  const contract = getContract(cardType);
  const bank = { ...(TEXT_VALUES[cardType] ?? {}), ...SOCIALS };
  const out: Record<string, unknown> = {};
  for (const field of contract.fields) {
    const usage = fieldUsage[field.key] ?? "unused";
    if (usage === "unused") continue;
    out[field.key] = field.key in bank ? bank[field.key] : fallbackValue(field);
  }
  return out;
}

export function regenerateDemo(template: TemplateRecord): Record<string, unknown> {
  return generateDemoData(template.cardType, template.fieldUsage);
}
