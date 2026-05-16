/**
 * Optional New Living Translation via API.Bible (scripture.api.bible).
 * The app is free to run using only HelloAO; NLT is listed only when you opt in:
 * - `VITE_SCRIPTURE_API_KEY` — browser calls API.Bible directly (key ships in the bundle).
 * - Dev + `VITE_SCRIPTURE_DEV_PROXY=1` — use the Vite proxy with `SCRIPTURE_API_KEY` in `.env` (key stays server-side).
 */
import type { ChapterContentPiece, ChapterResponse, TranslationBook, TranslationSummary } from "./bible";

const SENTINEL = "__SP_SCRIPTURE_NLT__";

export const SCRIPTURE_NLT_TRANSLATION_ID = SENTINEL;

/** NLT via API.Bible is optional; all other versions use the free public HelloAO API with no key. */
export function isScriptureNltOffered(): boolean {
  const viteKey = (import.meta.env.VITE_SCRIPTURE_API_KEY as string | undefined) ?? "";
  if (viteKey.trim().length > 0) return true;
  const devProxy = (import.meta.env.VITE_SCRIPTURE_DEV_PROXY as string | undefined) ?? "";
  return Boolean(import.meta.env.DEV && devProxy === "1");
}

export const SCRIPTURE_NLT_SUMMARY: TranslationSummary = {
  id: SENTINEL,
  name: "New Living Translation",
  englishName: "New Living Translation (NLT)",
  shortName: "NLT",
  language: "eng",
  languageEnglishName: "English",
  textDirection: "ltr",
};

function scriptureClient(): { base: string; headers: Record<string, string> } {
  const viteKey = import.meta.env.VITE_SCRIPTURE_API_KEY as string | undefined;
  if (viteKey && viteKey.length > 0) {
    return {
      base: "https://api.scripture.api.bible/v1",
      headers: { "api-key": viteKey },
    };
  }
  return { base: "/scripture-api", headers: {} };
}

async function spGet<T>(path: string): Promise<T> {
  const { base, headers } = scriptureClient();
  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Scripture API ${res.status}: ${path} ${t.slice(0, 120)}`);
  }
  return res.json() as Promise<T>;
}

interface BibleListItem {
  id: string;
  name?: string;
  nameLocal?: string;
  abbreviation?: string;
  description?: string;
}

interface BiblesResponse {
  data: BibleListItem[];
}

interface VerseListItem {
  id: string;
  orgId?: string;
}

interface VersesListResponse {
  data: VerseListItem[];
}

interface VerseResponse {
  data: { id: string; content: string };
}

let cachedNltBibleId: string | null = null;

async function resolveNltBibleId(): Promise<string> {
  if (cachedNltBibleId) return cachedNltBibleId;
  const j = await spGet<BiblesResponse>("/bibles");
  const list = j.data ?? [];
  const nlt =
    list.find((b) => (b.abbreviation ?? "").toUpperCase() === "NLT") ??
    list.find((b) => /new living translation/i.test(b.name ?? "")) ??
    list.find((b) => /(^|\s)nlt(\s|$)/i.test(b.name ?? ""));
  if (!nlt) throw new Error("No NLT bible in your API.Bible account. Check api.bible access.");
  cachedNltBibleId = nlt.id;
  return nlt.id;
}

function verseStartNumber(verseId: string): number {
  const head = verseId.split("-")[0] ?? verseId;
  const last = head.split(".").pop() ?? "1";
  const m = last.match(/^(\d+)/);
  return m ? parseInt(m[1]!, 10) : 1;
}

function stripLeadingVerseLabel(content: string): string {
  return content.replace(/^\d+(?:[a-z]+)?(?:[–-]\d+(?:[a-z]+)?)?\s*/i, "").trim();
}

const BOOK_NAMES: Record<string, string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "Song of Songs",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  JON: "Jonah",
  MIC: "Micah",
  ZEC: "Zechariah",
  MAL: "Malachi",
  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JOH: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "1TI": "1 Timothy",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1 Peter",
  "1JN": "1 John",
  REV: "Revelation",
};

const BOOK_CHAPTERS: Record<string, number> = {
  GEN: 50,
  EXO: 40,
  LEV: 27,
  NUM: 36,
  DEU: 34,
  JOS: 24,
  JDG: 21,
  RUT: 4,
  "1SA": 31,
  "2SA": 24,
  "1KI": 22,
  "2KI": 25,
  EZR: 10,
  NEH: 13,
  EST: 10,
  JOB: 42,
  PSA: 150,
  PRO: 31,
  ECC: 12,
  SNG: 8,
  ISA: 66,
  JER: 52,
  LAM: 5,
  EZK: 48,
  DAN: 12,
  JON: 4,
  MIC: 7,
  ZEC: 14,
  MAL: 4,
  MAT: 28,
  MRK: 16,
  LUK: 24,
  JOH: 21,
  ACT: 28,
  ROM: 16,
  "1CO": 16,
  "2CO": 13,
  GAL: 6,
  EPH: 6,
  PHP: 4,
  COL: 4,
  "1TH": 5,
  "1TI": 6,
  HEB: 13,
  JAS: 5,
  "1PE": 5,
  "1JN": 5,
  REV: 22,
};

/** HelloAO book codes → API.Bible USFM (only where they differ) */
const HELLOAO_TO_API_BOOK: Record<string, string> = {
  JOH: "JHN",
};

export async function fetchScriptureNltChapter(bookId: string, chapter: number): Promise<ChapterResponse> {
  const bibleId = await resolveNltBibleId();
  const apiBook = HELLOAO_TO_API_BOOK[bookId] ?? bookId;
  const chapterId = `${apiBook}.${chapter}`;
  const list = await spGet<VersesListResponse>(
    `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}/verses`,
  );
  const items = list.data ?? [];
  const pieces: ChapterContentPiece[] = [];

  const concurrency = 12;
  const texts: { n: number; text: string }[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const settled = await Promise.all(
      chunk.map(async (v) => {
        const vr = await spGet<VerseResponse>(
          `/bibles/${encodeURIComponent(bibleId)}/verses/${encodeURIComponent(v.id)}`,
        );
        const n = verseStartNumber(v.id);
        const text = stripLeadingVerseLabel(vr.data.content ?? "");
        return { n, text };
      }),
    );
    texts.push(...settled);
  }
  texts.sort((a, b) => a.n - b.n);
  for (const { n, text } of texts) {
    pieces.push({ type: "verse", number: n, content: [{ text }] });
  }

  const book: TranslationBook = {
    id: bookId,
    name: BOOK_NAMES[bookId] ?? bookId,
    commonName: BOOK_NAMES[bookId] ?? bookId,
    numberOfChapters: BOOK_CHAPTERS[bookId] ?? 50,
  };

  return {
    translation: { ...SCRIPTURE_NLT_SUMMARY },
    book,
    chapter: { number: chapter, content: pieces },
    numberOfVerses: pieces.filter((p) => p.type === "verse").length,
  };
}

export function isScriptureNltTranslationId(id: string | null | undefined): boolean {
  return id === SENTINEL;
}
