"use client";

import { useCallback, useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

type ConsentListener = (status: ConsentStatus) => void;
const listeners = new Set<ConsentListener>();

function notifyListeners(status: ConsentStatus) {
  listeners.forEach((fn) => fn(status));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
    const listener: ConsentListener = (status) => setConsent(status);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return consent;
}

export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY);
  notifyListeners(null);
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) {
      setVisible(true);
    }
    const listener: ConsentListener = (status) => {
      if (status === null) setVisible(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    notifyListeners("accepted");
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
    notifyListeners("rejected");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-lg shadow-slate-300/50 border border-slate-200 p-4 sm:p-5">
        <p className="text-sm text-slate-600 mb-4">
          Strona korzysta z analityki Vercel, aby mierzyć odwiedziny. Dane są
          anonimowe i nie są udostępniane podmiotom trzecim.{" "}
          <a
            href="/regulamin"
            className="text-blue-600 hover:text-blue-700 underline transition-colors"
          >
            Więcej informacji
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 transition-colors cursor-pointer"
          >
            Odrzuć
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
