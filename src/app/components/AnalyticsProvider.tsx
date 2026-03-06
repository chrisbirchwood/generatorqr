"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useCookieConsent } from "./CookieBanner";

export default function AnalyticsProvider() {
  const consent = useCookieConsent();

  if (consent !== "accepted") return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
