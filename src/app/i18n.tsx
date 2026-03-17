"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Locale = "pl" | "en";

const LOCALE_KEY = "app-locale";

const translations = {
  pl: {
    // Header
    "title": "Generator QR",
    "subtitle": "Transformuj linki w eleganckie, luksusowe kody QR perfekcyjnej jakości. Ekskluzywne i darmowe narzędzie.",

    // Tabs
    "tab.basic": "Podstawowy",
    "tab.advanced": "Z logotypem",

    // QR types
    "qrTypeSection": "Typ kodu QR",
    "qrType.url": "Link",
    "qrType.phone": "Telefon",
    "qrType.email": "E-mail",
    "qrType.whatsapp": "WhatsApp",
    "qrType.telegram": "Telegram",
    "qrType.signal": "Signal",
    "qrType.text": "Tekst",
    "qrType.vcard": "vCard",
    "qrType.fallbackLabel": "Dane do zakodowania",
    "qrTypePlaceholder.text": "Wpisz dowolny tekst...",
    "qrTypePlaceholder.email": "kontakt@example.com",

    // vCard
    "vcard.firstName": "Imie",
    "vcard.lastName": "Nazwisko",
    "vcard.company": "Firma",
    "vcard.phone": "Nr tel",
    "vcard.email": "E-mail",
    "vcard.website": "Strona www",
    "vcard.firstNamePlaceholder": "Jan",
    "vcard.lastNamePlaceholder": "Kowalski",
    "vcard.companyPlaceholder": "Nazwa firmy",
    "vcard.phonePlaceholder": "+48 123 456 789",
    "vcard.emailPlaceholder": "jan@example.com",
    "vcard.websitePlaceholder": "https://example.com",
    "error.vcardName": "Podaj imie lub nazwisko",

    // QR style
    "qrStyle.title": "Styl modulu QR",
    "qrStyle.square": "Klasyczny",
    "qrStyle.dots": "Kropki",
    "qrStyle.rounded": "Zaokraglony",
    "qrStyle.connected": "Plynny",
    "qrStyle.diamond": "Diament",

    // Colors
    "color.dark": "Kolor kodu QR",
    "color.dark.picker": "Wybierz kolor kodu QR",
    "color.light": "Kolor tla",
    "color.light.picker": "Wybierz kolor tla",

    // Logo variant
    "logoVariant.title": "Wariant logo",
    "logoVariant.color": "Kolorowe",
    "logoVariant.mono": "Mono",
    "logoVariant.ariaColor": "Wariant logo Kolorowe",
    "logoVariant.ariaMono": "Wariant logo Mono",

    // Logo section
    "logo.title": "Logo w centrum kodu QR",
    "logo.upload": "Wgraj wlasne logo",
    "logo.customAlt": "Wlasne logo",
    "logo.remove": "Usun logo",
    "logo.preset": "Logo",

    // Generate button
    "generate": "Generuj kod QR",
    "generating": "Generowanie...",

    // Result area
    "result.placeholder.title": "Miejsce na Twój Kod QR",
    "result.placeholder.desc": "Wypełnij formularz obok i kliknij generuj, aby zobaczyć magię.",
    "result.loading": "Tworzenie arcydzieła...",
    "result.qrAlt": "Twój Luksusowy Kod QR",
    "result.copied": "Skopiowano",
    "result.copy": "Skopiuj",
    "result.copyTitle": "Kopiuj do schowka",
    "result.copiedTitle": "Skopiowano!",
    "result.downloadPng": "Pobierz wysokiej jakości PNG",
    "result.downloadSvg": "Pobierz wektorowy SVG",
    "result.backToEdit": "Edytuj projekt kodu QR",

    // Footer
    "footer.local": "Kody generowane lokalnie.",
    "footer.createdBy": "Stworzone przez",
    "footer.terms": "Regulamin i polityka",
    "footer.cookies": "Ustawienia cookies",

    // Theme
    "theme.toggle": "Przełącz motyw",

    // Validation
    "error.empty": "To pole nie może być puste",
    "error.invalidUrl": "Wprowadź poprawny URL (np. https://example.com)",
    "error.invalidProtocol": "Dozwolone są tylko linki http:// i https://",
    "error.invalidEmail": "Wprowadź poprawny adres e-mail",
    "error.fallback": "Wprowadź poprawne dane",
    "error.generation": "Nie udalo sie wygenerowac kodu QR",

    // Cookie banner
    "cookie.text": "Strona korzysta z analityki Vercel, aby mierzyć odwiedziny. Dane są anonimowe i nie są udostępniane podmiotom trzecim.",
    "cookie.moreInfo": "Więcej informacji",
    "cookie.reject": "Odrzuć",
    "cookie.accept": "Akceptuj",

    // Language
    "lang.switch": "Zmień język",
  },
  en: {
    // Header
    "title": "QR Generator",
    "subtitle": "Transform links into elegant, premium quality QR codes. Exclusive and free tool.",

    // Tabs
    "tab.basic": "Basic",
    "tab.advanced": "With logo",

    // QR types
    "qrTypeSection": "QR code type",
    "qrType.url": "Link",
    "qrType.phone": "Phone",
    "qrType.email": "E-mail",
    "qrType.whatsapp": "WhatsApp",
    "qrType.telegram": "Telegram",
    "qrType.signal": "Signal",
    "qrType.text": "Text",
    "qrType.vcard": "vCard",
    "qrType.fallbackLabel": "Data to encode",
    "qrTypePlaceholder.text": "Enter any text...",
    "qrTypePlaceholder.email": "contact@example.com",

    // vCard
    "vcard.firstName": "First name",
    "vcard.lastName": "Last name",
    "vcard.company": "Company",
    "vcard.phone": "Phone number",
    "vcard.email": "E-mail",
    "vcard.website": "Website",
    "vcard.firstNamePlaceholder": "John",
    "vcard.lastNamePlaceholder": "Doe",
    "vcard.companyPlaceholder": "Company name",
    "vcard.phonePlaceholder": "+48 123 456 789",
    "vcard.emailPlaceholder": "john@example.com",
    "vcard.websitePlaceholder": "https://example.com",
    "error.vcardName": "Enter first name or last name",

    // QR style
    "qrStyle.title": "QR module style",
    "qrStyle.square": "Classic",
    "qrStyle.dots": "Dots",
    "qrStyle.rounded": "Rounded",
    "qrStyle.connected": "Fluid",
    "qrStyle.diamond": "Diamond",

    // Colors
    "color.dark": "QR code color",
    "color.dark.picker": "Choose QR code color",
    "color.light": "Background color",
    "color.light.picker": "Choose background color",

    // Logo variant
    "logoVariant.title": "Logo variant",
    "logoVariant.color": "Color",
    "logoVariant.mono": "Mono",
    "logoVariant.ariaColor": "Logo variant Color",
    "logoVariant.ariaMono": "Logo variant Mono",

    // Logo section
    "logo.title": "Logo in QR code center",
    "logo.upload": "Upload custom logo",
    "logo.customAlt": "Custom logo",
    "logo.remove": "Remove logo",
    "logo.preset": "Logo",

    // Generate button
    "generate": "Generate QR code",
    "generating": "Generating...",

    // Result area
    "result.placeholder.title": "Your QR Code Here",
    "result.placeholder.desc": "Fill in the form and click generate to see the magic.",
    "result.loading": "Creating masterpiece...",
    "result.qrAlt": "Your Premium QR Code",
    "result.copied": "Copied",
    "result.copy": "Copy",
    "result.copyTitle": "Copy to clipboard",
    "result.copiedTitle": "Copied!",
    "result.downloadPng": "Download high quality PNG",
    "result.downloadSvg": "Download vector SVG",
    "result.backToEdit": "Edit QR code design",

    // Footer
    "footer.local": "Codes generated locally.",
    "footer.createdBy": "Created by",
    "footer.terms": "Terms & privacy",
    "footer.cookies": "Cookie settings",

    // Theme
    "theme.toggle": "Toggle theme",

    // Validation
    "error.empty": "This field cannot be empty",
    "error.invalidUrl": "Enter a valid URL (e.g. https://example.com)",
    "error.invalidProtocol": "Only http:// and https:// links are allowed",
    "error.invalidEmail": "Enter a valid email address",
    "error.fallback": "Enter valid data",
    "error.generation": "Failed to generate QR code",

    // Cookie banner
    "cookie.text": "This site uses Vercel Analytics to measure visits. Data is anonymous and not shared with third parties.",
    "cookie.moreInfo": "More info",
    "cookie.reject": "Reject",
    "cookie.accept": "Accept",

    // Language
    "lang.switch": "Change language",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["pl"];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pl");

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "pl" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "pl" ? "en" : "pl")}
      className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm text-lg leading-none"
      title={t("lang.switch")}
      aria-label={t("lang.switch")}
    >
      {locale === "en" ? "EN" : "PL"}
    </button>
  );
}
