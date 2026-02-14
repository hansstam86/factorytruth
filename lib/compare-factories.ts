/** Client-only: localStorage key for entrepreneur "compare" factory IDs. */
export const COMPARE_STORAGE_KEY = "factorytruth_compare_ids";
export const COMPARE_MAX = 6;

export function getCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

export function setCompareIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = ids.slice(0, COMPARE_MAX);
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function addToCompare(id: string): void {
  const ids = getCompareIds();
  if (ids.includes(id) || ids.length >= COMPARE_MAX) return;
  setCompareIds([...ids, id]);
}

export function removeFromCompare(id: string): void {
  setCompareIds(getCompareIds().filter((x) => x !== id));
}

export function toggleCompare(id: string): boolean {
  const ids = getCompareIds();
  if (ids.includes(id)) {
    removeFromCompare(id);
    return false;
  }
  if (ids.length >= COMPARE_MAX) return false;
  addToCompare(id);
  return true;
}

export function isInCompare(id: string): boolean {
  return getCompareIds().includes(id);
}
