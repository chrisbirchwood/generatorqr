import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Generator kodów QR online - darmowy, szybki, bez rejestracji",
  description:
    "Wklej link i wygeneruj kod QR w sekundę. Skopiuj do schowka lub pobierz jako PNG. Darmowy, działa w przeglądarce, bez rejestracji.",
  metadataBase: new URL("https://qr.birchcode.com"),
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
    <html lang="pl">
      <body className={`${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Generator kodów QR",
              url: "https://generatorqr.vercel.app",
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
        {children}
      </body>
    </html>
  );
}
