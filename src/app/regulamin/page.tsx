import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "../site";

export const metadata: Metadata = {
  title: "Regulamin i Polityka Prywatności - Generator QR",
  description:
    "Regulamin i Polityka Prywatności serwisu Generator QR. Informacje o przetwarzaniu danych, analityce i prawach użytkownika (RODO).",
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
          Regulamin i Polityka Prywatności serwisu Generator&nbsp;QR
        </h1>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              1. Informacje ogólne i Administrator Danych
            </h2>
            <p className="mb-3">
              Serwis Generator QR dostępny pod adresem{" "}
              <span className="font-medium">{SITE_URL}</span> jest darmowym
              narzędziem do generowania kodów QR.
            </p>
            <p>
              Operatorem serwisu oraz Administratorem Danych Osobowych jest
              Krzysztof Brzezina. W sprawach związanych z prywatnością
              i działaniem serwisu możesz kontaktować się mailowo pod adresem:{" "}
              <a
                href="mailto:krzysztof.brzezina@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                krzysztof.brzezina@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              2. Zasady korzystania
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Serwis jest darmowy i nie wymaga rejestracji.</li>
              <li>
                Kody QR generowane są lokalnie w przeglądarce użytkownika —
                wprowadzane dane nie są przesyłane na serwer.
              </li>
              <li>
                Użytkownik ponosi pełną odpowiedzialność za treść zakodowaną
                w wygenerowanym kodzie QR.
              </li>
              <li>
                Zabronione jest wykorzystywanie serwisu do celów niezgodnych
                z prawem.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              3. Jakie dane przetwarzamy i dlaczego (Polityka Prywatności)
            </h2>
            <p className="mb-3">
              Główna funkcja serwisu (generowanie kodów) została zaprojektowana
              tak, aby chronić Twoją prywatność. Dane, które wpisujesz, aby
              wygenerować kod, nigdy nie opuszczają Twojego urządzenia.
            </p>
            <p className="mb-3">
              Z przyczyn technicznych i komunikacyjnych przetwarzamy jednak pewne
              informacje:
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <span className="font-medium">Kontakt e-mail:</span> Kiedy
                wysyłasz do nas wiadomość na podany adres e-mail, przekazujesz
                nam swój adres e-mail oraz inne dane zawarte w treści wiadomości.
                Przetwarzamy je wyłącznie w celu udzielenia odpowiedzi na Twoje
                zapytanie. Podstawą prawną jest nasz prawnie uzasadniony interes
                (art. 6 ust. 1 lit. f RODO). Dane z korespondencji
                przechowujemy przez czas niezbędny do załatwienia sprawy.
              </li>
              <li>
                <span className="font-medium">Logi serwera:</span> Podobnie jak
                większość stron internetowych, serwer hostingowy (Vercel), na
                którym działa strona, automatycznie zapisuje zapytania wysyłane
                do serwera (m.in. publiczny adres IP, typ przeglądarki, czas
                zapytania). Dane te są niezbędne do zapewnienia bezpieczeństwa
                i stabilności serwisu. Podstawą prawną jest nasz prawnie
                uzasadniony interes (art. 6 ust. 1 lit. f RODO).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              4. Analityka i pliki cookies
            </h2>
            <p className="mb-3">
              Serwis wykorzystuje localStorage przeglądarki wyłącznie po to, by
              zapamiętać Twoją decyzję (zgodę lub jej brak) z paska cookies.
              Serwis nie używa tradycyjnych ciasteczek (cookies) do śledzenia
              użytkowników.
            </p>
            <p className="mb-3">
              Dopiero po wyrażeniu przez Ciebie dobrowolnej zgody, serwis
              uruchamia narzędzia analityczne dostarczane przez hosting Vercel:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Vercel Analytics</span> — zbiera
                anonimowe dane o odwiedzinach (np. liczba wizyt, kraj, typ
                urządzenia). Nie używa ciasteczek i nie śledzi Cię pomiędzy
                różnymi sesjami.
              </li>
              <li>
                <span className="font-medium">Vercel Speed Insights</span> —
                mierzy wydajność strony (np. czas ładowania). Dane są w pełni
                anonimowe.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              5. Twoje prawa (RODO)
            </h2>
            <p className="mb-3">
              Zgodnie z przepisami RODO, w związku z przetwarzaniem Twoich
              danych osobowych (np. z korespondencji e-mail), przysługują Ci
              następujące prawa:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prawo dostępu do swoich danych oraz otrzymania ich kopii.</li>
              <li>Prawo do sprostowania (poprawiania) swoich danych.</li>
              <li>
                Prawo do usunięcia danych lub ograniczenia ich przetwarzania.
              </li>
              <li>Prawo do wniesienia sprzeciwu wobec przetwarzania.</li>
              <li>
                Prawo do wniesienia skargi do organu nadzorczego (w Polsce jest
                to Prezes Urzędu Ochrony Danych Osobowych — PUODO), jeśli
                uznasz, że przetwarzanie narusza przepisy.
              </li>
            </ul>
            <p className="mt-3">
              W celu realizacji swoich praw skontaktuj się z Administratorem pod
              adresem e-mail podanym w punkcie 1.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              6. Odpowiedzialność
            </h2>
            <p>
              Serwis dostarczany jest w stanie &bdquo;tak jak jest&rdquo; (as
              is), bez jakichkolwiek gwarancji prawidłowego działania. Operator
              nie ponosi odpowiedzialności za ewentualne szkody, utratę danych
              czy błędy wynikające z korzystania z serwisu lub wygenerowanych
              w nim kodów QR.
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
