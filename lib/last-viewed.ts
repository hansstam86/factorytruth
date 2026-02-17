/** Client-only: last viewed factory for "Continue" link. */
const STORAGE_KEY = "factorytruth_last_viewed";

export type LastViewed = { id: string; name: string };

export function setLastViewed(id: string, name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }));
    window.dispatchEvent(new CustomEvent("factorytruth-last-viewed"));
  } catch {
    // ignore
  }
}

export function getLastViewed(): LastViewed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "id" in parsed && "name" in parsed &&
        typeof (parsed as LastViewed).id === "string" && typeof (parsed as LastViewed).name === "string") {
      return parsed as LastViewed;
    }
    return null;
  } catch {
    return null;
  }
}
