/** Client-only: localStorage key for entrepreneur shortlist (saved factory IDs). */
export const SHORTLIST_STORAGE_KEY = "factorytruth_shortlist";
export const SHORTLIST_MAX = 100;

export function getShortlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, SHORTLIST_MAX) : [];
  } catch {
    return [];
  }
}

export function setShortlistIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = ids.slice(0, SHORTLIST_MAX);
    localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function addToShortlist(id: string): void {
  const ids = getShortlistIds();
  if (ids.includes(id) || ids.length >= SHORTLIST_MAX) return;
  setShortlistIds([...ids, id]);
}

export function removeFromShortlist(id: string): void {
  setShortlistIds(getShortlistIds().filter((x) => x !== id));
}

export function toggleShortlist(id: string): boolean {
  const ids = getShortlistIds();
  if (ids.includes(id)) {
    removeFromShortlist(id);
    return false;
  }
  if (ids.length >= SHORTLIST_MAX) return false;
  addToShortlist(id);
  return true;
}

export function isInShortlist(id: string): boolean {
  return getShortlistIds().includes(id);
}
