import { isScriptureNltOffered, SCRIPTURE_NLT_TRANSLATION_ID } from "../api/scriptureApiBible";
import { migrateTranslationId } from "../data/featuredTranslations";

export interface UserProfile {
  displayName: string;
  email: string;
}

export interface Settings {
  theme: "light" | "dark";
  /** Reader + UI density */
  fontScale: "comfortable" | "compact" | "large";
  soundEffects: boolean;
  reduceMotion: boolean;
}

const defaultSettings = (): Settings => ({
  theme: "light",
  fontScale: "comfortable",
  soundEffects: true,
  reduceMotion: false,
});

export interface AppState {
  user: UserProfile | null;
  translationId: string | null;
  /** lesson ids passed with quiz */
  completedLessonIds: string[];
  xp: number;
  streak: number;
  lastActiveYmd: string | null;
  gems: number;
  badgesUnlocked: string[];
  /** One-time shop purchases (cosmetic ids, etc.) */
  ownedShopIds: string[];
  /** Profile flair from shop cosmetics */
  equippedFlairId: string | null;
  settings: Settings;
}

const KEY = "scripture-path-v1";

interface UserRecord {
  displayName: string;
  email: string;
  translationId: string | null;
  completedLessonIds: string[];
  xp: number;
  streak: number;
  lastActiveYmd: string | null;
  gems: number;
  badgesUnlocked: string[];
  ownedShopIds: string[];
  equippedFlairId: string | null;
  settings: Settings;
}

interface StorageVault {
  v: 2;
  /** Normalized email of the last signed-in user (session). */
  activeEmail: string | null;
  users: Record<string, UserRecord>;
}

const defaultState = (): AppState => ({
  user: null,
  translationId: null,
  completedLessonIds: [],
  xp: 0,
  streak: 0,
  lastActiveYmd: null,
  gems: 0,
  badgesUnlocked: [],
  ownedShopIds: [],
  equippedFlairId: null,
  settings: defaultSettings(),
});

function defaultUserRecord(displayName: string, email: string, settings?: Settings): UserRecord {
  return {
    displayName,
    email,
    translationId: null,
    completedLessonIds: [],
    xp: 0,
    streak: 0,
    lastActiveYmd: null,
    gems: 0,
    badgesUnlocked: [],
    ownedShopIds: [],
    equippedFlairId: null,
    settings: settings ?? defaultSettings(),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeSettings(settingsIn: Record<string, unknown>, fallback: Settings): Settings {
  return {
    ...fallback,
    theme: settingsIn.theme === "dark" ? "dark" : "light",
    fontScale:
      settingsIn.fontScale === "compact" || settingsIn.fontScale === "large"
        ? settingsIn.fontScale
        : "comfortable",
    soundEffects: settingsIn.soundEffects !== false,
    reduceMotion: settingsIn.reduceMotion === true,
  };
}

function normalizeTranslationId(id: string | null): string | null {
  let translationId = migrateTranslationId(id);
  if (translationId === SCRIPTURE_NLT_TRANSLATION_ID && !isScriptureNltOffered()) {
    translationId = "sp_nlt";
  }
  return translationId;
}

function normalizeUserRecord(raw: unknown, email: string, displayName: string): UserRecord {
  const base = defaultUserRecord(displayName, email);
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Record<string, unknown>;
  const settingsIn = p.settings && typeof p.settings === "object" ? (p.settings as Record<string, unknown>) : {};
  return {
    displayName: typeof p.displayName === "string" ? p.displayName : displayName,
    email: typeof p.email === "string" ? p.email : email,
    translationId: normalizeTranslationId((p.translationId as string | null) ?? null),
    completedLessonIds: Array.isArray(p.completedLessonIds) ? (p.completedLessonIds as string[]) : [],
    xp: typeof p.xp === "number" ? p.xp : 0,
    streak: typeof p.streak === "number" ? p.streak : 0,
    lastActiveYmd: typeof p.lastActiveYmd === "string" ? p.lastActiveYmd : null,
    gems: typeof p.gems === "number" ? p.gems : 0,
    badgesUnlocked: Array.isArray(p.badgesUnlocked) ? (p.badgesUnlocked as string[]) : [],
    ownedShopIds: Array.isArray(p.ownedShopIds) ? (p.ownedShopIds as string[]) : [],
    equippedFlairId: typeof p.equippedFlairId === "string" ? p.equippedFlairId : null,
    settings: normalizeSettings(settingsIn, base.settings),
  };
}

function normalizeFlatAppState(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Record<string, unknown>;
  const settingsIn = p.settings && typeof p.settings === "object" ? (p.settings as Record<string, unknown>) : {};
  const user = (p.user as AppState["user"]) ?? null;
  return {
    ...base,
    user,
    translationId: normalizeTranslationId((p.translationId as string | null) ?? null),
    completedLessonIds: Array.isArray(p.completedLessonIds) ? (p.completedLessonIds as string[]) : [],
    xp: typeof p.xp === "number" ? p.xp : 0,
    streak: typeof p.streak === "number" ? p.streak : 0,
    lastActiveYmd: typeof p.lastActiveYmd === "string" ? p.lastActiveYmd : null,
    gems: typeof p.gems === "number" ? p.gems : 0,
    badgesUnlocked: Array.isArray(p.badgesUnlocked) ? (p.badgesUnlocked as string[]) : [],
    ownedShopIds: Array.isArray(p.ownedShopIds) ? (p.ownedShopIds as string[]) : [],
    equippedFlairId: typeof p.equippedFlairId === "string" ? p.equippedFlairId : null,
    settings: normalizeSettings(settingsIn, base.settings),
  };
}

function userRecordToAppState(record: UserRecord): AppState {
  return {
    user: { displayName: record.displayName, email: record.email },
    translationId: record.translationId,
    completedLessonIds: record.completedLessonIds,
    xp: record.xp,
    streak: record.streak,
    lastActiveYmd: record.lastActiveYmd,
    gems: record.gems,
    badgesUnlocked: record.badgesUnlocked,
    ownedShopIds: record.ownedShopIds,
    equippedFlairId: record.equippedFlairId,
    settings: record.settings,
  };
}

function appStateToUserRecord(state: AppState): UserRecord | null {
  if (!state.user) return null;
  return {
    displayName: state.user.displayName,
    email: state.user.email,
    translationId: state.translationId,
    completedLessonIds: state.completedLessonIds,
    xp: state.xp,
    streak: state.streak,
    lastActiveYmd: state.lastActiveYmd,
    gems: state.gems,
    badgesUnlocked: state.badgesUnlocked,
    ownedShopIds: state.ownedShopIds,
    equippedFlairId: state.equippedFlairId,
    settings: state.settings,
  };
}

function emptyVault(): StorageVault {
  return { v: 2, activeEmail: null, users: {} };
}

function vaultFromFlat(flat: AppState): StorageVault {
  const vault = emptyVault();
  if (!flat.user) return vault;
  const key = normalizeEmail(flat.user.email);
  vault.users[key] = normalizeUserRecord(flat, flat.user.email, flat.user.displayName);
  vault.activeEmail = key;
  return vault;
}

function parseVault(raw: string): StorageVault {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") return emptyVault();
  const p = parsed as Record<string, unknown>;

  if (p.v === 2 && typeof p.users === "object" && p.users !== null) {
    const vault: StorageVault = {
      v: 2,
      activeEmail: typeof p.activeEmail === "string" ? p.activeEmail : null,
      users: {},
    };
    for (const [key, value] of Object.entries(p.users as Record<string, unknown>)) {
      const email = typeof (value as UserRecord)?.email === "string" ? (value as UserRecord).email : key;
      const displayName =
        typeof (value as UserRecord)?.displayName === "string" ? (value as UserRecord).displayName : email;
      vault.users[key] = normalizeUserRecord(value, email, displayName);
    }
    if (vault.activeEmail && !vault.users[vault.activeEmail]) {
      vault.activeEmail = null;
    }
    return vault;
  }

  return vaultFromFlat(normalizeFlatAppState(parsed));
}

function readVault(): StorageVault {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyVault();
    return parseVault(raw);
  } catch {
    return emptyVault();
  }
}

function writeVault(vault: StorageVault): void {
  localStorage.setItem(KEY, JSON.stringify(vault));
}

function persistUserToVault(state: AppState, vault: StorageVault): void {
  const record = appStateToUserRecord(state);
  if (!record) return;
  const key = normalizeEmail(record.email);
  vault.users[key] = record;
  vault.activeEmail = key;
}

/** Last signed-in profile for “welcome back” and form prefill. */
export function getSessionHint(): { email: string; displayName: string } | null {
  const vault = readVault();
  if (!vault.activeEmail) return null;
  const record = vault.users[vault.activeEmail];
  if (!record) return null;
  return { email: record.email, displayName: record.displayName };
}

export function loadState(): AppState {
  const vault = readVault();
  if (!vault.activeEmail) return defaultState();
  const record = vault.users[vault.activeEmail];
  if (!record) {
    vault.activeEmail = null;
    writeVault(vault);
    return defaultState();
  }
  return userRecordToAppState(record);
}

export function saveState(state: AppState): void {
  const vault = readVault();
  if (state.user) {
    persistUserToVault(state, vault);
  }
  writeVault(vault);
}

/** Sign in (or return) — loads this email’s saved progress from the device. */
export function signInState(user: UserProfile): AppState {
  const vault = readVault();
  const key = normalizeEmail(user.email);
  const email = user.email.trim();
  const existing = vault.users[key];
  const record = existing
    ? { ...existing, displayName: user.displayName, email }
    : defaultUserRecord(user.displayName, email);
  vault.users[key] = record;
  vault.activeEmail = key;
  writeVault(vault);
  return userRecordToAppState(record);
}

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Update streak when user completes activity today */
export function bumpStreak(prev: AppState): AppState {
  const t = todayYmd();
  if (prev.lastActiveYmd === t) return prev;
  let streak = prev.streak;
  if (!prev.lastActiveYmd) streak = 1;
  else if (prev.lastActiveYmd === addDaysYmd(t, -1)) streak += 1;
  else streak = 1;
  return { ...prev, streak, lastActiveYmd: t };
}

/** Sign out: saves progress under this user, clears session, keeps other accounts on device. */
export function signedOutState(prev: AppState): AppState {
  const vault = readVault();
  if (prev.user) {
    persistUserToVault(prev, vault);
  }
  vault.activeEmail = null;
  writeVault(vault);
  return {
    user: null,
    translationId: null,
    completedLessonIds: [],
    xp: 0,
    streak: 0,
    lastActiveYmd: null,
    gems: 0,
    badgesUnlocked: [],
    ownedShopIds: [],
    equippedFlairId: null,
    settings: prev.settings,
  };
}

/** Clear path progress and economy; keeps user, translation, settings */
export function resetLessonProgress(prev: AppState): AppState {
  return {
    ...prev,
    completedLessonIds: [],
    xp: 0,
    streak: 0,
    lastActiveYmd: null,
    gems: 0,
    badgesUnlocked: [],
    ownedShopIds: [],
    equippedFlairId: null,
  };
}
