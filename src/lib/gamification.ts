import type { TranslationSummary } from "../api/bible";
import {
  CURATED_PICKER_ORDER,
  partitionFeaturedTranslations,
} from "../data/featuredTranslations";
import { LEARNING_PATH } from "../data/path";

export interface BadgeStateSlice {
  badgesUnlocked: string[];
  completedLessonIds: string[];
  streak: number;
  xp: number;
  gems: number;
}

/** Curated picker ids (NIV, KJV, ESV, …) — always listed under Featured. */
export const POPULAR_TRANSLATION_ORDER: string[] = [...CURATED_PICKER_ORDER];

export function partitionFeatured(
  all: TranslationSummary[],
  options?: { query?: string; englishOnly?: boolean },
): { featured: TranslationSummary[]; other: TranslationSummary[] } {
  return partitionFeaturedTranslations(all, options);
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 120);
}

export function xpIntoCurrentLevel(xp: number): { into: number; need: number; level: number } {
  const level = levelFromXp(xp);
  const start = (level - 1) * 120;
  const need = 120;
  const into = xp - start;
  return { into, need, level };
}

export const BADGE_META: Record<
  string,
  { label: string; emoji: string; desc: string }
> = {
  first_win: { label: "First steps", emoji: "🌱", desc: "Clear your first lesson." },
  lessons_5: { label: "Getting going", emoji: "🚶", desc: "Clear 5 lessons on the path." },
  lessons_15: { label: "Deep roots", emoji: "🌳", desc: "Clear 15 lessons on the path." },
  lessons_30: { label: "Halfway hero", emoji: "🧭", desc: "Clear 30 lessons on the path." },
  lessons_50: { label: "Long obedience", emoji: "⛰️", desc: "Clear 50 lessons on the path." },
  lessons_75: { label: "Sojourner", emoji: "🥾", desc: "Clear 75 lessons on the path." },
  all_path: { label: "Pathfinder", emoji: "🏆", desc: "Finish every lesson on the path." },
  streak_3: { label: "On a roll", emoji: "🔥", desc: "Reach a 3-day streak." },
  streak_7: { label: "Week warrior", emoji: "⚡", desc: "Reach a 7-day streak." },
  streak_14: { label: "Fortnight faithful", emoji: "📅", desc: "Reach a 14-day streak." },
  streak_30: { label: "Monthly marvel", emoji: "🌙", desc: "Reach a 30-day streak." },
  xp_300: { label: "Scholar", emoji: "📜", desc: "Earn 300 XP." },
  xp_600: { label: "Bookworm", emoji: "📚", desc: "Earn 600 XP." },
  xp_1200: { label: "Sage", emoji: "✨", desc: "Earn 1,200 XP." },
  xp_2500: { label: "Lifelong learner", emoji: "🎓", desc: "Earn 2,500 XP." },
  gems_50: { label: "Pocket change", emoji: "🪙", desc: "Hold 50 gems at once." },
  gems_100: { label: "Gem collector", emoji: "💎", desc: "Hold 100 gems at once." },
  gems_300: { label: "Treasure keeper", emoji: "🏺", desc: "Hold 300 gems at once." },
  gems_600: { label: "Vault builder", emoji: "🏰", desc: "Hold 600 gems at once." },
  combo_5: { label: "Sharp mind", emoji: "🧠", desc: "Hit a 5-answer correct combo in one quiz." },
  quiz_perfect: { label: "Spotless round", emoji: "💯", desc: "Answer every quiz question correctly in a cleared lesson." },
};

export function awardBadges(
  prev: BadgeStateSlice,
  next: BadgeStateSlice,
  maxComboThisQuiz: number,
  opts?: { perfectThisLesson?: boolean },
): string[] {
  const gained: string[] = [];
  const has = (id: string) => prev.badgesUnlocked.includes(id);
  const add = (id: string) => {
    if (!has(id) && !gained.includes(id) && BADGE_META[id]) gained.push(id);
  };

  const wasCount = prev.completedLessonIds.length;
  const nowCount = next.completedLessonIds.length;
  const lessons = next.completedLessonIds.length;
  if (nowCount > wasCount) add("first_win");
  if (lessons >= 5) add("lessons_5");
  if (lessons >= 15) add("lessons_15");
  if (lessons >= 30) add("lessons_30");
  if (lessons >= 50) add("lessons_50");
  if (lessons >= 75) add("lessons_75");
  if (next.streak >= 3) add("streak_3");
  if (next.streak >= 7) add("streak_7");
  if (next.streak >= 14) add("streak_14");
  if (next.streak >= 30) add("streak_30");
  if (next.xp >= 300) add("xp_300");
  if (next.xp >= 600) add("xp_600");
  if (next.xp >= 1200) add("xp_1200");
  if (next.xp >= 2500) add("xp_2500");
  if (next.gems >= 50) add("gems_50");
  if (next.gems >= 100) add("gems_100");
  if (next.gems >= 300) add("gems_300");
  if (next.gems >= 600) add("gems_600");
  if (next.completedLessonIds.length >= LEARNING_PATH.length) add("all_path");
  if (maxComboThisQuiz >= 5) add("combo_5");
  if (opts?.perfectThisLesson) add("quiz_perfect");

  return gained;
}
