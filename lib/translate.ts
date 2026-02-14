/**
 * Translate Chinese text to English for entrepreneur display.
 * Uses DeepL API when DEEPL_AUTH_KEY is set; otherwise returns original text.
 */

const DEEPL_AUTH_KEY = process.env.DEEPL_AUTH_KEY;
const DEEPL_API =
  process.env.DEEPL_API_URL || "https://api-free.deepl.com/v2/translate";

function isTranslatableValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("uploads/")) return false;
  if (trimmed.startsWith("[") && trimmed.includes("path")) return false;
  return true;
}

function quickMap(value: string): string | null {
  const v = value.trim();
  if (v === "是") return "Yes";
  if (v === "否") return "No";
  return null;
}

async function translateWithDeepL(text: string): Promise<string> {
  if (!DEEPL_AUTH_KEY) return text;
  try {
    const params = new URLSearchParams({
      auth_key: DEEPL_AUTH_KEY,
      text,
      source_lang: "ZH",
      target_lang: "EN",
    });
    const res = await fetch(DEEPL_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("DeepL translate error", res.status, err);
      return text;
    }
    const data = (await res.json()) as { translations?: { text?: string }[] };
    const translated = data.translations?.[0]?.text;
    return typeof translated === "string" ? translated : text;
  } catch (e) {
    console.error("DeepL translate exception", e);
    return text;
  }
}

/**
 * Translate a single text. Returns original if no API key or on failure.
 */
export async function translateToEnglish(text: string): Promise<string> {
  const mapped = quickMap(text);
  if (mapped !== null) return mapped;
  if (!isTranslatableValue(text)) return text;
  return translateWithDeepL(text);
}

/**
 * Build answersEn from answers by translating each translatable value.
 * File paths and JSON arrays are copied as-is (no translation).
 */
export async function translateAnswers(
  answers: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const entries = Object.entries(answers);
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    if (!isTranslatableValue(value)) {
      result[key] = value;
      continue;
    }
    result[key] = await translateToEnglish(value);
  }
  return result;
}
