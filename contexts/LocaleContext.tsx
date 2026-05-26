"use client";

import React, { createContext, useContext, useState } from "react";
import type { LanguageCode } from "@/lib/types";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import ta from "@/locales/ta.json";
import te from "@/locales/te.json";
import ml from "@/locales/ml.json";
import kn from "@/locales/kn.json";
import as from "@/locales/as.json";
import bn from "@/locales/bn.json";
import bo from "@/locales/bo.json";
import doi from "@/locales/doi.json";
import gu from "@/locales/gu.json";
import ks from "@/locales/ks.json";
import kok from "@/locales/kok.json";
import mai from "@/locales/mai.json";
import mni from "@/locales/mni.json";
import mr from "@/locales/mr.json";
import ne from "@/locales/ne.json";
import or from "@/locales/or.json";
import pa from "@/locales/pa.json";
import sa from "@/locales/sa.json";
import sat from "@/locales/sat.json";
import sd from "@/locales/sd.json";
import ur from "@/locales/ur.json";

interface LocaleData {
  language_name: string;
  language_native: string;
  greeting: string;
  placeholder: string;
  quickQuestions: string[];
  farmData: {
    title: string;
    temp: string;
    humidity: string;
    moisture: string;
    uv: string;
    high: string;
  };
  clearChat?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  listen?: string;
  playing?: string;
  quickQuestionsTitle?: string;
  callAIExpert?: string;
  emergencyServices?: string;
  governmentHelplines?: string;
  quickGuide?: string;
  tip?: string;
  clickAbove?: string;
  agriHelplines?: string;
  kisanDesc?: string;
  govSchemes?: string;
  pmkisanDesc?: string;
  aiExpert?: string;
  aiExpertDesc?: string;
  tipDesc?: string;
  helplineCategoryAgriculture?: string;
  helplineCategoryGovtSchemes?: string;
  helplineCategoryWeather?: string;
  helplineContactKisanCallCenter?: string;
  helplineContactNationalFarmers?: string;
  helplineContactAgriBusiness?: string;
  helplineContactPmKisan?: string;
  helplineContactPmKisanTollFree?: string;
  helplineContactNhb?: string;
  helplineContactWeather?: string;
  helplineContactCropInsurance?: string;
}

interface LocaleContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: LocaleData;
}

const LOCALE_MAP: Record<string, LocaleData> = { en, hi, ta, te, ml, kn, as, bn, bo, doi, gu, ks, kok, mai, mni, mr, ne, or, pa, sa, sat, sd, ur };

const FALLBACK_LOCALE: LocaleData = en;

function resolveLocale(lang: LanguageCode): LocaleData {
  const locale = LOCALE_MAP[lang];
  if (!locale) return FALLBACK_LOCALE;
  return { ...FALLBACK_LOCALE, ...locale };
}

const LocaleContext = createContext<LocaleContextType>({
  lang: "en",
  setLang: () => {},
  t: FALLBACK_LOCALE,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("en");

  return (
    <LocaleContext.Provider value={{ lang, setLang, t: resolveLocale(lang) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
