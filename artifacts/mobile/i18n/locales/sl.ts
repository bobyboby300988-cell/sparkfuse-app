import en from './en';
import type { Translations } from './en';
import { LANGUAGE_NATIVE_NAMES } from './_languages';

const sl: Translations = { ...(en as unknown as Translations), languages: { ...LANGUAGE_NATIVE_NAMES } };

export default sl;
