"use client";
import { useState, useEffect } from "react";
import { Phone, PhoneCall, Clock, Shield, ArrowRight, PhoneOff, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentCallModal from "@/components/helpline/AgentCallModal";

type LanguageCode = "en" | "hi" | "bn" | "te" | "ta" | "mr" | "gu" | "pa" | "ml" | "kn";

const LANGUAGES: Record<LanguageCode, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  hi: { name: "Hindi", native: "हिंदी" },
  bn: { name: "Bengali", native: "বাংলা" },
  te: { name: "Telugu", native: "తెలుగు" },
  ta: { name: "Tamil", native: "தமிழ்" },
  mr: { name: "Marathi", native: "मराठी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
};

const translations = {
  en: {
    pageTitle: "Helpline",
    pageSubtitle: "Emergency contacts and government helplines for farmers",
    callAIExpert: "Call AI Expert",
    emergencyServices: "Emergency Services",
    governmentHelplines: "Government Helplines",
    quickGuide: "Quick Guide",
    tip: "Tip",
    clickAbove: "Click on any number above to initiate a call.",
    agriHelplines: "Agricultural Helplines",
    kisanDesc: "Kisan Call Center (1800-180-1551) - Free service for farming queries",
    govSchemes: "Government Schemes",
    pmkisanDesc: "PM-KISAN helpline for farmer welfare scheme inquiries",
    aiExpert: "AI Expert",
    aiExpertDesc: "Get instant AI-powered agricultural assistance",
    tipDesc: "Use the AI Expert for instant answers to your farming questions - available 24/7",
  },
  hi: {
    pageTitle: "हेल्पलाइन",
    pageSubtitle: "किसानों के लिए आपातकालीन संपर्क और सरकारी हेल्पलाइन",
    callAIExpert: "AI विशेषज्ञ को कॉल करें",
    emergencyServices: "आपातकालीन सेवाएं",
    governmentHelplines: "सरकारी हेल्पलाइन",
    quickGuide: "त्वरित मार्गदर्शन",
    tip: "सुझाव",
    clickAbove: "कॉल शुरू करने के लिए ऊपर दिए गए किसी भी नंबर पर क्लिक करें।",
    agriHelplines: "कृषि हेल्पलाइन",
    kisanDesc: "किसान कॉल सेंटर (1800-180-1551) - कृषि प्रश्नों के लिए निःशुल्क सेवा",
    govSchemes: "सरकारी योजनाएं",
    pmkisanDesc: "PM-KISAN हेल्पलाइन किसान कल्याण योजना पूछताछ के लिए",
    aiExpert: "AI विशेषज्ञ",
    aiExpertDesc: "तुरंत AI-संचालित कृषि सहायता प्राप्त करें",
    tipDesc: "अपने खेती के प्रश्नों के लिए तुरंत उत्तर पाने के लिए AI विशेषज्ञ का उपयोग करें - 24/7 उपलब्ध",
  },
  bn: {
    pageTitle: "হেল্পলাইন",
    pageSubtitle: "কৃষকদের জন্য জরুরি যোগাযোগ এবং সরকারি হেল্পলাইন",
    callAIExpert: "AI বিশেষজ্ঞকে কল করুন",
    emergencyServices: "জরুরি সেবা",
    governmentHelplines: "সরকারি হেল্পলাইন",
    quickGuide: "দ্রুত নির্দেশিকা",
    tip: "পরামর্শ",
    clickAbove: "কল শুরু করতে উপরের যেকোনো নম্বরে ক্লিক করুন।",
    agriHelplines: "কৃষি হেল্পলাইন",
    kisanDesc: "কিসান কল সেন্টার (1800-180-1551) - কৃষি প্রশ্নের জন্য বিনামূল্যে সেবা",
    govSchemes: "সরকারি প্রকল্প",
    pmkisanDesc: "PM-KISAN হেল্পলাইন কৃষক কল্যাণ প্রকল্পের তথ্যের জন্য",
    aiExpert: "AI বিশেষজ্ঞ",
    aiExpertDesc: "তাৎক্ষণিক AI-চালিত কৃষি সহায়তা পান",
    tipDesc: "আপনার চাষ সংক্রান্ত প্রশ্নের তাৎক্ষণিক উত্তরের জন্য AI বিশেষজ্ঞ ব্যবহার করুন - 24/7 উপলব্ধ",
  },
  te: {
    pageTitle: " helpline",
    pageSubtitle: "రైతులకు అత్యావశ్యకContacts మరియు ప్రభుత్వ Helplines",
    callAIExpert: "AI నిపుణుడుకు కalls",
    emergencyServices: "అత్యావశ్యక services",
    governmentHelplines: "ప్రభుత్వ Helplines",
    quickGuide: "త్వరిత_guide",
    tip: "Tip",
    clickAbove: "Call ప్రారంభించడానికి పైన ఏదైనా Numberపై Clickచెయ్యండి.",
    agriHelplines: " agriculture Helpline",
    kisanDesc: "Kisan Call Center (1800-180-1551) - Agriculture Questionలకు ఉచిత service",
    govSchemes: "Government Schemes",
    pmkisanDesc: "PM-KISAN Helpline farmer welfare scheme information",
    aiExpert: "AI Expert",
    aiExpertDesc: "Instant AI-powered Agriculture assistance",
    tipDesc: "Your farming questionsకు Instant answersకు AI Expert ఉపయోగించండి - 24/7 available",
  },
  ta: {
    pageTitle: "உதவி தொலைப்பேசி",
    pageSubtitle: "விவசாயிகளுக்கு அவசர தொடர்புகள் மற்றும் அரசு உதவி தொலைப்பேசிகள்",
    callAIExpert: "AI நிபுணருக்கு அழைக்க",
    emergencyServices: "அவசர சேவைகள்",
    governmentHelplines: "அரசு உதவி தொலைப்பேசிகள்",
    quickGuide: "விரைவு வழிகாட்டி",
    tip: "Tip",
    clickAbove: "Call தொடங்க மேலே உள்ள எந்த Numberஐயும் Click செய்யுங்கள்.",
    agriHelplines: "விவசாய உதவி தொலைப்பேசி",
    kisanDesc: "Kisan Call Center (1800-180-1551) - விவசாய கேள்விகளுக்கு இலவச சேவை",
    govSchemes: "அரசு திட்டங்கள்",
    pmkisanDesc: "PM-KISAN Helpline விவசாயி நலத்திட்டம் விசாரணைக்கு",
    aiExpert: "AI நிபுணர்",
    aiExpertDesc: "Instant AI-powered விவசாய உதவி",
    tipDesc: "உங்கள் farming கேள்விகளுக்கு Instant பதில்களுக்கு AI Expert உபயோகிக்கவும் - 24/7 கிடைக்கிறது",
  },
  mr: {
    pageTitle: "हेल्पलाइन",
    pageSubtitle: "शेतकऱ्यांसाठी आपत्कालीन संपर्क आणि सरकारी हेल्पलाइन",
    callAIExpert: "AI तज्ञाला कॉल करा",
    emergencyServices: "आपत्कालीन सेवा",
    governmentHelplines: "सरकारी हेल्पलाइन",
    quickGuide: "त्वरित मार्गदर्शक",
    tip: "Tip",
    clickAbove: "Call सुरू करण्यासाठी वरील कोणत्याही Number वर Click करा.",
    agriHelplines: "शेती हेल्पलाइन",
    kisanDesc: "Kisan Call Center (1800-180-1551) - शेती प्रश्नांसाठी विनामूल्य सेवा",
    govSchemes: "सरकारी योजना",
    pmkisanDesc: "PM-KISAN हेल्पलाइन शेतकरी कल्याण योजना माहितीसाठी",
    aiExpert: "AI तज्ञ",
    aiExpertDesc: "त्वरित AI-शेती मदत",
    tipDesc: "तुमच्या शेती प्रश्नांची त्वरित उत्तरांसाठी AI Expert वापरा - 24/7 उपलब्ध",
  },
  gu: {
    pageTitle: "Helpline",
    pageSubtitle: "ખેડૂતો માટે તાત્કાલિક સંપર્કો અને સરકારી helplines",
    callAIExpert: "AI નિષ્ણાતને Call કરો",
    emergencyServices: "Emergency Services",
    governmentHelplines: "Government Helplines",
    quickGuide: "Quick Guide",
    tip: "Tip",
    clickAbove: "Call शરૂ કરવા માટે ઉપરની કોઈપણ Number પર Click કરો.",
    agriHelplines: "Agriculture Helpline",
    kisanDesc: "Kisan Call Center (1800-180-1551) - Agriculture Question માટે Free Service",
    govSchemes: "Government Schemes",
    pmkisanDesc: "PM-KISAN Helpline farmer welfare Scheme Information",
    aiExpert: "AI Expert",
    aiExpertDesc: "Instant AI-powered Agriculture assistance",
    tipDesc: "Your farming Questions માટે Instant Answers માટે AI Expert use કરો - 24/7 Available",
  },
  pa: {
    pageTitle: "Helpline",
    pageSubtitle: "ਕਿਸਾਨਾਂ ਲਈ ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਅਤੇ ਸਰਕਾਰੀ helplines",
    callAIExpert: "AI ਮਾਹਰ ਨੂੰ ਕਾਲ ਕਰੋ",
    emergencyServices: "Emergency Services",
    governmentHelplines: "Government Helplines",
    quickGuide: "Quick Guide",
    tip: "Tip",
    clickAbove: "Call ਸ਼ੁਰू ਕਰਨ ਲਈ ਉੱਤੇ ਕਿਸੇ ਵੀ Number 'ਤੇ Click ਕਰੋ.",
    agriHelplines: "Agriculture Helpline",
    kisanDesc: "Kisan Call Center (1800-180-1551) - Agriculture Questions ਲਈ Free Service",
    govSchemes: "Government Schemes",
    pmkisanDesc: "PM-KISAN Helpline farmer welfare Scheme Information",
    aiExpert: "AI Expert",
    aiExpertDesc: "Instant AI-powered Agriculture assistance",
    tipDesc: "Your farming Questions ਲਈ Instant Answers ਲਈ AI Expert ਵਰਤੋਂ - 24/7 Available",
  },
  ml: {
    pageTitle: "Helpline",
    pageSubtitle: "കര്‍ഷകര്‍ക്കായി അടിയന്തര ബന്ധങ്ങളും സര്‍ക്കാര്‍ ഹെല്‍പ്ലിനുകളും",
    callAIExpert: "AI വിദഗ്ധനെ വിളിക്കാന്‍",
    emergencyServices: "അടിയന്തര സേവനങ്ങള്‍",
    governmentHelplines: "സര്‍ക്കാര്‍ ഹെല്‍പ്ലിനുകള്‍",
    quickGuide: "വേഗത്തിലുള്ള ഗൈഡ്",
    tip: "Tip",
    clickAbove: "Call ആരംഭിക്കാന്‍ മുകളില്‍ ഏത് Numberലും Click ചെയ്യുക.",
    agriHelplines: "കാര്‍ഷിക ഹെല്‍പ്ലിന്‍",
    kisanDesc: "Kisan Call Center (1800-180-1551) - കാര്‍ഷിക ചോദ്യങ്ങള്‍ക്ക് സൗജന്യ സേവനം",
    govSchemes: "സര്‍ക്കാര്‍ പദ്ധതികള്‍",
    pmkisanDesc: "PM-KISAN Helpline കര്‍ഷക ക്ഷേമ പദ്ധതി അറിയാന്‍",
    aiExpert: "AI വിദഗ്ധന്‍",
    aiExpertDesc: "തൽസമയ AI-കാര്‍ഷിക സഹായം",
    tipDesc: "നിങ്ങളുടെ കാര്‍ഷിക ചോദ്യങ്ങള്‍ക്ക് തൽസമയ ഉത്തരങ്ങള്‍ക്ക് AI Expert ഉപയোഗിക്കുക - 24/7 ലഭ്യം",
  },
  kn: {
    pageTitle: "Helpline",
    pageSubtitle: "ರೈತರಿಗೆ ತುರ್ತು ಸಂಪರ್ಕಗಳು ಮತ್ತು ಸರ್ಕಾರಿ helplines",
    callAIExpert: "AI ತಜ್ಞರಿಗೆ ಕರೆ ಮಾಡಿ",
    emergencyServices: "ತುರ್ತು ಸೇವೆಗಳು",
    governmentHelplines: "ಸರ್ಕಾರಿ helplines",
    quickGuide: "ತ್ವರಿತ ಮಾರ್ಗದರ್ಶನ",
    tip: "Tip",
    clickAbove: "Call ಪ್ರಾರಂಭಿಸಲು ಮೇಲಿನ ಯಾವುದೇ Numberನ್ನು Click ಮಾಡಿ.",
    agriHelplines: "ಕೃಷಿ helpline",
    kisanDesc: "Kisan Call Center (1800-180-1551) - ಕೃಷಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉಚಿತ ಸೇವೆ",
    govSchemes: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
    pmkisanDesc: "PM-KISAN Helpline ರೈತ ಕಲ್ಯಾಣ ಯೋಜನಾ ಮಾಹಿತಿ",
    aiExpert: "AI ತಜ್ಞ",
    aiExpertDesc: "ತಕ್ಷಣದ AI-ಕೃಷಿ ಸಹಾಯ",
    tipDesc: "ನಿಮ್ಮ ಬೇಸಾಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ತಕ್ಷಣದ ಉತ್ತರಗಳಿಗೆ AI Expert ಬಳಸಿ - 24/7 ಲಭ್ಯ",
  },
};

const emergencyServices: Record<LanguageCode, { name: string; number: string; color: string; icon: string }[]> = {
  en: [
    { name: "Police", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "Ambulance", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Emergency", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  hi: [
    { name: "पुलिस", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "एम्बुलेंस", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "फायर", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "आपातकाल", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  bn: [
    { name: "পুলিশ", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "অ্যাম্বুলেন্স", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "দমকল", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "জরুরি", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  te: [
    { name: "Policе", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "Ambulaansu", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Aagul", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Avastham", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  ta: [
    { name: "Policе", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "Ambulaansu", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Udiral", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  mr: [
    { name: "पोलीस", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "AMBULANCE", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "आपत्काल", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  gu: [
    { name: "Poliсе", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "AMBULANCE", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Aag", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Udhadal", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  pa: [
    { name: "Police", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "AMBULANCE", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Aag", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Emergency", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  ml: [
    { name: "Poliсе", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "AMBULANCE", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Udiral", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
  kn: [
    { name: "Police", number: "100", color: "bg-blue-500", icon: "🚔" },
    { name: "AMBULANCE", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
    { name: "Aagi", number: "101", color: "bg-orange-500", icon: "🚒" },
    { name: "Utpanna", number: "112", color: "bg-purple-500", icon: "🆘" },
  ],
};

const helplines: Record<LanguageCode, Array<{
  category: string;
  categoryHi: string;
  icon: string;
  color: string;
  contacts: Array<{ label: string; labelHi: string; number: string; available: string }>;
}>> = {
  en: [
    {
      category: "Agriculture",
      categoryHi: "कृषि",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "किसान कॉल सेंटर", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "राष्ट्रीय किसान हेल्पलाइन", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "कृषि व्यापार केंद्र", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "सरकारी योजनाएं",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan हेल्पलाइन", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan टोल फ्री", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB हेल्पलाइन", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "मौसम और फसल",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "मौसम अपडेट", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "फसल बीमा", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  hi: [
    {
      category: "कृषि",
      categoryHi: "कृषि",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "किसान कॉल सेंटर", labelHi: "किसान कॉल सेंटर", number: "1800-180-1551", available: "24/7" },
        { label: "राष्ट्रीय किसान हेल्पलाइन", labelHi: "राष्ट्रीय किसान हेल्पलाइन", number: "1551", available: "24/7" },
        { label: "कृषि व्यापार केंद्र", labelHi: "कृषि व्यापार केंद्र", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "सरकारी योजनाएं",
      categoryHi: "सरकारी योजनाएं",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan हेल्पलाइन", labelHi: "PM-Kisan हेल्पलाइन", number: "155261", available: "24/7" },
        { label: "PM-Kisan टोल फ्री", labelHi: "PM-Kisan टोल फ्री", number: "1800115526", available: "24/7" },
        { label: "NHB हेल्पलाइन", labelHi: "NHB हेल्पलाइन", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "मौसम और फसल",
      categoryHi: "मौसम और फसल",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "मौसम अपडेट", labelHi: "मौसम अपडेट", number: "1800-180-1717", available: "24/7" },
        { label: "फसल बीमा", labelHi: "फसल बीमा", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  bn: [
    {
      category: "কৃষি",
      categoryHi: "কৃষি",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "কিসান কল সেন্টার", labelHi: "কিসান কল সেন্টার", number: "1800-180-1551", available: "24/7" },
        { label: "জাতীয় কিসান হেল্পলাইন", labelHi: "জাতীয় কিসান হেল্পলাইন", number: "1551", available: "24/7" },
        { label: "এগ্রি-বিজনেস সেন্টার", labelHi: "এগ্রি-বিজনেস সেন্টার", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "সরকারি প্রকল্প",
      categoryHi: "সরকারি প্রকল্প",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan হেল্পলাইন", labelHi: "PM-Kisan হেল্পলাইন", number: "155261", available: "24/7" },
        { label: "PM-Kisan টোল ফ্রি", labelHi: "PM-Kisan টোল ফ্রি", number: "1800115526", available: "24/7" },
        { label: "NHB হেল্পলাইন", labelHi: "NHB হেল্পলাইন", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "আবহাওয়া ও ফসল",
      categoryHi: "আবহাওয়া ও ফসল",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "আবহাওয়া আপডেট", labelHi: "আবহাওয়া আপডেট", number: "1800-180-1717", available: "24/7" },
        { label: "ফসল বীমা", labelHi: "ফসল বীমা", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  te: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  ta: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  mr: [
    {
      category: "शेती",
      categoryHi: "शेती",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  gu: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  pa: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  ml: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
  kn: [
    {
      category: "agriculture",
      categoryHi: "agriculture",
      icon: "🌾",
      color: "green",
      contacts: [
        { label: "Kisan Call Center", labelHi: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
        { label: "National Farmers Helpline", labelHi: "National Farmers Helpline", number: "1551", available: "24/7" },
        { label: "Agri-Business Center", labelHi: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
      ]
    },
    {
      category: "Government Schemes",
      categoryHi: "Government Schemes",
      icon: "🏛️",
      color: "blue",
      contacts: [
        { label: "PM-Kisan Helpline", labelHi: "PM-Kisan Helpline", number: "155261", available: "24/7" },
        { label: "PM-Kisan Toll Free", labelHi: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
        { label: "NHB Helpline", labelHi: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
      ]
    },
    {
      category: "Weather & Crop",
      categoryHi: "Weather & Crop",
      icon: "🌤️",
      color: "cyan",
      contacts: [
        { label: "Weather Updates", labelHi: "Weather Updates", number: "1800-180-1717", available: "24/7" },
        { label: "Crop Insurance", labelHi: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
      ]
    },
  ],
};

export default function HelplinePage() {
  const [lang, setLang] = useState<LanguageCode>("en");
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [emergencyCall, setEmergencyCall] = useState<{ name: string; number: string; icon: string } | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callTimer, setCallTimer] = useState(0);

  const t = translations[lang];
  const currentHelplines = helplines[lang];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleEmergencyClick(service: { name: string; number: string; icon: string }) {
    setEmergencyCall(service);
    setCallStatus("calling");
    setCallTimer(0);
    
    setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
  }

  function endEmergencyCall() {
    setCallStatus("ended");
    setTimeout(() => {
      setEmergencyCall(null);
      setCallStatus("idle");
    }, 1500);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>{t.pageTitle}</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>
            {t.pageSubtitle}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: 13,
              background: "#ffffff",
              color: "#374151",
              outline: "none",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            {Object.entries(LANGUAGES).map(([code, config]) => (
              <option key={code} value={code}>{config.native}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsCallOpen(true)}
            className="btn btn-green"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <PhoneCall size={16} />
            {t.callAIExpert}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} style={{ color: "#ef4444" }} />
            {t.emergencyServices}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {emergencyServices[lang].map((service, i) => (
              <motion.button
                key={i}
                onClick={() => handleEmergencyClick({ name: service.name, number: service.number, icon: service.icon })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card"
                style={{ 
                  padding: "16px", 
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  width: 4, 
                  height: "100%", 
                  background: service.color.includes("blue") ? "#3b82f6" : 
                             service.color.includes("red") ? "#ef4444" : 
                             service.color.includes("orange") ? "#f97316" : "#a855f7",
                  borderRadius: "4px 0 0 4px"
                }} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>{service.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{service.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>{service.number}</div>
              </motion.button>
            ))}
          </div>

          <div className="section-title" style={{ marginTop: 24, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={16} style={{ color: "#22c55e" }} />
            {t.governmentHelplines}
          </div>
          {currentHelplines.map((section, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
              <div style={{ 
                padding: "12px 16px", 
                background: "linear-gradient(90deg, #22c55e, #16a34a)", 
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <span style={{ fontWeight: 600 }}>{lang !== "en" ? section.categoryHi : section.category}</span>
              </div>
              <div style={{ padding: 12 }}>
                {section.contacts.map((contact, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => handleEmergencyClick({ name: lang !== "en" ? (contact.labelHi || contact.label) : contact.label, number: contact.number, icon: "📞" })}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      marginBottom: cIdx < section.contacts.length - 1 ? 8 : 0,
                      background: "#f9fafb",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0fdf4";
                      e.currentTarget.style.border = "1px solid #22c55e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.border = "1px solid transparent";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: "#1f2937" }}>{lang !== "en" ? (contact.labelHi || contact.label) : contact.label}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {contact.available}
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, color: "#16a34a", fontSize: 13 }}>{contact.number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>{t.quickGuide}</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              {t.clickAbove}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🌾 {t.agriHelplines}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {t.kisanDesc}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🏛️ {t.govSchemes}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {t.pmkisanDesc}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🤖 {t.aiExpert}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {t.aiExpertDesc}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16, padding: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>
              💡 {t.tip}
            </div>
            <div style={{ fontSize: 12, color: "#15803d" }}>
              {t.tipDesc}
            </div>
          </div>
        </div>
      </div>

      <AgentCallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} />

      <AnimatePresence>
        {emergencyCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: callStatus === "connected" 
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.98))"
                : callStatus === "ended"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.98))"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.98))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                maxWidth: 340,
                width: "100%",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(40px)",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                padding: 32,
                textAlign: "center"
              }}
            >
              {callStatus === "calling" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <div style={{ width: 120, height: 120, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.3)" }} />
                </motion.div>
              )}

              <div style={{ position: "relative", zIndex: 1 }}>
                <motion.div
                  animate={callStatus === "calling" ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={callStatus === "calling" ? { duration: 0.5, repeat: Infinity } : {}}
                  style={{
                    width: 80,
                    height: 80,
                    margin: "0 auto 24px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {callStatus === "calling" && <PhoneCall size={40} style={{ color: "white" }} className="animate-pulse" />}
                  {callStatus === "connected" && <PhoneCall size={40} style={{ color: "white" }} />}
                  {callStatus === "ended" && <PhoneOff size={40} style={{ color: "white" }} />}
                </motion.div>

                <div style={{ fontSize: 24, fontWeight: 700, color: "white", marginBottom: 8 }}>
                  {callStatus === "calling" && "Calling..."}
                  {callStatus === "connected" && "Connected"}
                  {callStatus === "ended" && "Call Ended"}
                </div>

                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                  {emergencyCall.icon} {emergencyCall.name}
                </div>

                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                  {emergencyCall.number.split(" / ")[0]}
                </div>

                {callStatus === "connected" && (
                  <div style={{ fontFamily: "monospace", fontSize: 24, color: "white", marginBottom: 24 }}>
                    {formatTime(callTimer)}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, height: 48, marginBottom: 24 }}>
                  {(callStatus === "calling" || callStatus === "connected") && Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: callStatus === "calling"
                          ? [8, Math.random() * 24 + 8, 8]
                          : [8, Math.random() * 20 + 12, 8]
                      }}
                      transition={{
                        duration: callStatus === "calling" ? 0.8 : 0.5,
                        repeat: Infinity,
                        delay: i * 0.05
                      }}
                      style={{ width: 4, borderRadius: 4, background: "rgba(255,255,255,0.7)" }}
                    />
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 16px", marginBottom: 24 }}>
                  <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                    {callStatus === "calling" && "Please wait while we connect you..."}
                    {callStatus === "connected" && "You are connected. Speak now!"}
                    {callStatus === "ended" && "Call has ended successfully"}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  {(callStatus === "calling" || callStatus === "connected") && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={endEmergencyCall}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 24px rgba(239, 68, 68, 0.5)"
                      }}
                    >
                      <PhoneOff size={24} />
                    </motion.button>
                  )}
                  {callStatus === "ended" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEmergencyCall(null)}
                      style={{
                        padding: "12px 32px",
                        borderRadius: 12,
                        border: "none",
                        background: "white",
                        color: "#1f2937",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Close
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}