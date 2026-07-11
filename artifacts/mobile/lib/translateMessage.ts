import i18n from "@/i18n";

const LANG_MAP: Record<string, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  ro: "ro",
  hu: "hu",
  el: "el",
  zh: "zh-CN",
  ja: "ja",
};

export async function translateMessage(
  text: string,
  targetLang?: string
): Promise<string> {
  const target = LANG_MAP[targetLang ?? i18n.language ?? "en"] ?? "en";
  if (!text.trim()) return text;

  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}` +
    `&langpair=autodetect|${target}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation request failed: ${res.status}`);
  const data = await res.json();

  const translated: string | undefined = data?.responseData?.translatedText;
  if (!translated || data.responseStatus === 403) {
    throw new Error("Translation failed or quota exceeded");
  }
  return translated;
}
