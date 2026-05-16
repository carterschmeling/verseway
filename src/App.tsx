import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChapterContentPiece, ChapterResponse, TranslationSummary } from "./api/bible";
import { fetchChapter, fetchTranslations } from "./api/bible";
import {
  fetchScriptureNltChapter,
  isScriptureNltOffered,
  isScriptureNltTranslationId,
  SCRIPTURE_NLT_SUMMARY,
} from "./api/scriptureApiBible";
import {
  CURATED_TRANSLATIONS,
  curatedAsSummaries,
  curatedTranslation,
  translationMatchesSearch,
} from "./data/featuredTranslations";
import { LEARNING_PATH } from "./data/path";
import {
  awardBadges,
  BADGE_META,
  partitionFeatured,
  xpIntoCurrentLevel,
} from "./lib/gamification";
import { buildQuiz, type QuizQuestion } from "./lib/quiz";
import { SHOP_ITEMS, flairLabel, shopItem } from "./lib/shop";
import {
  bumpStreak,
  getSessionHint,
  loadState,
  resetLessonProgress,
  saveState,
  signInState,
  signedOutState,
  type AppState,
  type Settings,
  type UserProfile,
} from "./lib/storage";
import { extractVerses, flattenVerseContent } from "./lib/verseText";

function playChime(ok: boolean, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = ok ? 880 : 220;
    g.gain.value = 0.06;
    o.start();
    o.stop(ctx.currentTime + 0.11);
    o.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}

function readerTextClass(scale: Settings["fontScale"]): string {
  if (scale === "large") return "text-lg leading-relaxed sm:text-xl";
  if (scale === "compact") return "text-sm leading-snug sm:text-base";
  return "text-base leading-relaxed sm:text-lg";
}

type Phase = "signin" | "version" | "main" | "read" | "quiz";

type MainTab = "path" | "shop" | "badges" | "profile";

function nextPhase(state: AppState): Phase {
  if (!state.user) return "signin";
  if (!state.translationId) return "version";
  return "main";
}

function isLessonUnlocked(index: number, completed: string[]): boolean {
  if (index === 0) return true;
  const prev = LEARNING_PATH[index - 1];
  return prev ? completed.includes(prev.id) : true;
}

function BlockView({ block, readerClass }: { block: ChapterContentPiece; readerClass: string }) {
  if (block.type === "heading") {
    return (
      <h3 className="font-display mt-8 mb-3 text-xl font-semibold text-indigo-950 first:mt-0 dark:text-indigo-100">
        {block.content.join(" ")}
      </h3>
    );
  }
  if (block.type === "hebrew_subtitle") {
    return (
      <p className="mb-4 text-sm italic text-slate-500 dark:text-slate-400">
        {flattenVerseContent(block.content as unknown[])}
      </p>
    );
  }
  if (block.type === "line_break") {
    return <div className="h-4" />;
  }
  if (block.type === "verse") {
    const verses = extractVerses([block]);
    const text = verses[0]?.text ?? "";
    return (
      <p className={`mb-3 break-words pl-0 text-slate-800 dark:text-slate-100 md:pl-2 ${readerClass}`}>
        <span className="mr-2 inline-block min-w-[1.75rem] align-top text-sm font-bold text-indigo-500 dark:text-indigo-300 sm:min-w-[2rem]">
          {block.number}
        </span>
        <span className="[overflow-wrap:anywhere]">{text}</span>
      </p>
    );
  }
  return null;
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [phase, setPhase] = useState<Phase>(() => nextPhase(loadState()));

  const [translations, setTranslations] = useState<TranslationSummary[]>([]);
  const [transFilter, setTransFilter] = useState("");
  /** HelloAO returns every translation in one request; when false we only browse English to keep the list short. */
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);

  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const quizScoreRef = useRef(0);
  const quizComboRef = useRef(0);
  const quizComboMaxRef = useRef(0);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [mainTab, setMainTab] = useState<MainTab>("path");
  const sessionHint = useMemo(() => getSessionHint(), []);

  const persist = useCallback((update: AppState | ((prev: AppState) => AppState)) => {
    setState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      saveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setPhase(nextPhase(state));
  }, [state.user, state.translationId]);

  useEffect(() => {
    const flush = () => saveState(state);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [state]);

  const versionSections = useMemo(() => {
    const q = transFilter.trim();
    const englishOnly = !showAllLanguages;
    if (q) {
      const curatedHits = curatedAsSummaries().filter((t) => translationMatchesSearch(t, q));
      let otherHits = translations
        .filter((t) => !CURATED_TRANSLATIONS.some((c) => c.id === t.id))
        .filter((t) => translationMatchesSearch(t, q));
      if (englishOnly) {
        otherHits = otherHits.filter(
          (t) => t.language === "eng" || t.languageEnglishName === "English",
        );
      }
      const list = [...curatedHits, ...otherHits].slice(0, 120);
      return { mode: "search" as const, list };
    }
    const { featured, other } = partitionFeatured(translations, { englishOnly });
    return { mode: "split" as const, featured, other };
  }, [translations, transFilter, showAllLanguages]);

  useEffect(() => {
    if (phase !== "version" || translations.length > 0) return;
    setTransLoading(true);
    setTransError(null);
    fetchTranslations()
      .then((r) => {
        const curatedIds = new Set(CURATED_TRANSLATIONS.map((c) => c.id));
        const curatedHelloao = new Set(CURATED_TRANSLATIONS.map((c) => c.helloaoId));
        const rest = r.translations.filter(
          (t) =>
            t.id !== SCRIPTURE_NLT_SUMMARY.id &&
            !curatedIds.has(t.id) &&
            !curatedHelloao.has(t.id),
        );
        const head = isScriptureNltOffered()
          ? [SCRIPTURE_NLT_SUMMARY, ...curatedAsSummaries()]
          : curatedAsSummaries();
        setTranslations([...head, ...rest]);
      })
      .catch(() => setTransError("Could not load Bible versions. Check your connection."))
      .finally(() => setTransLoading(false));
  }, [phase, translations.length]);

  const signIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const displayName = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    if (!displayName || !email.includes("@")) return;
    const user: UserProfile = { displayName, email: email.trim() };
    const next = signInState(user);
    persist(next);
    setPhase(nextPhase(next));
  };

  const pickTranslation = (id: string) => {
    persist((prev) => ({ ...prev, translationId: id }));
    setMainTab("path");
    setPhase("main");
  };

  const buyFromShop = (itemId: string) => {
    const item = shopItem(itemId);
    if (!item) return;
    if (state.gems < item.costGems) {
      setToast("Not enough gems — clear more lessons!");
      return;
    }
    if (item.kind === "cosmetic" && state.ownedShopIds.includes(item.id)) {
      setToast("Already yours — equip it in Profile.");
      return;
    }
    persist((prev) => {
      if (prev.gems < item.costGems) return prev;
      if (item.kind === "cosmetic" && prev.ownedShopIds.includes(item.id)) return prev;
      const gems = prev.gems - item.costGems;
      if (item.kind === "consumable" && item.xpBonus) {
        return { ...prev, gems, xp: prev.xp + item.xpBonus };
      }
      const ownedShopIds = prev.ownedShopIds.includes(item.id)
        ? prev.ownedShopIds
        : [...prev.ownedShopIds, item.id];
      return { ...prev, gems, ownedShopIds, equippedFlairId: item.id };
    });
    if (item.kind === "consumable" && item.xpBonus) {
      setToast(`+${item.xpBonus} XP`);
    } else {
      setToast("New flair equipped!");
    }
  };

  const signOut = () => {
    persist((prev) => signedOutState(prev));
    setPhase("signin");
    setChapter(null);
    setQuizQuestions([]);
  };

  const openLesson = (index: number) => {
    if (!isLessonUnlocked(index, state.completedLessonIds)) return;
    setActiveLessonIndex(index);
    const lesson = LEARNING_PATH[index];
    if (!lesson || !state.translationId) return;
    setPhase("read");
    setChapter(null);
    setChapterError(null);
    setChapterLoading(true);
    const chapterPromise = isScriptureNltTranslationId(state.translationId)
      ? fetchScriptureNltChapter(lesson.ref.book, lesson.ref.chapter)
      : fetchChapter(state.translationId, lesson.ref.book, lesson.ref.chapter);
    chapterPromise
      .then(setChapter)
      .catch((err: unknown) =>
        setChapterError(
          err instanceof Error ? err.message : "Could not load this chapter. Check your connection.",
        ),
      )
      .finally(() => setChapterLoading(false));
  };

  const startQuiz = () => {
    if (!chapter) return;
    setChapterError(null);
    const verses = extractVerses(chapter.chapter.content);
    const qs = buildQuiz(verses, 5);
    if (qs.length === 0) {
      setChapterError("This chapter is too short for a quiz. Try another lesson.");
      return;
    }
    setQuizQuestions(qs);
    setQuizIndex(0);
    quizScoreRef.current = 0;
    quizComboRef.current = 0;
    quizComboMaxRef.current = 0;
    setQuizFeedback(null);
    setShowConfetti(false);
    setDisplayCombo(0);
    setPicked(null);
    setQuizDone(false);
    setQuizPassed(false);
    setPhase("quiz");
  };

  const answerQuestion = (choice: string) => {
    if (picked !== null || quizDone) return;
    const q = quizQuestions[quizIndex];
    if (!q) return;
    const ok = choice === q.correct;
    if (ok) {
      quizScoreRef.current += 1;
      quizComboRef.current += 1;
      quizComboMaxRef.current = Math.max(quizComboMaxRef.current, quizComboRef.current);
      setDisplayCombo((c) => c + 1);
    } else {
      quizComboRef.current = 0;
      setDisplayCombo(0);
    }
    playChime(ok, state.settings.soundEffects && !state.settings.reduceMotion);
    setQuizFeedback(ok ? "correct" : "wrong");
    setPicked(choice);
  };

  useEffect(() => {
    if (phase !== "quiz" || quizDone || picked === null) return;
    const lessonIndex = activeLessonIndex;
    const t = window.setTimeout(() => {
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex((i) => i + 1);
        setPicked(null);
        setQuizFeedback(null);
      } else {
        const finalCorrect = quizScoreRef.current;
        const need = 4;
        const actuallyPassed = finalCorrect >= need;
        setQuizDone(true);
        setQuizPassed(actuallyPassed);
        const maxCombo = quizComboMaxRef.current;
        if (actuallyPassed && !state.settings.reduceMotion) setShowConfetti(true);
        if (actuallyPassed) {
          const lesson = LEARNING_PATH[lessonIndex];
          const perfect = finalCorrect === quizQuestions.length;
          const xpGain = 25 + finalCorrect * 5 + (perfect ? 25 : 0);
          const gemGain = 6 + (perfect ? 6 : 0) + Math.min(maxCombo, 5);
          persist((prev) => {
            if (!lesson || prev.completedLessonIds.includes(lesson.id)) return prev;
            let next = bumpStreak(prev);
            next = {
              ...next,
              completedLessonIds: [...prev.completedLessonIds, lesson.id],
              xp: prev.xp + xpGain,
              gems: prev.gems + gemGain,
            };
            const gained = awardBadges(
              {
                badgesUnlocked: prev.badgesUnlocked,
                completedLessonIds: prev.completedLessonIds,
                streak: prev.streak,
                xp: prev.xp,
                gems: prev.gems,
              },
              {
                badgesUnlocked: prev.badgesUnlocked,
                completedLessonIds: next.completedLessonIds,
                streak: next.streak,
                xp: next.xp,
                gems: next.gems,
              },
              maxCombo,
              { perfectThisLesson: perfect },
            );
            const badges = [...next.badgesUnlocked];
            for (const b of gained) {
              if (!badges.includes(b)) badges.push(b);
            }
            next = { ...next, badgesUnlocked: badges };
            return next;
          });
          setToast(`+${xpGain} XP · +${gemGain} gems`);
        }
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [phase, picked, quizDone, quizIndex, quizQuestions, persist, activeLessonIndex, state.settings.reduceMotion]);

  const currentQ = quizQuestions[quizIndex];
  const lesson = LEARNING_PATH[activeLessonIndex];
  const activeCurated = curatedTranslation(state.translationId ?? "");
  const transName =
    (activeCurated
      ? `${activeCurated.familiarName} · ${activeCurated.englishName}`
      : translations.find((t) => t.id === state.translationId)?.englishName) ??
    (isScriptureNltTranslationId(state.translationId) ? SCRIPTURE_NLT_SUMMARY.englishName : null) ??
    state.translationId;

  const readBarReserve = phase === "read" && chapter && !chapterLoading;
  const mainTabBarReserve = phase === "main";
  const shellClass =
    phase === "signin"
      ? "app-shell app-shell--signin"
      : phase === "main"
        ? "app-shell app-shell--main"
        : "app-shell";
  const shellPadBottom = readBarReserve ? "pb-read-cta" : mainTabBarReserve ? "pb-nav" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]";
  const readerClass = readerTextClass(state.settings.fontScale);
  const { into, need, level } = xpIntoCurrentLevel(state.xp);
  const pathProgress = state.completedLessonIds.length / LEARNING_PATH.length;
  const badgeTotal = Object.keys(BADGE_META).length;
  const badgeProgress = badgeTotal > 0 ? state.badgesUnlocked.length / badgeTotal : 0;
  const xpBarPct = need > 0 ? Math.min(100, (into / need) * 100) : 0;
  const activePathStepIndex = useMemo(() => {
    for (let i = 0; i < LEARNING_PATH.length; i++) {
      const les = LEARNING_PATH[i];
      if (!les) continue;
      if (isLessonUnlocked(i, state.completedLessonIds) && !state.completedLessonIds.includes(les.id)) return i;
    }
    return -1;
  }, [state.completedLessonIds]);

  const translationRow = (t: TranslationSummary) => {
    const curated = curatedTranslation(t.id);
    return (
      <li key={t.id}>
        <button
          type="button"
          onClick={() => pickTranslation(t.id)}
          className="flex min-h-[52px] w-full touch-manipulation flex-col gap-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 active:scale-[0.99] active:bg-indigo-100/60 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 flex-1 break-words font-semibold leading-snug text-slate-800 dark:text-slate-100">
              {curated ? (
                <>
                  {curated.familiarName}
                  <span className="font-normal text-slate-500 dark:text-slate-400"> · {curated.englishName}</span>
                </>
              ) : (
                t.englishName
              )}
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-indigo-500 dark:text-indigo-300">
              {curated?.shortName ?? t.shortName}
            </span>
          </span>
          {curated && (
            <span className="text-xs leading-snug text-slate-500 dark:text-slate-400">{curated.pickerNote}</span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={`${shellClass} ${shellPadBottom}`}>
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 top-[max(5rem,env(safe-area-inset-top))] z-50 flex justify-center px-4"
          role="status"
        >
          <div className="animate-sp-pop rounded-2xl border border-emerald-200/80 bg-emerald-500 px-5 py-3 text-center text-sm font-extrabold text-white shadow-xl dark:border-emerald-700 dark:bg-emerald-600">
            {toast}
          </div>
        </div>
      )}
      {phase === "version" && (
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-balance text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-100 sm:text-2xl md:text-3xl">
              Verseway
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              Walk Scripture · remember it
            </p>
          </div>
          {state.user && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={signOut}
                className="min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 underline decoration-slate-300 decoration-2 underline-offset-4 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Sign out
              </button>
            </div>
          )}
        </header>
      )}

      {phase === "main" && state.user && mainTab === "path" && (
        <header className="path-header mb-0 px-3 pb-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-display text-lg font-extrabold tracking-tight">Verseway</span>
            <div className="flex shrink-0 items-center gap-3 text-sm font-extrabold tabular-nums">
              <span title="Day streak" className="flex items-center gap-0.5">
                <span aria-hidden>🔥</span>
                {state.streak}
              </span>
              <span title="Gems" className="flex items-center gap-0.5">
                <span aria-hidden>💎</span>
                {state.gems}
              </span>
              <span title="Level" className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">
                Lv{level}
              </span>
            </div>
          </div>
          <p className="mb-2 text-center text-[10px] font-medium text-emerald-50/90">Path · level · badges (top to bottom)</p>
          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-50">
                <span>Path</span>
                <span className="tabular-nums opacity-95">
                  {state.completedLessonIds.length}/{LEARNING_PATH.length}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, pathProgress * 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-50">
                <span>Level</span>
                <span className="tabular-nums opacity-95">
                  {into}/{need}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-amber-200 transition-all duration-500"
                  style={{ width: `${xpBarPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-50">
                <span>Badges</span>
                <span className="tabular-nums opacity-95">
                  {state.badgesUnlocked.length}/{badgeTotal}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-amber-100/90 transition-all duration-500"
                  style={{ width: `${Math.min(100, badgeProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start justify-between gap-3 border-t border-white/25 pt-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-100">Your path</p>
              <p className="truncate text-sm font-bold leading-snug">Genesis → Revelation</p>
              <p className="mt-0.5 truncate text-xs font-medium text-emerald-50/90">
                {state.completedLessonIds.length} of {LEARNING_PATH.length} chapters cleared
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPhase("version")}
              className="shrink-0 rounded-xl border-2 border-white/40 bg-white/15 px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm hover:bg-white/25 active:scale-[0.98]"
            >
              Bible
            </button>
          </div>
        </header>
      )}

      {phase === "main" && state.user && mainTab !== "path" && (
        <header className="mb-3 space-y-2 border-b border-slate-100/80 pb-3 dark:border-slate-800/80">
          <div className="flex items-center justify-center">
            <span className="font-display text-base font-bold tracking-tight text-indigo-950 dark:text-indigo-100">
              Verseway
            </span>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800/60">
            <p className="text-center text-[10px] text-slate-500 dark:text-slate-400">Path · level · badges (top to bottom)</p>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Path</span>
                <span className="tabular-nums text-indigo-600 dark:text-indigo-300">
                  {state.completedLessonIds.length}/{LEARNING_PATH.length}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, pathProgress * 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Level {level}</span>
                <span className="tabular-nums text-indigo-600 dark:text-indigo-300">
                  {into}/{need} XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${xpBarPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Badges</span>
                <span className="tabular-nums text-amber-700 dark:text-amber-300">
                  {state.badgesUnlocked.length}/{badgeTotal}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, badgeProgress * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-center text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
              🔥 {state.streak} streak · 💎 {state.gems} gems
            </p>
          </div>
        </header>
      )}

      {(phase === "read" || phase === "quiz") && state.user && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-center">
            <span className="font-display text-sm font-bold tracking-tight text-indigo-950 dark:text-indigo-100">Verseway</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0">
              <p className="mb-0.5 truncate text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Path
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500"
                  style={{ width: `${Math.min(100, pathProgress * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-center text-[9px] font-bold tabular-nums text-indigo-600 dark:text-indigo-300">
                {Math.round(pathProgress * 100)}%
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 truncate text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Level
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${xpBarPct}%` }}
                />
              </div>
              <p className="mt-0.5 text-center text-[9px] font-bold tabular-nums text-indigo-600 dark:text-indigo-300">
                Lv{level}
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 truncate text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Badges
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ width: `${Math.min(100, badgeProgress * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-center text-[9px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {state.badgesUnlocked.length}/{badgeTotal}
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === "signin" && (
        <main className="flex flex-1 flex-col justify-center py-2">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-500 text-3xl shadow-lift">
              📖
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-indigo-950 dark:text-indigo-100">
              Verseway
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              Walk Scripture · remember it
            </p>
          </div>
          <div className="card-surface p-5 sm:p-8">
            {sessionHint && (
              <p className="mb-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-center text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                Welcome back, {sessionHint.displayName}! Use the same email to restore your progress.
              </p>
            )}
            <p className="mb-6 text-center text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Read a chapter, then prove you remember it—like a gentle Duolingo for Scripture.
            </p>
            <form onSubmit={signIn} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="name">
                  Display name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  defaultValue={sessionHint?.displayName ?? ""}
                  enterKeyHint="next"
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-indigo-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="e.g. Carter"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={sessionHint?.email ?? ""}
                  enterKeyHint="done"
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-indigo-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Progress is saved on this device per email. After you sign in once, you stay signed in when you reopen
                the app. Sign out only if you want to switch accounts.
              </p>
              <button
                type="submit"
                className="btn-primary"
              >
                Continue
              </button>
            </form>
          </div>
        </main>
      )}

      {phase === "version" && (
        <main className="main-scroll flex-1">
          <h2 className="font-display mb-2 text-xl font-bold text-indigo-950 dark:text-indigo-100">
            Pick your Bible
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Featured versions (NIV, KJV, ESV, and more) use the closest{" "}
            <span className="font-semibold">free</span> text from the public{" "}
            <a className="font-semibold text-indigo-700 underline dark:text-indigo-300" href="https://helloao.org/">
              HelloAO
            </a>{" "}
            Bible API — no account or API key. Labels show the familiar name; notes show the actual translation. After you start, use the{" "}
            <span className="font-semibold text-indigo-700 dark:text-indigo-200">Profile</span> tab for theme, text size, and sounds.
          </p>
          {isScriptureNltOffered() && (
            <p className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <span className="font-semibold">NLT</span> is enabled via{" "}
              <a className="font-semibold text-indigo-700 underline dark:text-indigo-300" href="https://scripture.api.bible/">
                API.Bible
              </a>{" "}
              (<code className="rounded bg-white/80 px-1 dark:bg-slate-900/60">VITE_SCRIPTURE_API_KEY</code> or dev{" "}
              <code className="rounded bg-white/80 px-1 dark:bg-slate-900/60">VITE_SCRIPTURE_DEV_PROXY=1</code> with{" "}
              <code className="rounded bg-white/80 px-1 dark:bg-slate-900/60">SCRIPTURE_API_KEY</code> in{" "}
              <code className="rounded bg-white/80 px-1 dark:bg-slate-900/60">.env</code>).
            </p>
          )}
          <label className="mb-3 flex cursor-pointer select-none items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={showAllLanguages}
              onChange={(e) => setShowAllLanguages(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show all languages ({translations.length} versions)</span>
          </label>
          <input
            value={transFilter}
            onChange={(e) => setTransFilter(e.target.value)}
            placeholder="Search all translations…"
            className="mb-4 min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-indigo-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          {transError && <p className="mb-4 text-red-600">{transError}</p>}
          {transLoading && <p className="text-slate-500 dark:text-slate-400">Loading translations…</p>}
          <div className="max-h-[min(58dvh,calc(100svh-13rem))] space-y-4 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {versionSections.mode === "search" ? (
              <ul className="space-y-2">{versionSections.list.map((t) => translationRow(t))}</ul>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                    Featured
                  </p>
                  <ul className="space-y-2">{versionSections.featured.map((t) => translationRow(t))}</ul>
                </div>
                {versionSections.other.length > 0 && (
                  <details className="group rounded-2xl border border-slate-200/80 bg-white/60 p-3 dark:border-slate-600 dark:bg-slate-800/50">
                    <summary className="cursor-pointer list-none text-sm font-bold text-slate-700 after:ml-2 after:text-indigo-500 after:content-['▾'] group-open:after:content-['▴'] dark:text-slate-200">
                      More translations ({versionSections.other.length})
                    </summary>
                    <ul className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                      {versionSections.other.map((t) => translationRow(t))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        </main>
      )}

      {phase === "main" && (
        <>
          <main
            className={`main-scroll ${mainTab === "path" ? "bg-slate-50 dark:bg-slate-950/40" : "px-0.5"}`}
          >
            {mainTab === "path" && (
              <>
                <div className="-mt-1 mb-2 rounded-t-3xl bg-slate-50 px-3 pb-1 pt-3 dark:bg-slate-900/70">
                  <p className="truncate text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {transName}
                  </p>
                </div>

                <div className="relative mx-auto max-w-[360px] px-1 pb-8 pt-1">
                  <div
                    className="pointer-events-none absolute left-1/2 top-10 bottom-16 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute right-1 top-[18%] select-none text-5xl opacity-[0.18] dark:opacity-25"
                    aria-hidden
                  >
                    📖
                  </div>
                  <div
                    className="pointer-events-none absolute bottom-[22%] left-0 select-none text-4xl opacity-[0.14] dark:opacity-20"
                    aria-hidden
                  >
                    🕊️
                  </div>

                  <ol className="relative z-10">
                    {LEARNING_PATH.map((les, i) => {
                      const unlocked = isLessonUnlocked(i, state.completedLessonIds);
                      const done = state.completedLessonIds.includes(les.id);
                      const active = unlocked && !done;
                      const isStart = active && activePathStepIndex === i;
                      const alignLeft = i % 2 === 0;
                      return (
                        <li key={les.id} className="relative flex min-h-[3.75rem] items-center py-0.5">
                          <div
                            className={`flex w-full items-center ${alignLeft ? "justify-start pl-1" : "justify-end pr-1"}`}
                          >
                            <div className="flex max-w-[46%] flex-col items-center sm:max-w-[48%]">
                              {isStart && (
                                <span className="mb-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 shadow-sm dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300">
                                  Start
                                </span>
                              )}
                              <button
                                type="button"
                                disabled={!unlocked}
                                title={`${les.title} — ${les.subtitle}`}
                                onClick={() => openLesson(i)}
                                className={`relative flex touch-manipulation items-center justify-center rounded-full font-extrabold shadow-md transition active:scale-95 disabled:cursor-not-allowed ${
                                  done
                                    ? "h-14 w-14 min-h-[48px] min-w-[48px] bg-amber-400 text-amber-950 ring-2 ring-amber-600/35 dark:bg-amber-500 dark:text-amber-950 dark:ring-amber-800/50"
                                    : active
                                      ? "h-[3.75rem] w-[3.75rem] min-h-[52px] min-w-[52px] scale-105 bg-emerald-500 text-lg text-white shadow-emerald-900/30 ring-4 ring-amber-300/90 dark:bg-emerald-500 dark:ring-amber-400/70"
                                      : "h-12 w-12 min-h-[48px] min-w-[48px] bg-slate-300 text-slate-600 shadow-inner dark:bg-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {done ? (
                                  <span className="text-xl" aria-hidden>
                                    ✓
                                  </span>
                                ) : active ? (
                                  <span className="text-2xl leading-none" aria-hidden>
                                    ★
                                  </span>
                                ) : (
                                  <span className="text-lg opacity-80" aria-hidden>
                                    🔒
                                  </span>
                                )}
                                {active && !state.settings.reduceMotion && (
                                  <span className="pointer-events-none absolute inset-0 animate-sp-pulse-ring rounded-full border-2 border-white/60" />
                                )}
                              </button>
                              <span className="mt-1 max-w-[7rem] truncate text-center text-[10px] font-bold leading-tight text-slate-600 dark:text-slate-400">
                                {les.ref.book} {les.ref.chapter}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mx-auto mt-2 max-w-xs text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Tap the glowing step to read the chapter, then pass the memory check.
                  </p>
                </div>
              </>
            )}

            {mainTab === "shop" && (
              <>
                <h2 className="font-display mb-2 text-xl font-bold text-indigo-950 dark:text-indigo-100">Shop</h2>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                  Spend gems from quizzes. Cosmetics show on your top bar.
                </p>
                <ul className="space-y-3 pb-2">
                  {SHOP_ITEMS.map((item) => {
                    const ownedCosmetic = item.kind === "cosmetic" && state.ownedShopIds.includes(item.id);
                    const canPay = state.gems >= item.costGems;
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/80"
                      >
                        <span className="text-3xl leading-none" aria-hidden>
                          {item.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-bold text-slate-900 dark:text-slate-50">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                              {item.costGems} gems
                            </span>
                            {item.kind === "consumable" && (
                              <button
                                type="button"
                                disabled={!canPay}
                                onClick={() => buyFromShop(item.id)}
                                className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-violet-200/50 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-none"
                              >
                                Buy
                              </button>
                            )}
                            {item.kind === "cosmetic" && !ownedCosmetic && (
                              <button
                                type="button"
                                disabled={!canPay}
                                onClick={() => buyFromShop(item.id)}
                                className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-violet-200/50 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-none"
                              >
                                Unlock
                              </button>
                            )}
                            {item.kind === "cosmetic" && ownedCosmetic && (
                              <button
                                type="button"
                                onClick={() => persist((p) => ({ ...p, equippedFlairId: item.id }))}
                                className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-xs font-extrabold transition ${
                                  state.equippedFlairId === item.id
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                                    : "border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50 dark:border-indigo-600 dark:bg-slate-800 dark:text-indigo-100 dark:hover:bg-slate-700"
                                }`}
                              >
                                {state.equippedFlairId === item.id ? "Equipped" : "Equip"}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {mainTab === "badges" && (
              <>
                <h2 className="font-display mb-1 text-xl font-bold text-indigo-950 dark:text-indigo-100">Badges</h2>
                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                  Collect badges as you read, streak, and level up. Your path, level, and streak stay on the Path tab.
                </p>
                <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/80 p-4 shadow-md dark:border-indigo-900/50 dark:from-slate-800 dark:to-indigo-950/50">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Path completion</span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      {Math.round(pathProgress * 100)}%
                    </span>
                  </div>
                  <div className="mb-1 h-3 overflow-hidden rounded-full bg-indigo-100 dark:bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, pathProgress * 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>
                      Level {level} · {into}/{need} XP to next level
                    </span>
                    <span className="font-semibold text-violet-700 dark:text-violet-300">{state.gems} gems</span>
                  </div>
                </div>

                <h3 className="font-display mb-2 text-lg font-bold text-indigo-950 dark:text-indigo-100">Collection</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(BADGE_META).map(([id, b]) => {
                    const got = state.badgesUnlocked.includes(id);
                    return (
                      <div
                        key={id}
                        className={`rounded-2xl border p-3 ${
                          got
                            ? "border-amber-200 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/35"
                            : "border-slate-100 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-2xl ${got ? "" : "opacity-40 grayscale"}`}>{b.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-50">{b.label}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{b.desc}</p>
                            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {got ? "Unlocked" : "Locked"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {mainTab === "profile" && state.user && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl font-bold text-indigo-950 dark:text-indigo-100">Profile</h2>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Account, flair, and app settings.</p>

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{state.user.displayName}</p>
                  <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{state.user.email}</p>
                  {flairLabel(state.equippedFlairId) && (
                    <p className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      {flairLabel(state.equippedFlairId)}
                    </p>
                  )}
                  {state.ownedShopIds.some((oid) => shopItem(oid)?.kind === "cosmetic") && (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-600">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Flair
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {state.ownedShopIds
                          .filter((oid) => shopItem(oid)?.kind === "cosmetic")
                          .map((oid) => {
                            const it = shopItem(oid);
                            if (!it) return null;
                            return (
                              <button
                                key={oid}
                                type="button"
                                onClick={() => persist((p) => ({ ...p, equippedFlairId: oid }))}
                                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                                  state.equippedFlairId === oid
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                }`}
                              >
                                {it.emoji} {it.title}
                              </button>
                            );
                          })}
                        <button
                          type="button"
                          onClick={() => persist((p) => ({ ...p, equippedFlairId: null }))}
                          className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 dark:border-slate-600 dark:text-slate-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Appearance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme</span>
                      <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-600">
                        {(["light", "dark"] as const).map((th) => (
                          <button
                            key={th}
                            type="button"
                            onClick={() => persist((p) => ({ ...p, settings: { ...p.settings, theme: th } }))}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
                              state.settings.theme === th
                                ? "bg-indigo-600 text-white"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            }`}
                          >
                            {th}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Reading size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(["compact", "comfortable", "large"] as const).map((fs) => (
                          <button
                            key={fs}
                            type="button"
                            onClick={() => persist((p) => ({ ...p, settings: { ...p.settings, fontScale: fs } }))}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${
                              state.settings.fontScale === fs
                                ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-100"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            }`}
                          >
                            {fs}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Audio & motion
                  </h3>
                  <label className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quiz sounds</span>
                    <input
                      type="checkbox"
                      checked={state.settings.soundEffects}
                      onChange={(e) =>
                        persist((p) => ({ ...p, settings: { ...p.settings, soundEffects: e.target.checked } }))
                      }
                      className="h-5 w-5 accent-indigo-600"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Reduce motion</span>
                    <input
                      type="checkbox"
                      checked={state.settings.reduceMotion}
                      onChange={(e) =>
                        persist((p) => ({ ...p, settings: { ...p.settings, reduceMotion: e.target.checked } }))
                      }
                      className="h-5 w-5 accent-indigo-600"
                    />
                  </label>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Bible
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPhase("version")}
                    className="min-h-[48px] w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-md hover:bg-indigo-700"
                  >
                    Choose Bible translation
                  </button>
                </section>

                <section className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-800 dark:text-red-200">
                    Danger zone
                  </h3>
                  <p className="mb-3 text-xs text-red-900/90 dark:text-red-100/90">
                    Reset lessons, XP, streak, gems, badges, and shop unlocks on this device. Your name and email stay.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Reset all lesson progress, badges, and shop unlocks on this device?")) {
                        persist((p) => resetLessonProgress(p));
                        setToast("Progress reset — fresh start!");
                        setMainTab("path");
                      }
                    }}
                    className="min-h-[48px] w-full rounded-xl border-2 border-red-300 bg-white px-4 py-3 text-sm font-extrabold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-200 dark:hover:bg-red-950/40"
                  >
                    Reset lesson progress
                  </button>
                </section>

                <button
                  type="button"
                  onClick={signOut}
                  className="min-h-[52px] w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </main>

          <nav className="bottom-bar" aria-label="Main">
            <div className="bottom-bar-inner">
              {(
                [
                  ["path", "Path", "📖"] as const,
                  ["shop", "Shop", "🛒"] as const,
                  ["badges", "Badges", "🏅"] as const,
                  ["profile", "Profile", "👤"] as const,
                ] as const
              ).map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-current={mainTab === id ? "page" : undefined}
                  onClick={() => setMainTab(id)}
                  className={`tab-btn ${mainTab === id ? "tab-btn--active" : "tab-btn--idle"}`}
                >
                  <span className="text-[1.4rem] leading-none" aria-hidden>
                    {icon}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase leading-tight tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </>
      )}

      {phase === "read" && lesson && (
        <>
          <main
            className="main-scroll flex-1 pb-2"
            dir={chapter?.translation.textDirection === "rtl" ? "rtl" : "ltr"}
          >
            <button
              type="button"
              onClick={() => {
                setPhase("main");
                setMainTab("path");
                setChapter(null);
              }}
              className="mb-4 inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center rounded-lg px-1 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:underline active:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-slate-800"
            >
              ← Path
            </button>
            <h2 className="font-display mb-1 text-2xl font-bold text-indigo-950 dark:text-indigo-100">{lesson.subtitle}</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-300">{lesson.title}</p>
            {chapterLoading && <p className="text-slate-500 dark:text-slate-400">Opening chapter…</p>}
            {chapterError && <p className="text-red-600">{chapterError}</p>}
            {chapter && (
              <article className="reader-panel">
                {chapter.chapter.content.map((block, i) => (
                  <BlockView key={i} block={block} readerClass={readerClass} />
                ))}
              </article>
            )}
          </main>
          {chapter && !chapterLoading && (
            <div className="sticky-cta pt-3">
              <div className="mx-auto w-full max-w-lg md:max-w-2xl">
                <button type="button" onClick={startQuiz} className="btn-primary">
                  I read it — quiz me
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "quiz" && currentQ && lesson && (
        <main className="main-scroll flex min-h-0 flex-1 flex-col pb-4">
          <button
            type="button"
            onClick={() => setPhase("read")}
            className="mb-4 inline-flex min-h-[44px] touch-manipulation items-center self-start rounded-lg px-1 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:underline active:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-slate-800"
          >
            ← Reading
          </button>
          {!quizDone ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div
                  className="flex min-h-[44px] flex-1 flex-col justify-center py-1"
                  aria-hidden
                >
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-300"
                      style={{
                        width: `${((quizIndex + (picked !== null ? 1 : 0)) / quizQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                {displayCombo >= 2 && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-900 dark:bg-orange-950/60 dark:text-orange-100">
                    Combo ×{displayCombo}
                  </span>
                )}
              </div>
              <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Memory check · {quizIndex + 1}/{quizQuestions.length}
              </p>
              <h2 className="font-display mb-4 text-xl font-bold text-indigo-950 dark:text-indigo-100">
                Which word fits the blank?
              </h2>
              <div className="mb-6 break-words rounded-2xl border border-slate-100 bg-white p-4 text-base leading-relaxed text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 sm:p-5 sm:text-lg">
                <span className="[overflow-wrap:anywhere]">{currentQ.promptBefore}</span>
                <span className="mx-1 inline-block min-w-[3.5rem] rounded-lg bg-amber-100 px-2 py-1 text-center text-sm font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-100 sm:min-w-[4rem] sm:text-base">
                  {picked === null ? "____" : picked}
                </span>
                <span className="[overflow-wrap:anywhere]">{currentQ.promptAfter}</span>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Verse {currentQ.verseNumber}</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {currentQ.choices.map((c) => {
                  const show = picked !== null;
                  const isCorrect = c === currentQ.correct;
                  const isPicked = c === picked;
                  let cls =
                    "min-h-[3.25rem] w-full touch-manipulation rounded-2xl border-2 px-4 py-4 text-left text-base font-bold leading-snug transition [overflow-wrap:anywhere] break-words active:scale-[0.98] sm:min-h-[52px] sm:py-5 ";
                  if (!show) {
                    cls +=
                      "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 active:bg-indigo-100/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-400 dark:hover:bg-slate-700/80";
                  } else if (isCorrect) {
                    cls += "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-100";
                  } else if (isPicked) {
                    cls += "border-red-400 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100";
                  } else {
                    cls += "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500";
                  }
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={picked !== null}
                      onClick={() => answerQuestion(c)}
                      className={cls}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {quizFeedback && (
                <p
                  className={`mt-4 text-center text-sm font-bold ${
                    quizFeedback === "correct"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {quizFeedback === "correct"
                    ? "Nice! That matches the chapter."
                    : "So close — peek at the chapter again after this round."}
                </p>
              )}
            </>
          ) : (
            <div className="relative flex flex-1 flex-col items-center justify-center px-1 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
              {showConfetti && quizPassed && !state.settings.reduceMotion && (
                <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      className="animate-sp-confetti absolute text-xl will-change-transform"
                      style={{
                        left: `${5 + (i % 8) * 12}%`,
                        top: "-5%",
                        animationDelay: `${i * 0.07}s`,
                      }}
                    >
                      {["✨", "⭐", "📖", "💎"][i % 4]}
                    </span>
                  ))}
                </div>
              )}
              {quizPassed ? (
                <>
                  <div className="relative z-[1] mb-3 text-6xl animate-sp-pop">🏆</div>
                  <h2 className="relative z-[1] font-display mb-2 text-balance text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                    Lesson cleared!
                  </h2>
                  <p className="relative z-[1] mb-8 max-w-prose text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    New lesson unlocked. Open <span className="font-semibold text-indigo-600 dark:text-indigo-300">Badges</span> to see new unlocks and your collection.
                  </p>
                </>
              ) : (
                <>
                  <div className="relative z-[1] mb-3 text-6xl">💪</div>
                  <h2 className="relative z-[1] font-display mb-2 text-balance text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">
                    Almost there
                  </h2>
                  <p className="relative z-[1] mb-8 max-w-prose text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    You need 4 of 5 correct. Re-read the chapter — you&apos;ve got this.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowConfetti(false);
                  if (quizPassed) {
                    setPhase("main");
                    setMainTab("path");
                  } else setPhase("read");
                  setQuizQuestions([]);
                  setQuizDone(false);
                }}
                className="relative z-[1] min-h-[52px] w-full max-w-sm touch-manipulation rounded-2xl bg-indigo-600 px-4 py-3.5 text-base font-extrabold text-white shadow-lg hover:bg-indigo-700 active:bg-indigo-800 sm:text-lg"
              >
                {quizPassed ? "Back to path" : "Back to reading"}
              </button>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
