import type { VerseLine } from "./verseText";

export interface QuizQuestion {
  id: string;
  verseNumber: number;
  promptBefore: string;
  promptAfter: string;
  correct: string;
  choices: string[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const WORD = /[\p{L}\p{N}']+/gu;

function wordSpans(text: string): { word: string; start: number; end: number }[] {
  const out: { word: string; start: number; end: number }[] = [];
  const re = new RegExp(WORD.source, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function buildQuiz(
  verses: VerseLine[],
  count: number,
  rng: () => number = Math.random,
): QuizQuestion[] {
  const pool = verses.filter((v) => wordSpans(v.text).some((s) => s.word.length >= 5));
  if (pool.length === 0) return [];

  const allWords = new Set<string>();
  for (const v of verses) {
    for (const s of wordSpans(v.text)) {
      if (s.word.length >= 4) allWords.add(s.word);
    }
  }
  const wordList = [...allWords];

  const usedVerse = new Set<number>();
  const questions: QuizQuestion[] = [];

  for (let q = 0; q < count; q++) {
    const candidates = pool.filter((v) => !usedVerse.has(v.number));
    const pickFrom = candidates.length > 0 ? candidates : pool;
    const verse = pickFrom[Math.floor(rng() * pickFrom.length)]!;
    usedVerse.add(verse.number);

    const spans = wordSpans(verse.text).filter((s) => s.word.length >= 5);
    const span = spans[Math.floor(rng() * spans.length)]!;
    const target = span.word;
    const before = verse.text.slice(0, span.start).trimEnd();
    const after = verse.text.slice(span.end).trimStart();

    const distractors: string[] = [];
    const attempts = shuffle(
      wordList.filter((w) => w.toLowerCase() !== target.toLowerCase()),
      rng,
    );
    for (const w of attempts) {
      if (distractors.length >= 3) break;
      if (w.length >= 4 && w.length <= Math.max(target.length + 6, 14)) distractors.push(w);
    }
    while (distractors.length < 3) {
      distractors.push(["peace", "faith", "hope", "love", "Lord", "Spirit"][distractors.length]!);
    }

    const choices = shuffle([target, ...distractors.slice(0, 3)], rng);

    questions.push({
      id: `${verse.number}-${q}-${target}`,
      verseNumber: verse.number,
      promptBefore: before,
      promptAfter: after,
      correct: target,
      choices,
    });
  }

  return questions;
}
