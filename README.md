# Generator QR

Prosty generator kodów QR dla linków `http` i `https`, zbudowany w Next.js. Aplikacja działa po stronie przeglądarki: użytkownik wkleja adres, generuje QR, a następnie może go skopiować do schowka albo pobrać jako plik PNG.

Produkcyjny adres: [qr.birchcode.com](https://qr.birchcode.com)

## Najważniejsze funkcje

- walidacja adresów URL z komunikatami błędów po polsku
- generowanie kodu QR lokalnie w przeglądarce
- kopiowanie obrazu do schowka z fallbackiem do pobrania pliku
- pobieranie PNG z unikalną nazwą pliku
- prosty, responsywny interfejs
- podstawowa optymalizacja SEO: metadata, Open Graph, `robots.txt`, `sitemap.xml`, JSON-LD
- testy jednostkowe i komponentowe w Vitest

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `qrcode` do generowania kodów QR
- Vitest + Testing Library do testów

## Wymagania

- Node.js 20+
- npm

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Po uruchomieniu aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

## Dostępne skrypty

```bash
npm run dev            # lokalny development
npm run build          # build produkcyjny
npm run start          # uruchomienie buildu
npm run lint           # lintowanie kodu
npm run test           # testy
npm run test:coverage  # testy z coverage
```

## Struktura projektu

```text
src/
  app/
    globals.css        # style globalne
    layout.tsx         # layout, metadata i schema.org
    page.tsx           # główny ekran generatora QR
    page.test.tsx      # testy jednostkowe i komponentowe
    robots.ts          # definicja robots.txt
    sitemap.ts         # definicja sitemap.xml
    site.ts            # wspólny adres bazowy aplikacji
  test/
    setup.ts           # setup Vitest / jsdom
```

## Jak działa aplikacja

1. Użytkownik wkleja link do pola formularza.
2. Aplikacja akceptuje tylko adresy z protokołem `http:` lub `https:`.
3. Biblioteka `qrcode` generuje kod QR na ukrytym `canvas`.
4. Wynik jest wyświetlany jako obraz i można go:
   - skopiować do schowka
   - pobrać jako PNG
5. Jeśli Clipboard API nie zadziała, aplikacja automatycznie przechodzi do pobrania pliku.

## Jakość i testy

Repo zawiera testy dla:

- walidacji URL
- generowania QR
- kopiowania do schowka
- pobierania pliku
- stanów błędów i loadingu
- regresji związanych z ponownym generowaniem QR
- dostępności pola formularza

## SEO i wdrożenie

Aplikacja publikuje:

- canonical URL
- Open Graph i Twitter metadata
- `robots.txt`
- `sitemap.xml`
- dane strukturalne `WebApplication`

Przy buildzie produkcyjnym Next pobiera font Google przez `next/font/google`, więc środowisko budujące musi mieć dostęp do sieci.

## Autor

Krzysztof Brzezina

- WWW: [qr.birchcode.com](https://qr.birchcode.com)
- E-mail: [krzysztof.brzezina@gmail.com](mailto:krzysztof.brzezina@gmail.com)
- WhatsApp: [517 466 553](https://wa.me/48517466553)
