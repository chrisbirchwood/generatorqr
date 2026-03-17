import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Input glowny — label zmienia sie z typem QR, wiec uzywamy stabilnego ID */
function getInput(page: Page) {
  return page.locator("#qr-url");
}

function getGenerateButton(page: Page) {
  return page.getByRole("button", { name: /generuj|generate/i });
}

function getValidationError(page: Page) {
  return page.locator("#qr-url-error");
}

/** Odrzuca cookie banner jesli jest widoczny */
async function dismissCookieBanner(page: Page) {
  const rejectBtn = page.getByRole("button", { name: /odrzuć|reject/i });
  if (await rejectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rejectBtn.click();
  }
}

// ─── Strona glowna ───────────────────────────────────────────────────────────

test.describe("Strona glowna", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("wyswietla tytul i formularz", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Generator QR" })).toBeVisible();
    await expect(getInput(page)).toBeVisible();
    await expect(getGenerateButton(page)).toBeVisible();
  });

  test("wyswietla zakladki Podstawowy i Z logotypem", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /podstawowy|basic/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /z logotypem|with logo/i })).toBeVisible();
  });

  test("wyswietla dane kontaktowe w stopce", async ({ page }) => {
    await expect(page.getByText("Krzysztof Brzezina")).toBeVisible();
    await expect(page.getByText("WhatsApp 517 466 553")).toBeVisible();
    await expect(page.getByText("krzysztof.brzezina@gmail.com")).toBeVisible();
  });

  test("wyswietla link do regulaminu", async ({ page }) => {
    const link = page.getByRole("link", { name: /regulamin|terms/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/regulamin");
  });
});

// ─── Typy QR ─────────────────────────────────────────────────────────────────

test.describe("Typy kodow QR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("przelacza miedzy typami QR", async ({ page }) => {
    const input = getInput(page);

    // Domyslnie URL
    await expect(input).toHaveAttribute("type", "url");

    // Telefon
    await page.getByRole("button", { name: /telefon|phone/i }).click();
    await expect(input).toHaveAttribute("type", "tel");

    // E-mail
    await page.getByRole("button", { name: "E-mail" }).click();
    await expect(input).toHaveAttribute("type", "email");

    // Tekst
    await page.getByRole("button", { name: /tekst|text/i }).click();
    await expect(input).toHaveAttribute("type", "text");
  });

  test("czysci pole po zmianie typu", async ({ page }) => {
    const input = getInput(page);
    await input.fill("https://example.com");
    await expect(input).toHaveValue("https://example.com");

    await page.getByRole("button", { name: /telefon|phone/i }).click();
    await expect(input).toHaveValue("");
  });
});

// ─── Wizytowka (vCard) ──────────────────────────────────────────────────────

test.describe("Wizytowka (vCard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: /wizyt|vcard/i }).click();
  });

  test("wyswietla formularz wizytowki po wyborze typu", async ({ page }) => {
    // Pola wizytowki widoczne
    await expect(page.locator("#vcard-firstName")).toBeVisible();
    await expect(page.locator("#vcard-lastName")).toBeVisible();
    await expect(page.locator("#vcard-company")).toBeVisible();
    await expect(page.locator("#vcard-phone")).toBeVisible();
    await expect(page.locator("#vcard-email")).toBeVisible();
    await expect(page.locator("#vcard-website")).toBeVisible();

    // Pojedynczy input URL nie jest widoczny
    await expect(getInput(page)).not.toBeVisible();
  });

  test("wyswietla blad walidacji gdy brak imienia i nazwiska", async ({ page }) => {
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();
  });

  test("generuje QR dla wizytowki z imieniem", async ({ page }) => {
    await page.locator("#vcard-firstName").fill("Jan");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("generuje QR dla pelnej wizytowki", async ({ page }) => {
    await page.locator("#vcard-firstName").fill("Jan");
    await page.locator("#vcard-lastName").fill("Kowalski");
    await page.locator("#vcard-company").fill("Firma ABC");
    await page.locator("#vcard-phone").fill("+48123456789");
    await page.locator("#vcard-email").fill("jan@example.com");
    await page.locator("#vcard-website").fill("https://example.com");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });

    // Przyciski akcji
    await expect(page.getByRole("button", { name: /skopiuj|copy/i })).toBeVisible();
    await expect(page.getByText("PNG").first()).toBeVisible();
    await expect(page.getByText("SVG").first()).toBeVisible();
  });

  test("czysci pola po zmianie typu QR", async ({ page }) => {
    await page.locator("#vcard-firstName").fill("Jan");
    await page.locator("#vcard-lastName").fill("Kowalski");

    // Zmien na Link
    await page.getByRole("button", { name: "Link" }).click();
    await expect(getInput(page)).toBeVisible();
    await expect(getInput(page)).toHaveValue("");

    // Wroc do wizytowki
    await page.getByRole("button", { name: /wizyt|vcard/i }).click();
    await expect(page.locator("#vcard-firstName")).toHaveValue("");
    await expect(page.locator("#vcard-lastName")).toHaveValue("");
  });

  test("czysci blad przy wpisywaniu w pole wizytowki", async ({ page }) => {
    await getGenerateButton(page).scrollIntoViewIfNeeded();
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();

    await page.locator("#vcard-firstName").fill("J");
    await expect(getValidationError(page)).not.toBeVisible();
  });
});

// ─── Walidacja ───────────────────────────────────────────────────────────────

test.describe("Walidacja formularza", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("wyswietla blad dla pustego pola", async ({ page }) => {
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();
  });

  test("wyswietla blad dla niepoprawnego URL", async ({ page }) => {
    await getInput(page).fill("nie-url");
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();
  });

  test("wyswietla blad dla niedozwolonego protokolu", async ({ page }) => {
    await getInput(page).fill("ftp://example.com");
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();
  });

  test("czysci blad przy wpisywaniu", async ({ page }) => {
    await getGenerateButton(page).click();
    await expect(getValidationError(page)).toBeVisible();

    await getInput(page).fill("a");
    await expect(getValidationError(page)).not.toBeVisible();
  });
});

// ─── Generowanie QR ──────────────────────────────────────────────────────────

test.describe("Generowanie kodow QR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("generuje QR dla poprawnego URL", async ({ page }) => {
    await getInput(page).fill("https://example.com");
    await getGenerateButton(page).click();

    // Czeka na wynik - obraz QR
    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });

    // Przyciski akcji
    await expect(page.getByRole("button", { name: /skopiuj|copy/i })).toBeVisible();
    await expect(page.getByText("PNG").first()).toBeVisible();
    await expect(page.getByText("SVG").first()).toBeVisible();
  });

  test("generuje QR po wcisnieciu Enter", async ({ page }) => {
    await getInput(page).fill("https://example.com");
    await getInput(page).press("Enter");

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("generuje QR dla telefonu", async ({ page }) => {
    await page.getByRole("button", { name: /telefon|phone/i }).click();
    await getInput(page).fill("+48123456789");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("generuje QR dla e-mail", async ({ page }) => {
    await page.getByRole("button", { name: "E-mail" }).click();
    await getInput(page).fill("test@example.com");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("generuje QR dla tekstu", async ({ page }) => {
    await page.getByRole("button", { name: /tekst|text/i }).click();
    await getInput(page).fill("Hello World!");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("powrot do formularza po kliknieciu edytuj", async ({ page }) => {
    await dismissCookieBanner(page);
    await getInput(page).fill("https://example.com");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });

    // Klik na powrot do edycji
    await page.getByRole("button", { name: /edytuj|back/i }).click();

    // Formularz znowu widoczny
    await expect(getInput(page)).toBeVisible();
    await expect(getGenerateButton(page)).toBeVisible();
  });
});

// ─── Akcje na wyniku (kopiuj, pobierz) ──────────────────────────────────────

test.describe("Akcje na wygenerowanym QR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissCookieBanner(page);
    await getInput(page).fill("https://example.com");
    await getGenerateButton(page).click();
    await expect(page.getByAltText(/kod qr|qr code/i)).toBeVisible({ timeout: 10000 });
  });

  test("kopiuje QR do schowka", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);

    await page.getByRole("button", { name: /skopiuj|copy/i }).click();

    // Powinno pokazac "Skopiowano"
    await expect(page.getByText(/skopiowano|copied/i)).toBeVisible();
  });

  test("pobiera QR jako PNG", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByText("PNG").first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".png");
  });

  test("pobiera QR jako SVG", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByText("SVG").first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".svg");
  });
});

// ─── Tryb zaawansowany (Z logotypem) ────────────────────────────────────────

test.describe("Tryb zaawansowany", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /z logotypem|with logo/i }).click();
  });

  test("wyswietla opcje stylu modulow QR", async ({ page }) => {
    await expect(page.getByText(/styl modulu|module style/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /klasyczny|classic/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /kropki|dots/i })).toBeVisible();
  });

  test("wyswietla color pickery", async ({ page }) => {
    await expect(page.getByText(/kolor kodu|code color/i)).toBeVisible();
    await expect(page.getByText(/kolor tla|background/i)).toBeVisible();
  });

  test("wyswietla presety logo", async ({ page }) => {
    await expect(page.getByText(/logo w centrum|logo in center/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /logo whatsapp/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo instagram/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo x/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo tiktok/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo facebook/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo telegram/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /logo signal/i })).toBeVisible();
  });

  test("wybor preset logo pokazuje przycisk usun", async ({ page }) => {
    await page.getByRole("button", { name: /logo whatsapp/i }).click();
    await expect(page.getByText(/usun logo|remove logo/i)).toBeVisible();
  });

  test("usuwa preset logo po ponownym kliknieciu", async ({ page }) => {
    const whatsapp = page.getByRole("button", { name: /logo whatsapp/i });
    await whatsapp.click();
    await expect(page.getByText(/usun logo|remove logo/i)).toBeVisible();

    await whatsapp.click();
    await expect(page.getByText(/usun logo|remove logo/i)).not.toBeVisible();
  });

  test("przelacznik wariantu logo (kolorowe/mono)", async ({ page }) => {
    await expect(page.getByRole("button", { name: /wariant logo kolorowe|variant.*color/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /wariant logo mono|variant.*mono/i })).toBeVisible();

    await page.getByRole("button", { name: /wariant logo mono|variant.*mono/i }).click();
    // Przycisk mono powinien byc zaznaczony
    await expect(page.getByRole("button", { name: /wariant logo mono|variant.*mono/i })).toHaveAttribute("aria-pressed", "true");
  });

  test("zmiana stylu modulu QR", async ({ page }) => {
    const dotsButton = page.getByRole("button", { name: /kropki|dots/i });
    await dotsButton.click();
    await expect(dotsButton).toHaveAttribute("aria-pressed", "true");
  });

  test("generuje QR z preset logo", async ({ page }) => {
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: /logo instagram/i }).click();
    await getInput(page).fill("https://instagram.com/test");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test("powrot na zakladke Podstawowy ukrywa opcje zaawansowane", async ({ page }) => {
    await expect(page.getByText(/logo w centrum|logo in center/i)).toBeVisible();

    await page.getByRole("tab", { name: /podstawowy|basic/i }).click();
    await expect(page.getByText(/logo w centrum|logo in center/i)).not.toBeVisible();
  });
});

// ─── Przelacznik motywu ─────────────────────────────────────────────────────

test.describe("Przelacznik motywu", () => {
  test("zmienia motyw po kliknieciu", async ({ page }) => {
    await page.goto("/");

    const themeButton = page.getByRole("button", { name: /przełącz motyw|toggle theme/i });
    await expect(themeButton).toBeVisible();

    const html = page.locator("html");
    const classBefore = await html.getAttribute("class") ?? "";
    const wasDark = classBefore.includes("dark");

    await themeButton.click();

    // Klasa html powinna sie zmienic (dark <-> light)
    if (wasDark) {
      await expect(html).toHaveClass(/light/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });
});

// ─── Przelacznik jezyka ─────────────────────────────────────────────────────

test.describe("Przelacznik jezyka (i18n)", () => {
  test("przelacza jezyk PL -> EN -> PL", async ({ page }) => {
    await page.goto("/");

    // Domyslnie polski
    await expect(page.getByRole("heading", { name: "Generator QR" })).toBeVisible();
    await expect(getGenerateButton(page)).toContainText(/generuj/i);

    // Klik na przelacznik jezyka (PL -> EN)
    await page.getByRole("button", { name: /zmień język|change language/i }).click();

    // Teraz angielski
    await expect(page.getByRole("heading", { name: "QR Generator" })).toBeVisible();
    await expect(getGenerateButton(page)).toContainText(/generate/i);

    // Powrot do polskiego (EN -> PL)
    await page.getByRole("button", { name: /zmień język|change language/i }).click();
    await expect(page.getByRole("heading", { name: "Generator QR" })).toBeVisible();
  });

  test("jezyk persystuje po przeladowaniu strony", async ({ page }) => {
    await page.goto("/");

    // Przelacz na EN
    await page.getByRole("button", { name: /zmień język|change language/i }).click();
    await expect(page.getByRole("heading", { name: "QR Generator" })).toBeVisible();

    // Przeladuj strone
    await page.reload();

    // Nadal EN
    await expect(page.getByRole("heading", { name: "QR Generator" })).toBeVisible();
  });
});

// ─── Cookie banner ──────────────────────────────────────────────────────────

test.describe("Cookie banner", () => {
  test("wyswietla banner przy pierwszej wizycie", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /akceptuj|accept/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /odrzuć|reject/i })).toBeVisible();
  });

  test("ukrywa banner po akceptacji", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /akceptuj|accept/i }).click();
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).not.toBeVisible();

    // Po przeladowaniu banner nie wraca
    await page.reload();
    await expect(page.getByRole("heading", { name: /generator qr|qr generator/i })).toBeVisible();
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).not.toBeVisible();
  });

  test("ukrywa banner po odrzuceniu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /odrzuć|reject/i }).click();
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).not.toBeVisible();
  });

  test("resetuje zgode przez przycisk ustawienia cookies", async ({ page }) => {
    await page.goto("/");

    // Akceptuj cookies
    await page.getByRole("button", { name: /akceptuj|accept/i }).click();
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).not.toBeVisible();

    // Klik "Ustawienia cookies" w stopce
    await page.getByRole("button", { name: /ustawienia cookies|cookie settings/i }).click();

    // Banner powinien sie pojawic ponownie
    await expect(page.getByText(/analityki vercel|vercel analytics/i)).toBeVisible();
  });
});

// ─── Strona regulaminu ──────────────────────────────────────────────────────

test.describe("Strona regulaminu", () => {
  test("otwiera strone regulaminu", async ({ page }) => {
    await page.goto("/regulamin");
    await expect(page).toHaveURL("/regulamin");
    await expect(page.getByRole("heading", { name: /regulamin/i })).toBeVisible();
  });

  test("nawigacja z formularza do regulaminu", async ({ page }) => {
    await page.goto("/");
    // Czekamy az banner sie pojawi i odrzucamy
    const rejectBtn = page.getByRole("button", { name: /odrzuć|reject/i });
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    await rejectBtn.click();
    await expect(rejectBtn).not.toBeVisible();

    await page.getByRole("link", { name: /regulamin|terms/i }).click();
    await expect(page).toHaveURL("/regulamin");
  });
});

// ─── Responsywnosc (mobile) ─────────────────────────────────────────────────

test.describe("Responsywnosc", () => {
  test("formularz dziala na mobilnym viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Generator QR" })).toBeVisible();
    await expect(getInput(page)).toBeVisible();

    await getInput(page).fill("https://example.com");
    await getGenerateButton(page).click();

    const qrImage = page.getByAltText(/kod qr|qr code/i);
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });
});

// ─── Dostepnosc (a11y) ─────────────────────────────────────────────────────

test.describe("Dostepnosc", () => {
  test("input ma powiazany label", async ({ page }) => {
    await page.goto("/");
    const input = getInput(page);
    const labelledBy = await input.getAttribute("id");
    const label = page.locator(`label[for="${labelledBy}"]`);
    await expect(label).toBeVisible();
  });

  test("blad walidacji jest powiazany z inputem przez aria-describedby", async ({ page }) => {
    await page.goto("/");
    await getGenerateButton(page).click();

    const input = getInput(page);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "qr-url-error");
    await expect(getValidationError(page)).toBeVisible();
  });

  test("zakladki maja role tab i aria-selected", async ({ page }) => {
    await page.goto("/");

    const basicTab = page.getByRole("tab", { name: /podstawowy|basic/i });
    const advancedTab = page.getByRole("tab", { name: /z logotypem|with logo/i });

    await expect(basicTab).toHaveAttribute("aria-selected", "true");
    await expect(advancedTab).toHaveAttribute("aria-selected", "false");

    await advancedTab.click();

    await expect(basicTab).toHaveAttribute("aria-selected", "false");
    await expect(advancedTab).toHaveAttribute("aria-selected", "true");
  });
});
