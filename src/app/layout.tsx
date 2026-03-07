import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_URL } from "./site";
import AnalyticsProvider from "./components/AnalyticsProvider";
import CookieBanner from "./components/CookieBanner";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Generator kodów QR online - darmowy, szybki, bez rejestracji",
  description:
    "Wklej link i wygeneruj kod QR w sekundę. Skopiuj do schowka lub pobierz jako PNG. Darmowy, działa w przeglądarce, bez rejestracji.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Generator kodów QR online - darmowy i szybki",
    description:
      "Wklej link i wygeneruj kod QR w sekundę. Skopiuj do schowka lub pobierz jako PNG.",
    url: "/",
    siteName: "Generator QR",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Generator kodów QR online",
    description:
      "Wklej link i wygeneruj kod QR w sekundę. Darmowy, bez rejestracji.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Generator kodów QR",
              url: SITE_URL,
              description:
                "Darmowy generator kodów QR online. Wklej link, wygeneruj QR i skopiuj do schowka.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "PLN",
              },
              author: {
                "@type": "Person",
                name: "Krzysztof Brzezina",
                email: "krzysztof.brzezina@gmail.com",
              },
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieBanner />
          <AnalyticsProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
