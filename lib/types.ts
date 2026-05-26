export type LanguageCode =
  | "en"
  | "as" | "bn" | "bo" | "doi" | "gu" | "hi" | "ks" | "kn"
  | "kok" | "mai" | "ml" | "mni" | "mr" | "ne" | "or" | "pa"
  | "sa" | "sat" | "sd" | "ta" | "te" | "ur";

export interface LanguageInfo {
  name: string;
  native: string;
  bcp47: string;
  speechLang: string;
  ttsCode: string;
}

export const LANGUAGE_INFO: Record<LanguageCode, LanguageInfo> = {
  en:   { name: "English",    native: "English",       bcp47: "en-IN",  speechLang: "en-IN",  ttsCode: "en-IN" },
  as:   { name: "Assamese",   native: "অসমীয়া",        bcp47: "as-IN",  speechLang: "as-IN",  ttsCode: "as-IN" },
  bn:   { name: "Bengali",    native: "বাংলা",          bcp47: "bn-IN",  speechLang: "bn-IN",  ttsCode: "bn-IN" },
  bo:   { name: "Bodo",       native: "बरʼ",           bcp47: "bo-IN",  speechLang: "bo-IN",  ttsCode: "bo-IN" },
  doi:  { name: "Dogri",      native: "डोगरी",          bcp47: "doi-IN", speechLang: "doi-IN", ttsCode: "doi-IN" },
  gu:   { name: "Gujarati",   native: "ગુજરાતી",        bcp47: "gu-IN",  speechLang: "gu-IN",  ttsCode: "gu-IN" },
  hi:   { name: "Hindi",      native: "हिंदी",          bcp47: "hi-IN",  speechLang: "hi-IN",  ttsCode: "hi-IN" },
  ks:   { name: "Kashmiri",   native: "कॉशुर",          bcp47: "ks-IN",  speechLang: "ks-IN",  ttsCode: "ks-IN" },
  kn:   { name: "Kannada",    native: "ಕನ್ನಡ",          bcp47: "kn-IN",  speechLang: "kn-IN",  ttsCode: "kn-IN" },
  kok:  { name: "Konkani",    native: "कोंकणी",         bcp47: "kok-IN", speechLang: "kok-IN", ttsCode: "kok-IN" },
  mai:  { name: "Maithili",   native: "मैथिली",         bcp47: "mai-IN", speechLang: "mai-IN", ttsCode: "mai-IN" },
  ml:   { name: "Malayalam",  native: "മലയാളം",        bcp47: "ml-IN",  speechLang: "ml-IN",  ttsCode: "ml-IN" },
  mni:  { name: "Manipuri",   native: "মৈতৈলোন্",      bcp47: "mni-IN", speechLang: "mni-IN", ttsCode: "mni-IN" },
  mr:   { name: "Marathi",    native: "मराठी",          bcp47: "mr-IN",  speechLang: "mr-IN",  ttsCode: "mr-IN" },
  ne:   { name: "Nepali",     native: "नेपाली",          bcp47: "ne-IN",  speechLang: "ne-IN",  ttsCode: "ne-IN" },
  or:   { name: "Odia",       native: "ଓଡ଼ିଆ",          bcp47: "or-IN",  speechLang: "or-IN",  ttsCode: "or-IN" },
  pa:   { name: "Punjabi",    native: "ਪੰਜਾਬੀ",         bcp47: "pa-IN",  speechLang: "pa-IN",  ttsCode: "pa-IN" },
  sa:   { name: "Sanskrit",   native: "संस्कृतम्",       bcp47: "sa-IN",  speechLang: "sa-IN",  ttsCode: "sa-IN" },
  sat:  { name: "Santali",    native: "ᱥᱟᱱᱛᱟᱲᱤ",        bcp47: "sat-IN", speechLang: "sat-IN", ttsCode: "sat-IN" },
  sd:   { name: "Sindhi",     native: "सिन्धी",          bcp47: "sd-IN",  speechLang: "sd-IN",  ttsCode: "sd-IN" },
  ta:   { name: "Tamil",      native: "தமிழ்",          bcp47: "ta-IN",  speechLang: "ta-IN",  ttsCode: "ta-IN" },
  te:   { name: "Telugu",     native: "తెలుగు",         bcp47: "te-IN",  speechLang: "te-IN",  ttsCode: "te-IN" },
  ur:   { name: "Urdu",       native: "اردو",            bcp47: "ur-IN",  speechLang: "ur-IN",  ttsCode: "ur-IN" },
};

export function isLanguageCode(code: string): code is LanguageCode {
  return code in LANGUAGE_INFO;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}
