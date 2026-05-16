import { resolveHelloAoTranslationId } from "../data/featuredTranslations";

const API = "https://bible.helloao.org/api";

export interface TranslationSummary {
  id: string;
  name: string;
  englishName: string;
  shortName: string;
  language: string;
  languageEnglishName?: string;
  textDirection: "ltr" | "rtl";
}

export interface AvailableTranslations {
  translations: TranslationSummary[];
}

export interface TranslationBook {
  id: string;
  name: string;
  commonName: string;
  numberOfChapters: number;
}

export interface TranslationBooksResponse {
  books: TranslationBook[];
}

export type ChapterContentPiece =
  | { type: "heading"; content: string[] }
  | { type: "line_break" }
  | { type: "hebrew_subtitle"; content: unknown[] }
  | { type: "verse"; number: number; content: unknown[] };

export interface ChapterResponse {
  translation: TranslationSummary;
  book: TranslationBook;
  chapter: {
    number: number;
    content: ChapterContentPiece[];
  };
  numberOfVerses: number;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Bible API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function fetchTranslations(): Promise<AvailableTranslations> {
  return getJson<AvailableTranslations>("/available_translations.json");
}

export function fetchChapter(
  translationId: string,
  bookId: string,
  chapter: number,
): Promise<ChapterResponse> {
  const helloaoId = resolveHelloAoTranslationId(translationId);
  return getJson<ChapterResponse>(
    `/${encodeURIComponent(helloaoId)}/${encodeURIComponent(bookId)}/${chapter}.json`,
  ).then((chapterJson) => {
    if (helloaoId === translationId) return chapterJson;
    return { ...chapterJson, translation: { ...chapterJson.translation, id: translationId } };
  });
}
