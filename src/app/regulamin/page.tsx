import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "../site";

export const metadata: Metadata = {
  title: "Regulamin i polityka prywatności - Generator QR",
  description:
    "Regulamin korzystania z serwisu Generator QR oraz polityka prywatności.",
  alternates: {
    canonical: "/regulamin",
  },
};

export default function RegulaminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block mb-8 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          &larr; Wróć do generatora
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Regulamin i polityka prywatności
        </h1>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              1. Informacje ogólne
            </h2>
            <p>
              Serwis Generator QR dostępny pod adresem{" "}
              <span className="font-medium">{SITE_URL}</span> jest darmowym
              narzędziem do generowania kodów QR. Operatorem serwisu jest
              Krzysztof Brzezina.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              2. Zasady korzystania
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Serwis jest darmowy i nie wymaga rejestracji.
              </li>
              <li>
                Kody QR generowane są lokalnie w przeglądarce użytkownika —
                wprowadzone dane nie są przesyłane na serwer.
              </li>
              <li>
                Użytkownik ponosi odpowiedzialność za treść zakodowaną w kodzie
                QR.
              </li>
              <li>
                Zabronione jest wykorzystywanie serwisu do celów niezgodnych z
                prawem.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              3. Polityka prywatności
            </h2>
            <p className="mb-3">
              Serwis nie zbiera danych osobowych użytkowników. Wprowadzone linki
              nie są zapisywane ani przesyłane — generowanie kodów QR odbywa się
              w całości po stronie przeglądarki.
            </p>
            <p className="mb-3">
              Po wyrażeniu zgody przez użytkownika (cookie banner) serwis
              korzysta z następujących narzędzi analitycznych:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Vercel Analytics</span> — zbiera
                anonimowe dane o odwiedzinach (np. liczba wizyt, kraj, typ
                urządzenia). Nie używa ciasteczek, nie śledzi użytkowników między
                sesjami.
              </li>
              <li>
                <span className="font-medium">Vercel Speed Insights</span> —
                mierzy wydajność strony (np. czas ładowania). Dane są anonimowe.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              4. Pliki cookies
            </h2>
            <p>
              Serwis wykorzystuje localStorage przeglądarki wyłącznie do
              zapamiętania decyzji użytkownika dotyczącej zgody na analitykę.
              Serwis nie używa ciasteczek (cookies) do śledzenia użytkowników.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              5. Odpowiedzialność
            </h2>
            <p>
              Serwis dostarczany jest w stanie &bdquo;tak jak jest&rdquo; (as
              is), bez jakichkolwiek gwarancji. Operator nie ponosi
              odpowiedzialności za ewentualne szkody wynikające z korzystania z
              serwisu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              6. Kontakt
            </h2>
            <p>
              W sprawach związanych z serwisem można kontaktować się mailowo:{" "}
              <a
                href="mailto:krzysztof.brzezina@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                krzysztof.brzezina@gmail.com
              </a>
            </p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
            Ostatnia aktualizacja: 6 marca 2026
          </p>
        </div>
      </div>
    </main>
  );
}
