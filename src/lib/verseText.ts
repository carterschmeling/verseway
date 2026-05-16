import type { ChapterContentPiece } from "../api/bible";

function pieceToString(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node !== "object") return "";
  const o = node as Record<string, unknown>;
  if ("text" in o && typeof o.text === "string") return o.text;
  if ("heading" in o && typeof o.heading === "string") return o.heading;
  if ("lineBreak" in o) return " ";
  if ("noteId" in o) return "";
  if (Array.isArray(node)) return node.map(pieceToString).join("");
  return "";
}

export function flattenVerseContent(content: unknown[]): string {
  return content.map(pieceToString).join("").replace(/\s+/g, " ").trim();
}

export interface VerseLine {
  number: number;
  text: string;
}

export function extractVerses(chapterContent: ChapterContentPiece[]): VerseLine[] {
  const out: VerseLine[] = [];
  for (const block of chapterContent) {
    if (block.type === "verse") {
      const text = flattenVerseContent(block.content);
      if (text.length > 0) out.push({ number: block.number, text });
    }
  }
  return out;
}

const WORD = /[\p{L}\p{N}']+/gu;

export function tokenizeWords(text: string): string[] {
  return text.match(WORD) ?? [];
}
