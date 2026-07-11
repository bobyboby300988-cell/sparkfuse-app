import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import ro from "./locales/ro";
import hu from "./locales/hu";
import el from "./locales/el";
import zh from "./locales/zh";
import ja from "./locales/ja";
import pt from "./locales/pt";
import it from "./locales/it";
import ru from "./locales/ru";
import ar from "./locales/ar";
import hi from "./locales/hi";
import ko from "./locales/ko";
import tr from "./locales/tr";
import nl from "./locales/nl";
import pl from "./locales/pl";
import sv from "./locales/sv";
import no from "./locales/no";
import fi from "./locales/fi";
import da from "./locales/da";
import cs from "./locales/cs";
import sk from "./locales/sk";
import uk from "./locales/uk";
import bg from "./locales/bg";
import hr from "./locales/hr";
import sr from "./locales/sr";
import lt from "./locales/lt";
import lv from "./locales/lv";
import et from "./locales/et";
import id from "./locales/id";
import ms from "./locales/ms";
import th from "./locales/th";
import vi from "./locales/vi";
import fa from "./locales/fa";
import he from "./locales/he";
import ur from "./locales/ur";
import bn from "./locales/bn";
import ta from "./locales/ta";
import sw from "./locales/sw";
import af from "./locales/af";
import ca from "./locales/ca";
import sl from "./locales/sl";
import mk from "./locales/mk";
import sq from "./locales/sq";
import is from "./locales/is";
import ga from "./locales/ga";
import cy from "./locales/cy";
import mr from "./locales/mr";

export const SUPPORTED_LANGUAGES = [
  "en","es","fr","de","ro","hu","el","zh","ja",
  "pt","it","ru","ar","hi","ko","tr","nl","pl","sv","no",
  "fi","da","cs","sk","uk","bg","hr","sr","lt","lv",
  "et","id","ms","th","vi","fa","he","ur","bn","ta",
  "sw","af","ca","sl","mk","sq","is","ga","cy","mr",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "@spark/language";

function getDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()[0]?.languageCode ?? "en";
  const base = locale.split("-")[0];
  if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
    return base as SupportedLanguage;
  }
  return "en";
}

export async function getSavedLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // ignore
  }
  return getDeviceLanguage();
}

export async function saveLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    ro: { translation: ro },
    hu: { translation: hu },
    el: { translation: el },
    zh: { translation: zh },
    ja: { translation: ja },
    pt: { translation: pt },
    it: { translation: it },
    ru: { translation: ru },
    ar: { translation: ar },
    hi: { translation: hi },
    ko: { translation: ko },
    tr: { translation: tr },
    nl: { translation: nl },
    pl: { translation: pl },
    sv: { translation: sv },
    no: { translation: no },
    fi: { translation: fi },
    da: { translation: da },
    cs: { translation: cs },
    sk: { translation: sk },
    uk: { translation: uk },
    bg: { translation: bg },
    hr: { translation: hr },
    sr: { translation: sr },
    lt: { translation: lt },
    lv: { translation: lv },
    et: { translation: et },
    id: { translation: id },
    ms: { translation: ms },
    th: { translation: th },
    vi: { translation: vi },
    fa: { translation: fa },
    he: { translation: he },
    ur: { translation: ur },
    bn: { translation: bn },
    ta: { translation: ta },
    sw: { translation: sw },
    af: { translation: af },
    ca: { translation: ca },
    sl: { translation: sl },
    mk: { translation: mk },
    sq: { translation: sq },
    is: { translation: is },
    ga: { translation: ga },
    cy: { translation: cy },
    mr: { translation: mr },
  },
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
