import type { TranslationSummary } from "../api/bible";

/**
 * Popular translations ranked for the picker. Each entry uses a stable `id` stored in
 * app state and a `helloaoId` that exists on the free HelloAO API (no API keys).
 *
 * Copyrighted editions (NIV, ESV, NLT, NKJV, CSB, NASB, Message, NIrV) are not
 * available on free hosts — we surface the closest free text and label it clearly.
 */
export interface CuratedTranslation extends TranslationSummary {
  helloaoId: string;
  /** Familiar name users search for (shown as a hint, not the legal text title). */
  familiarName: string;
  pickerNote: string;
}

export const CURATED_TRANSLATIONS: CuratedTranslation[] = [
  {
    id: "sp_niv",
    helloaoId: "ENGWEBP",
    name: "World English Bible",
    englishName: "World English Bible",
    shortName: "WEB",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "NIV",
    pickerNote: "Closest free modern English (NIV is not on free APIs)",
  },
  {
    id: "sp_kjv",
    helloaoId: "eng_kjv",
    name: "King James Version",
    englishName: "King James Version",
    shortName: "KJV",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "KJV",
    pickerNote: "Authorized King James text",
  },
  {
    id: "sp_nkjv",
    helloaoId: "eng_kjv",
    name: "King James Version",
    englishName: "King James Version",
    shortName: "KJV",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "NKJV",
    pickerNote: "NKJV is not on free APIs — KJV text provided instead",
  },
  {
    id: "sp_nlt",
    helloaoId: "eng_fbv",
    name: "Free Bible Version",
    englishName: "Free Bible Version",
    shortName: "FBV",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "NLT",
    pickerNote: "Easy-to-read free text (NLT is not on free APIs)",
  },
  {
    id: "sp_esv",
    helloaoId: "eng_asv",
    name: "American Standard Version (1901)",
    englishName: "American Standard Version (1901)",
    shortName: "ASV",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "ESV",
    pickerNote: "Formal free English in the ESV family line (ASV 1901)",
  },
  {
    id: "sp_csb",
    helloaoId: "BSB",
    name: "Berean Standard Bible",
    englishName: "Berean Standard Bible",
    shortName: "BSB",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "CSB",
    pickerNote: "Berean Standard Bible (same Berean family as CSB)",
  },
  {
    id: "sp_nasb",
    helloaoId: "eng_msb",
    name: "Majority Standard Bible",
    englishName: "Majority Standard Bible",
    shortName: "MSB",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "NASB",
    pickerNote: "Formal free text (NASB is not on free APIs)",
  },
  {
    id: "sp_msg",
    helloaoId: "eng_net",
    name: "NET Bible",
    englishName: "NET Bible",
    shortName: "NET",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "Message",
    pickerNote: "Contemporary free translation (The Message is not on free APIs)",
  },
  {
    id: "sp_nirv",
    helloaoId: "eng_bbe",
    name: "Bible in Basic English",
    englishName: "Bible in Basic English",
    shortName: "BBE",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "NIrV",
    pickerNote: "Simple vocabulary (NIrV is not on free APIs)",
  },
  {
    id: "sp_nahcb",
    helloaoId: "eng_webc",
    name: "World English Bible (Catholic)",
    englishName: "World English Bible (Catholic)",
    shortName: "WEBC",
    language: "eng",
    languageEnglishName: "English",
    textDirection: "ltr",
    familiarName: "New American Holy Catholic Bible",
    pickerNote:
      "Catholic canon incl. deuterocanonical books (NAB/NABRE not on free APIs — WEB Catholic text)",
  },
  {
    id: "sp_rv",
    helloaoId: "spa_r09",
    name: "Reina Valera 1909",
    englishName: "Reina Valera 1909",
    shortName: "RV",
    language: "spa",
    languageEnglishName: "Spanish",
    textDirection: "ltr",
    familiarName: "Reina Valera",
    pickerNote: "Spanish Reina Valera 1909",
  },
];

const byPickerId = new Map(CURATED_TRANSLATIONS.map((t) => [t.id, t]));
const byHelloaoId = new Map(CURATED_TRANSLATIONS.map((t) => [t.helloaoId, t]));

/** Stable ids shown first in the version picker (user rank order). */
export const CURATED_PICKER_ORDER: string[] = CURATED_TRANSLATIONS.map((t) => t.id);

export function isCuratedTranslationId(id: string | null | undefined): boolean {
  return id != null && byPickerId.has(id);
}

export function curatedTranslation(id: string): CuratedTranslation | undefined {
  return byPickerId.get(id);
}

/** HelloAO id used in `/api/{id}/{book}/{chapter}.json` requests. */
export function resolveHelloAoTranslationId(translationId: string): string {
  const curated = byPickerId.get(translationId);
  if (curated) return curated.helloaoId;
  return translationId;
}

/** Map broken legacy picker ids (wrong HelloAO abbreviations) to curated entries. */
const LEGACY_PICKER_ALIASES: Record<string, string> = {
  NIV: "sp_niv",
  KJV: "sp_kjv",
  NKJV: "sp_nkjv",
  NLT: "sp_nlt",
  ESV: "sp_esv",
  CSB: "sp_csb",
  NASB: "sp_nasb",
  NASB1995: "sp_nasb",
  MSG: "sp_msg",
  Message: "sp_msg",
  __SP_SCRIPTURE_NLT__: "sp_nlt",
  NIrV: "sp_nirv",
  NIRV: "sp_nirv",
  RV: "sp_rv",
  WEB: "sp_niv",
  ENGWEBP: "sp_niv",
  BSB: "sp_csb",
  eng_kjv: "sp_kjv",
  eng_asv: "sp_esv",
  eng_msb: "sp_nasb",
  eng_bbe: "sp_nirv",
  eng_pev: "sp_nlt",
  eng_fbv: "sp_nlt",
  eng_net: "sp_msg",
  eng_webc: "sp_nahcb",
  WEBC: "sp_nahcb",
  NABRE: "sp_nahcb",
  NAB: "sp_nahcb",
  NAHCB: "sp_nahcb",
  spa_r09: "sp_rv",
};

export function migrateTranslationId(translationId: string | null): string | null {
  if (!translationId) return null;
  if (byPickerId.has(translationId)) return translationId;
  const legacy = LEGACY_PICKER_ALIASES[translationId];
  if (legacy) return legacy;
  if (byHelloaoId.has(translationId)) {
    const match = CURATED_TRANSLATIONS.find((t) => t.helloaoId === translationId);
    return match?.id ?? translationId;
  }
  return translationId;
}

export function curatedAsSummaries(): TranslationSummary[] {
  return CURATED_TRANSLATIONS.map(({ helloaoId: _h, familiarName: _f, pickerNote: _p, ...summary }) => summary);
}

/** Match picker search against familiar names (NIV, KJV, …) and HelloAO titles. */
export function translationMatchesSearch(t: TranslationSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const curated = curatedTranslation(t.id);
  const hay = [
    t.englishName,
    t.name,
    t.id,
    t.shortName,
    t.languageEnglishName,
    t.language,
    curated?.familiarName,
    curated?.pickerNote,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function partitionFeaturedTranslations(
  all: TranslationSummary[],
  options?: { query?: string; englishOnly?: boolean },
): { featured: TranslationSummary[]; other: TranslationSummary[] } {
  const q = options?.query?.trim() ?? "";
  const byId = new Map(all.map((t) => [t.id, t]));
  const curatedIds = new Set(CURATED_PICKER_ORDER);

  const featured: TranslationSummary[] = [];
  for (const id of CURATED_PICKER_ORDER) {
    const t = byId.get(id) ?? curatedAsSummaries().find((c) => c.id === id);
    if (!t) continue;
    if (q && !translationMatchesSearch(t, q)) continue;
    featured.push(t);
  }

  const used = new Set(featured.map((t) => t.id));
  let other = all.filter((t) => !used.has(t.id) && !curatedIds.has(t.id));
  if (q) other = other.filter((t) => translationMatchesSearch(t, q));
  if (options?.englishOnly) {
    other = other.filter((t) => t.language === "eng" || t.languageEnglishName === "English");
  }
  other.sort((a, b) => a.englishName.localeCompare(b.englishName, undefined, { sensitivity: "base" }));
  return { featured, other };
}
