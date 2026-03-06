"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);

  return consent;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    // Przeladowanie strony zeby zaladowac skrypty analityczne
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-lg shadow-slate-300/50 border border-slate-200 p-4 sm:p-5">
        <p className="text-sm text-slate-600 mb-4">
          Strona korzysta z analityki Vercel, aby mierzyc odwiedziny. Dane sa
          anonimowe i nie sa udostepniane podmiotom trzecim.{" "}
          <a
            href="/regulamin"
            className="text-blue-600 hover:text-blue-700 underline transition-colors"
          >
            Wiecej informacji
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 transition-colors cursor-pointer"
          >
            Odrzuc
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
          >
            Akceptuj
          </button>
        </div>
      </div>
    </div>
  );
}
