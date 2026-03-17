import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_QR_APPEARANCE,
  generateQRToCanvas,
  generateQRToSVG,
} from "./qr-renderer";
import { I18nProvider } from "./i18n";
import Home, {
  copyCanvasToClipboard,
  downloadDataUrl,
  downloadSvgString,
  drawLogoOnCanvas,
  injectLogoIntoSvg,
  loadImage,
  presetLogoToDataUrl,
  validateInput,
  validateVcard,
  buildVcardString,
  formatQrData,
} from "./page";
import type { VcardData } from "./page";

function renderWithProviders(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

const mockSetTheme = vi.fn();
let mockTheme = "system";
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    themes: ["light", "dark", "system"],
    resolvedTheme: mockTheme === "system" ? "light" : mockTheme,
    systemTheme: "light",
    forcedTheme: undefined,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("./qr-renderer", async () => {
  const actual = await vi.importActual<typeof import("./qr-renderer")>(
    "./qr-renderer"
  );

  return {
    ...actual,
    generateQRToCanvas: vi
      .fn()
      .mockResolvedValue("data:image/png;base64,mockdata"),
    generateQRToSVG: vi
      .fn()
      .mockResolvedValue(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">mock</svg>'
      ),
  };
});

function getInput() {
  return screen.getByRole("textbox", { name: /link|telefon|phone|e-mail|whatsapp|telegram|signal|tekst|text|dane do zakodowania|data to encode/i });
}

function getGenerateButton() {
  return screen.getByRole("button", { name: /generuj|generowanie|generate|generating/i });
}

describe("validateInput (url)", () => {
  it("zwraca blad dla pustego stringa", () => {
    expect(validateInput("", "url")).toEqual({
      valid: false,
      error: "error.empty",
    });
  });

  it("zwraca blad dla samych spacji", () => {
    expect(validateInput("   ", "url")).toEqual({
      valid: false,
      error: "error.empty",
    });
  });

  it("zwraca blad dla niepoprawnego URL", () => {
    expect(validateInput("nie-url", "url")).toEqual({
      valid: false,
      error: "error.invalidUrl",
    });
  });

  it("zwraca blad dla protokolu javascript:", () => {
    expect(validateInput("javascript:alert(1)", "url")).toEqual({
      valid: false,
      error: "error.invalidProtocol",
    });
  });

  it("zwraca blad dla protokolu ftp:", () => {
    expect(validateInput("ftp://example.com", "url")).toEqual({
      valid: false,
      error: "error.invalidProtocol",
    });
  });

  it("akceptuje http URL", () => {
    expect(validateInput("http://example.com", "url")).toEqual({ valid: true });
  });

  it("akceptuje https URL", () => {
    expect(validateInput("https://example.com", "url")).toEqual({ valid: true });
  });

  it("akceptuje URL ze spacjami na poczatku/koncu", () => {
    expect(validateInput("  https://example.com  ", "url")).toEqual({ valid: true });
  });
});

describe("validateInput (email)", () => {
  it("zwraca blad dla niepoprawnego emaila", () => {
    expect(validateInput("jan.kowalski", "email")).toEqual({
      valid: false,
      error: "error.invalidEmail",
    });
  });

  it("akceptuje poprawny email", () => {
    expect(validateInput("jan@example.com", "email")).toEqual({ valid: true });
  });
});

describe("validateInput (inne typy)", () => {
  it("akceptuje niepusty tekst dla typu phone", () => {
    expect(validateInput("+48123456789", "phone")).toEqual({ valid: true });
  });

  it("zwraca blad dla pustego pola w typie text", () => {
    expect(validateInput("", "text")).toEqual({ valid: false, error: "error.empty" });
  });
});

describe("formatQrData strings output check", () => {
  it("formats generic text/url properly", () => {
    expect(formatQrData("https://example.com", "url")).toBe("https://example.com");
    expect(formatQrData("hello world", "text")).toBe("hello world");
  });

  it("formats phone schemas cleanly by stripping spaces", () => {
    expect(formatQrData("+48 123 456 789", "phone")).toBe("tel:+48123456789");
  });

  it("formats whatsapp schemas using wa.me by stripping all non-digits", () => {
    expect(formatQrData("+48 123 456 789", "whatsapp")).toBe("https://wa.me/48123456789");
  });

  it("formats telegram schemas using t.me and prepending +", () => {
    expect(formatQrData("+48 123 456 789", "telegram")).toBe("https://t.me/+48123456789");
    expect(formatQrData("48 123-456-789", "telegram")).toBe("https://t.me/+48123456789");
  });

  it("formats signal schemas using signal.me/#p/ and prepending +", () => {
    expect(formatQrData("+1 (555) 123-4567", "signal")).toBe("https://signal.me/#p/+15551234567");
    expect(formatQrData("1 555 123 4567", "signal")).toBe("https://signal.me/#p/+15551234567");
  });

  it("formats email schemas via mailto", () => {
    expect(formatQrData("test@example.com", "email")).toBe("mailto:test@example.com");
  });

  it("passes vcard data through unchanged", () => {
    const vcardStr = "BEGIN:VCARD\nVERSION:3.0\nEND:VCARD";
    expect(formatQrData(vcardStr, "vcard")).toBe(vcardStr);
  });
});

describe("validateVcard", () => {
  const empty: VcardData = { firstName: "", lastName: "", company: "", phone: "", email: "", website: "" };

  it("zwraca blad gdy brak imienia i nazwiska", () => {
    expect(validateVcard(empty)).toEqual({ valid: false, error: "error.vcardName" });
  });

  it("zwraca blad dla samych spacji w imieniu i nazwisku", () => {
    expect(validateVcard({ ...empty, firstName: "   ", lastName: "   " })).toEqual({
      valid: false,
      error: "error.vcardName",
    });
  });

  it("akceptuje dane z samym imieniem", () => {
    expect(validateVcard({ ...empty, firstName: "Jan" })).toEqual({ valid: true });
  });

  it("akceptuje dane z samym nazwiskiem", () => {
    expect(validateVcard({ ...empty, lastName: "Kowalski" })).toEqual({ valid: true });
  });

  it("akceptuje pelne dane", () => {
    expect(
      validateVcard({
        firstName: "Jan",
        lastName: "Kowalski",
        company: "Firma",
        phone: "+48123456789",
        email: "jan@example.com",
        website: "https://example.com",
      })
    ).toEqual({ valid: true });
  });
});

describe("buildVcardString", () => {
  it("buduje minimalny vCard z samym imieniem", () => {
    const result = buildVcardString({
      firstName: "Jan",
      lastName: "",
      company: "",
      phone: "",
      email: "",
      website: "",
    });
    expect(result).toBe("BEGIN:VCARD\nVERSION:3.0\nN:;Jan;;;\nFN:Jan\nEND:VCARD");
  });

  it("buduje minimalny vCard z samym nazwiskiem", () => {
    const result = buildVcardString({
      firstName: "",
      lastName: "Kowalski",
      company: "",
      phone: "",
      email: "",
      website: "",
    });
    expect(result).toBe("BEGIN:VCARD\nVERSION:3.0\nN:Kowalski;;;;\nFN:Kowalski\nEND:VCARD");
  });

  it("buduje pelny vCard ze wszystkimi polami", () => {
    const result = buildVcardString({
      firstName: "Jan",
      lastName: "Kowalski",
      company: "Moja Firma",
      phone: "+48 123 456 789",
      email: "jan@example.com",
      website: "https://example.com",
    });
    expect(result).toContain("BEGIN:VCARD");
    expect(result).toContain("VERSION:3.0");
    expect(result).toContain("N:Kowalski;Jan;;;");
    expect(result).toContain("FN:Jan Kowalski");
    expect(result).toContain("ORG:Moja Firma");
    expect(result).toContain("TEL:+48 123 456 789");
    expect(result).toContain("EMAIL:jan@example.com");
    expect(result).toContain("URL:https://example.com");
    expect(result).toContain("END:VCARD");
  });

  it("pomija puste pola opcjonalne", () => {
    const result = buildVcardString({
      firstName: "Jan",
      lastName: "Kowalski",
      company: "",
      phone: "",
      email: "",
      website: "",
    });
    expect(result).not.toContain("ORG:");
    expect(result).not.toContain("TEL:");
    expect(result).not.toContain("EMAIL:");
    expect(result).not.toContain("URL:");
  });

  it("trimuje wartosci pol", () => {
    const result = buildVcardString({
      firstName: "  Jan  ",
      lastName: "  Kowalski  ",
      company: "  Firma  ",
      phone: "",
      email: "",
      website: "",
    });
    expect(result).toContain("N:Kowalski;Jan;;;");
    expect(result).toContain("FN:Jan Kowalski");
    expect(result).toContain("ORG:Firma");
  });
});

describe("copyCanvasToClipboard", () => {
  it("kopiuje canvas do schowka", async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { write: mockWrite },
      writable: true,
      configurable: true,
    });

    const canvas = document.createElement("canvas");
    const result = await copyCanvasToClipboard(canvas);
    expect(result).toBe(true);
    expect(mockWrite).toHaveBeenCalled();
  });

  it("rzuca blad gdy toBlob zwraca null", async () => {
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(null);
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    const canvas = document.createElement("canvas");
    await expect(copyCanvasToClipboard(canvas)).rejects.toThrow(
      "Nie udalo sie skopiowac"
    );

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(new Blob(["mock"], { type: "image/png" }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
  });

  it("rzuca blad gdy clipboard API zawiedzie", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockRejectedValue(new Error("Not supported")),
      },
      writable: true,
      configurable: true,
    });

    const canvas = document.createElement("canvas");
    await expect(copyCanvasToClipboard(canvas)).rejects.toThrow(
      "Not supported"
    );
  });
});

describe("downloadSvgString", () => {
  it("tworzy blob URL i klika link", () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(element, "click", { value: mockClick });
      }
      return element;
    });

    downloadSvgString("<svg>test</svg>", "test.svg");
    expect(mockClick).toHaveBeenCalled();
  });
});

describe("injectLogoIntoSvg", () => {
  it("wstawia logo do SVG", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect/></svg>';
    const result = injectLogoIntoSvg(svg, "data:image/png;base64,test");
    expect(result).toContain("<image");
    expect(result).toContain("data:image/png;base64,test");
    expect(result).toContain("<rect");
    expect(result).toContain('fill="#FFFFFF"');
  });

  it("uzywa przekazanego koloru tla", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect/></svg>';
    const result = injectLogoIntoSvg(
      svg,
      "data:image/png;base64,test",
      0.22,
      "#F6E4B5"
    );
    expect(result).toContain('fill="#F6E4B5"');
  });

  it("zwraca oryginalny SVG gdy brak viewBox", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const result = injectLogoIntoSvg(svg, "data:image/png;base64,test");
    expect(result).toBe(svg);
  });
});

describe("presetLogoToDataUrl", () => {
  it("centruje preset logo wewnatrz kolorowego kafla", () => {
    const dataUrl = presetLogoToDataUrl("whatsapp");
    const encodedSvg = dataUrl.replace("data:image/svg+xml;base64,", "");
    const decodedSvg = atob(encodedSvg);

    expect(decodedSvg).toContain('x="18"');
    expect(decodedSvg).toContain('y="18"');
    expect(decodedSvg).toContain('width="64"');
    expect(decodedSvg).toContain('height="64"');
    expect(decodedSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(decodedSvg).toContain('fill="#FFFFFF"');
  });

  it("tworzy monochromatyczny wariant z domyslnymi kolorami", () => {
    const dataUrl = presetLogoToDataUrl("whatsapp", { variant: "monochrome" });
    const decodedSvg = atob(dataUrl.replace("data:image/svg+xml;base64,", ""));
    expect(decodedSvg).toContain(`fill="${DEFAULT_QR_APPEARANCE.darkColor}"`);
    expect(decodedSvg).toContain(`fill="${DEFAULT_QR_APPEARANCE.lightColor}"`);
  });

  it("tworzy monochromatyczny wariant w kolorach QR", () => {
    const dataUrl = presetLogoToDataUrl("telegram", {
      variant: "monochrome",
      backgroundColor: "#112233",
      iconColor: "#FAFAFA",
    });
    const encodedSvg = dataUrl.replace("data:image/svg+xml;base64,", "");
    const decodedSvg = atob(encodedSvg);

    expect(decodedSvg).toContain('fill="#112233"');
    expect(decodedSvg).toContain('fill="#FAFAFA"');
  });
});

describe("loadImage", () => {
  it("odrzuca promise gdy obraz nie moze byc zaladowany", async () => {
    const OriginalImage = window.Image;
    Object.defineProperty(window, "Image", {
      configurable: true,
      writable: true,
      value: class MockImage {
        onload: null | (() => void) = null;
        onerror: null | (() => void) = null;
        set src(_value: string) { this.onerror?.(); }
      },
    });

    await expect(loadImage("invalid://url")).rejects.toThrow("Nie udalo sie zaladowac obrazka");

    Object.defineProperty(window, "Image", {
      configurable: true,
      writable: true,
      value: OriginalImage,
    });
  });
});

describe("drawLogoOnCanvas", () => {
  it("nie rysuje nic gdy brak kontekstu 2d", () => {
    const canvas = document.createElement("canvas");
    const origGetContext = canvas.getContext.bind(canvas);
    canvas.getContext = (() => null) as typeof canvas.getContext;

    const img = new Image();
    // Nie powinno rzucic bledu
    expect(() => drawLogoOnCanvas(canvas, img)).not.toThrow();
    canvas.getContext = origGetContext;
  });
});

describe("downloadDataUrl", () => {
  it("tworzy link i klika go", () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(element, "click", { value: mockClick });
      }
      return element;
    });

    downloadDataUrl("data:image/png;base64,test", "test.png");
    expect(mockClick).toHaveBeenCalled();
  });
});

describe("Home komponent", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(generateQRToCanvas).mockReset();
    vi.mocked(generateQRToCanvas).mockResolvedValue("data:image/png;base64,mockdata");
    vi.mocked(generateQRToSVG).mockReset();
    vi.mocked(generateQRToSVG).mockResolvedValue(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">mock</svg>'
    );

    Object.defineProperty(navigator, "clipboard", {
      value: { write: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it("renderuje formularz z inputem i przyciskiem", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText("Generator QR")).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(getInput()).toHaveAccessibleName("Link");
    expect(getGenerateButton()).toBeInTheDocument();
  });

  it("w trybie podstawowym nie pokazuje ustawien zaawansowanych", () => {
    renderWithProviders(<Home />);
    expect(screen.queryByText("Styl modulu QR")).not.toBeInTheDocument();
    expect(screen.queryByText("Kolor kodu QR")).not.toBeInTheDocument();
    expect(screen.queryByText("Kolor tla")).not.toBeInTheDocument();
  });

  it("pokazuje ustawienia stylu i kolorow dopiero w trybie zaawansowanym", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

    expect(screen.getByText("Styl modulu QR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /klasyczny/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kropki/i })).toBeInTheDocument();
    expect(screen.getByText("Kolor kodu QR")).toBeInTheDocument();
    expect(screen.getByText("Kolor tla")).toBeInTheDocument();
    expect(screen.getByText("Wariant logo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /wariant logo kolorowe/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /wariant logo mono/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/wybierz kolor kodu qr/i)
    ).toHaveValue(DEFAULT_QR_APPEARANCE.darkColor.toLowerCase());
    expect(screen.getByLabelText(/wybierz kolor tla/i)).toHaveValue(
      DEFAULT_QR_APPEARANCE.lightColor.toLowerCase()
    );
  });

  it("przekazuje wybrany styl i kolory tylko w trybie zaawansowanym", async () => {
    renderWithProviders(<Home />);

    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    fireEvent.change(screen.getByLabelText(/wybierz kolor kodu qr/i), {
      target: { value: "#12AB34" },
    });
    fireEvent.change(screen.getByLabelText(/wybierz kolor tla/i), {
      target: { value: "#F5E1AA" },
    });
    await user.click(screen.getByRole("button", { name: /diament/i }));
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(generateQRToCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        "https://example.com",
        expect.objectContaining({
          moduleShape: "diamond",
          darkColor: "#12AB34",
          lightColor: "#F5E1AA",
          errorCorrectionLevel: "M",
        })
      );
    });

    expect(generateQRToSVG).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        moduleShape: "diamond",
        darkColor: "#12AB34",
        lightColor: "#F5E1AA",
        errorCorrectionLevel: "M",
      })
    );
  });

  it("po zmianie wariantu logo odswieza wygenerowany QR dla presetu", async () => {
    const OriginalImage = window.Image;

    Object.defineProperty(window, "Image", {
      configurable: true,
      writable: true,
      value: class MockImage {
        onload: null | (() => void) = null;
        onerror: null | (() => void) = null;

        set src(_value: string) {
          this.onload?.();
        }
      },
    });

    try {
      renderWithProviders(<Home />);

      await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
      await user.click(screen.getByRole("button", { name: /logo whatsapp/i }));
      await user.type(getInput(), "https://example.com");
      await user.click(getGenerateButton());

      await waitFor(() => {
        expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
      });

      vi.mocked(generateQRToCanvas).mockClear();
      vi.mocked(generateQRToSVG).mockClear();

      await user.click(screen.getByRole("button", { name: /wariant logo mono/i }));

      await waitFor(() => {
        expect(generateQRToCanvas).toHaveBeenCalledTimes(1);
        expect(generateQRToSVG).toHaveBeenCalledTimes(1);
      });
    } finally {
      Object.defineProperty(window, "Image", {
        configurable: true,
        writable: true,
        value: OriginalImage,
      });
    }
  });

  it("pozwala wpisac kolor hex w polu tekstowym", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

    // Znajdz pole tekstowe hex (obok color pickera)
    const hexInputs = screen.getAllByRole("textbox").filter(
      (el) => el.getAttribute("maxlength") === "6"
    );
    expect(hexInputs.length).toBeGreaterThan(0);

    const hexInput = hexInputs[0];
    await user.clear(hexInput);
    await user.type(hexInput, "FF0000");

    // Pole filtruje tylko znaki hex i ustawia uppercase
    expect(hexInput).toHaveDisplayValue(/^[0-9A-F]{3,6}$/);
  });

  it("w trybie mono kafelki presetow przyjmuja kolory z ustawien QR", async () => {
    renderWithProviders(<Home />);

    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    fireEvent.change(screen.getByLabelText(/wybierz kolor kodu qr/i), {
      target: { value: "#12AB34" },
    });
    fireEvent.change(screen.getByLabelText(/wybierz kolor tla/i), {
      target: { value: "#F5E1AA" },
    });
    await user.click(screen.getByRole("button", { name: /wariant logo mono/i }));

    const whatsappButton = screen.getByRole("button", { name: /logo whatsapp/i });
    expect(whatsappButton).toHaveStyle({ backgroundColor: "#12AB34" });

    const iconWrapper = whatsappButton.querySelector("span");
    expect(iconWrapper?.innerHTML).toContain('fill="#F5E1AA"');
  });

  it("w trybie podstawowym ignoruje wczesniej ustawione opcje zaawansowane", async () => {
    renderWithProviders(<Home />);

    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    fireEvent.change(screen.getByLabelText(/wybierz kolor kodu qr/i), {
      target: { value: "#12AB34" },
    });
    fireEvent.change(screen.getByLabelText(/wybierz kolor tla/i), {
      target: { value: "#F5E1AA" },
    });
    await user.click(screen.getByRole("button", { name: /diament/i }));
    await user.click(screen.getByRole("tab", { name: /podstawowy/i }));
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(generateQRToCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        "https://example.com",
        expect.objectContaining({
          moduleShape: DEFAULT_QR_APPEARANCE.moduleShape,
          darkColor: DEFAULT_QR_APPEARANCE.darkColor,
          lightColor: DEFAULT_QR_APPEARANCE.lightColor,
          errorCorrectionLevel: "M",
        })
      );
    });
  });

  it("wyswietla blad walidacji dla pustego pola", async () => {
    renderWithProviders(<Home />);
    await user.click(getGenerateButton());
    expect(screen.getByText(/pole.*puste|cannot be empty/i)).toBeInTheDocument();
  });

  it("wyswietla blad walidacji dla niepoprawnego URL", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());
    expect(
      screen.getByText(/poprawny URL|valid URL/i)
    ).toBeInTheDocument();
  });

  it("wyswietla blad dla zablokowanego protokolu", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "ftp://example.com");
    await user.click(getGenerateButton());
    expect(
      screen.getByText(/dozwolone.*http|only.*http/i)
    ).toBeInTheDocument();
  });

  it("czysci blad przy wpisywaniu", async () => {
    renderWithProviders(<Home />);
    await user.click(getGenerateButton());
    expect(screen.getByText(/pole.*puste|cannot be empty/i)).toBeInTheDocument();
    await user.type(getInput(), "a");
    expect(screen.queryByText(/pole.*puste|cannot be empty/i)).not.toBeInTheDocument();
  });

  it("usuwa poprzedni QR po walidacyjnym bledzie kolejnej proby", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.clear(getInput());
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());

    expect(
      screen.getByText(/poprawny URL|valid URL/i)
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Twój Luksusowy Kod QR")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Skopiuj")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("PNG")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("SVG")
    ).not.toBeInTheDocument();
  });

  it("generuje QR dla poprawnego URL", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Skopiuj").closest("button")
    ).toBeInTheDocument();
    expect(
      screen.getByText("PNG").closest("button")
    ).toBeInTheDocument();
    expect(
      screen.getByText("SVG").closest("button")
    ).toBeInTheDocument();
  });

  it("generuje QR po Enter", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });
  });

  it("wyswietla loading state", async () => {
    let resolveToCanvas!: (value: string) => void;
    vi.mocked(generateQRToCanvas).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveToCanvas = resolve;
        })
    );

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    expect(screen.getByText("Tworzenie arcydzieła...")).toBeInTheDocument();
    expect(getGenerateButton()).toBeDisabled();
    expect(getInput()).toBeDisabled();

    resolveToCanvas("data:image/png;base64,mockdata");
    await waitFor(() => {
      expect(screen.queryByText("Tworzenie arcydzieła...")).not.toBeInTheDocument();
    });
  });

  it("nie rozpoczyna drugiego generowania podczas trwajacego requestu", async () => {
    let resolveToCanvas!: (value: string) => void;
    vi.mocked(generateQRToCanvas).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveToCanvas = resolve;
        })
    );

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    expect(generateQRToCanvas).toHaveBeenCalledTimes(1);

    fireEvent.submit(getGenerateButton().closest("form")!);

    expect(generateQRToCanvas).toHaveBeenCalledTimes(1);

    resolveToCanvas("data:image/png;base64,mockdata");
    await waitFor(() => {
      expect(screen.queryByText("Tworzenie arcydzieła...")).not.toBeInTheDocument();
    });
  });

  it("kopiuje QR do schowka i resetuje stan po 2s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const timerUser = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    renderWithProviders(<Home />);
    await timerUser.type(getInput(), "https://example.com");
    await timerUser.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await timerUser.click(
      screen.getByText("Skopiuj").closest("button") as HTMLElement
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skopiowano/i })).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Skopiuj").closest("button")
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("fallback na pobranie gdy clipboard zawiedzie", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockRejectedValue(new Error("fail")),
      },
      writable: true,
      configurable: true,
    });

    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(element, "click", { value: mockClick });
      }
      return element;
    });

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Skopiuj").closest("button") as HTMLElement);

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it("pobiera QR jako PNG po kliknieciu ikony PNG", async () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(element, "click", { value: mockClick });
      }
      return element;
    });

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByText("PNG").closest("button") as HTMLElement);
    expect(mockClick).toHaveBeenCalled();
  });

  it("pobiera QR jako SVG po kliknieciu ikony SVG", async () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(element, "click", { value: mockClick });
      }
      return element;
    });

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByText("SVG").closest("button") as HTMLElement);
    expect(mockClick).toHaveBeenCalled();
  });

  it("wyswietla blad gdy generowanie zawiedzie", async () => {
    vi.mocked(generateQRToCanvas).mockRejectedValueOnce(new Error("QR error"));

    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(
        screen.getByText(/wygenerowac|failed to generate/i)
      ).toBeInTheDocument();
    });
  });

  it("usuwa poprzedni QR gdy ponowne generowanie zawiedzie", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.clear(getInput());
    await user.type(getInput(), "https://example.org");
    vi.mocked(generateQRToCanvas).mockRejectedValueOnce(new Error("QR error"));
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(
        screen.getByText(/wygenerowac|failed to generate/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByAltText("Twój Luksusowy Kod QR")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Skopiuj")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("PNG")).not.toBeInTheDocument();
    expect(screen.queryByText("SVG")).not.toBeInTheDocument();
  });

  it("wyswietla dane kontaktowe autora", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText("Krzysztof Brzezina")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp 517 466 553")).toHaveAttribute(
      "href",
      "https://wa.me/48517466553"
    );
    expect(screen.getByText("krzysztof.brzezina@gmail.com")).toHaveAttribute(
      "href",
      "mailto:krzysztof.brzezina@gmail.com"
    );
  });

  it("nie pokazuje przyciskow akcji bez QR", () => {
    renderWithProviders(<Home />);
    expect(
      screen.queryByText("Skopiuj")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("PNG")).not.toBeInTheDocument();
    expect(screen.queryByText("SVG")).not.toBeInTheDocument();
  });

  it("renderuje zakladki Podstawowy i Z logotypem", () => {
    renderWithProviders(<Home />);
    expect(screen.getByRole("tab", { name: /podstawowy/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /z logotypem/i })).toBeInTheDocument();
  });

  it("domyslnie nie pokazuje wyboru logo", () => {
    renderWithProviders(<Home />);
    expect(screen.queryByText(/logo w centrum/i)).not.toBeInTheDocument();
  });

  it("pokazuje wybor logo po kliknieciu zakladki Z logotypem", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    expect(screen.getByText(/logo w centrum/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo x/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo tiktok/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo telegram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logo signal/i })).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /wgraj wlasne logo/i })
    ).toBeInTheDocument();
  });

  it("ukrywa wybor logo po powrocie na zakladke Podstawowy", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    expect(screen.getByText(/logo w centrum/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /podstawowy/i }));
    expect(screen.queryByText(/logo w centrum/i)).not.toBeInTheDocument();
  });

  it("pozwala wybrac preset logo i pokazuje przycisk Usun", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    await user.click(screen.getByRole("button", { name: /logo whatsapp/i }));
    expect(screen.getByText(/usun logo/i)).toBeInTheDocument();
  });

  it("pozwala odznaczac preset logo klikajac ponownie", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    await user.click(screen.getByRole("button", { name: /logo whatsapp/i }));
    expect(screen.getByText(/usun logo/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /logo whatsapp/i }));
    expect(screen.queryByText(/usun logo/i)).not.toBeInTheDocument();
  });

  it("renderuje przelacznik motywu po zamontowaniu obiektu", async () => {
    renderWithProviders(<Home />);
    const themeBtn = await screen.findByRole("button", { name: /przełącz motyw/i });
    expect(themeBtn).toBeInTheDocument();
  });

  it("przelacza motyw z dark na light", async () => {
    mockTheme = "dark";
    mockSetTheme.mockClear();

    renderWithProviders(<Home />);
    const themeBtn = await screen.findByRole("button", { name: /przełącz motyw/i });
    await user.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("light");

    mockTheme = "system";
  });

  it("przelacza motyw z light na dark", async () => {
    mockTheme = "light";
    mockSetTheme.mockClear();

    renderWithProviders(<Home />);
    const themeBtn = await screen.findByRole("button", { name: /przełącz motyw/i });
    await user.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");

    mockTheme = "system";
  });

  it("zmienia typ QR po kliknieciu przycisku typu", async () => {
    renderWithProviders(<Home />);
    const phoneButton = screen.getByRole("button", { name: "Telefon" });
    await user.click(phoneButton);
    expect(getInput()).toHaveAccessibleName("Telefon");
    expect(getInput()).toHaveValue("");
  });

  it("zmienia typ QR na email i ustawia odpowiedni placeholder", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: "E-mail" }));
    expect(getInput()).toHaveAccessibleName("E-mail");
    expect(getInput()).toHaveAttribute("placeholder", "kontakt@example.com");
  });

  it("czyści url i blad przy zmianie typu QR", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());
    expect(screen.getByText(/poprawny URL|valid URL/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Telefon" }));
    expect(getInput()).toHaveValue("");
    expect(screen.queryByText(/poprawny URL|valid URL/i)).not.toBeInTheDocument();
  });

  it("przelacza na typ vCard i wyswietla formularz wizytowki", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));

    // Powinny pojawic sie pola wizytowki
    expect(screen.getByLabelText(/imi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nazwisko/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/firma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/www|strona/i)).toBeInTheDocument();

    // Pojedyncze pole inputu powinno byc ukryte
    expect(screen.queryByRole("textbox", { name: "Link" })).not.toBeInTheDocument();
  });

  it("wyswietla blad walidacji vCard gdy brak imienia i nazwiska", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));
    await user.click(getGenerateButton());

    expect(screen.getByText(/imi.*nazwisko|first.*last/i)).toBeInTheDocument();
  });

  it("czysci blad vCard przy wpisywaniu w pola wizytowki", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));
    await user.click(getGenerateButton());
    expect(screen.getByText(/imi.*nazwisko|first.*last/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/imi/i), "Jan");
    expect(screen.queryByText(/imi.*nazwisko|first.*last/i)).not.toBeInTheDocument();
  });

  it("generuje QR dla wizytowki z samym imieniem", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));
    await user.type(screen.getByLabelText(/imi/i), "Jan");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(generateQRToCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.stringContaining("BEGIN:VCARD"),
        expect.any(Object)
      );
    });

    const calledWith = vi.mocked(generateQRToCanvas).mock.calls[0][1];
    expect(calledWith).toContain("FN:Jan");
    expect(calledWith).toContain("N:;Jan;;;");
  });

  it("generuje QR dla pelnej wizytowki", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));

    await user.type(screen.getByLabelText(/imi/i), "Jan");
    await user.type(screen.getByLabelText(/nazwisko/i), "Kowalski");
    await user.type(screen.getByLabelText(/firma/i), "Firma");
    await user.type(screen.getByLabelText(/tel/i), "+48123456789");
    await user.type(screen.getByLabelText(/e-mail/i), "jan@example.com");
    await user.type(screen.getByLabelText(/www|strona/i), "https://example.com");

    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(generateQRToCanvas).toHaveBeenCalled();
    });

    const calledWith = vi.mocked(generateQRToCanvas).mock.calls[0][1];
    expect(calledWith).toContain("BEGIN:VCARD");
    expect(calledWith).toContain("FN:Jan Kowalski");
    expect(calledWith).toContain("ORG:Firma");
    expect(calledWith).toContain("TEL:+48123456789");
    expect(calledWith).toContain("EMAIL:jan@example.com");
    expect(calledWith).toContain("URL:https://example.com");
    expect(calledWith).toContain("END:VCARD");
  });

  it("czysci pola vCard przy zmianie typu QR", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));
    await user.type(screen.getByLabelText(/imi/i), "Jan");

    // Zmien typ na URL
    await user.click(screen.getByRole("button", { name: "Link" }));
    expect(getInput()).toHaveValue("");

    // Wroc do vCard - pola powinny byc puste
    await user.click(screen.getByRole("button", { name: /wizyt|vcard/i }));
    expect(screen.getByLabelText(/imi/i)).toHaveValue("");
  });

  it("obsluguje wgrywanie wlasnego logo", async () => {
    const OriginalFileReader = window.FileReader;
    let capturedOnload: (() => void) | null = null;
    const mockReadAsDataURL = vi.fn();

    Object.defineProperty(window, "FileReader", {
      configurable: true,
      writable: true,
      value: class MockFileReader {
        onload: (() => void) | null = null;
        result = "data:image/png;base64,customlogo";
        readAsDataURL = (...args: Parameters<typeof mockReadAsDataURL>) => {
          mockReadAsDataURL(...args);
          capturedOnload = this.onload;
        };
      },
    });

    try {
      renderWithProviders(<Home />);
      await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

      const fileInput = screen.getByLabelText(/wgraj wlasne logo/i);
      const file = new File(["png-data"], "logo.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(mockReadAsDataURL).toHaveBeenCalledWith(file);

      act(() => { capturedOnload?.(); });

      expect(screen.getByText(/usun logo/i)).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "FileReader", {
        configurable: true,
        writable: true,
        value: OriginalFileReader,
      });
    }
  });

  it("ignoruje puste wgranie pliku", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

    const fileInput = screen.getByLabelText(/wgraj wlasne logo/i);
    fireEvent.change(fileInput, { target: { files: [] } });

    // Nie powinien pojawic sie przycisk usun logo
    expect(screen.queryByText(/usun logo/i)).not.toBeInTheDocument();
  });

  it("klika ukryty input pliku po kliknieciu przycisku upload", async () => {
    renderWithProviders(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

    const fileInput = screen.getByLabelText(/wgraj wlasne logo/i) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    const uploadButton = screen.getByRole("button", { name: /wgraj wlasne logo/i });
    await user.click(uploadButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("usuwa wlasne logo po kliknieciu Usun logo (custom)", async () => {
    const OriginalFileReader = window.FileReader;
    let capturedOnload: (() => void) | null = null;

    Object.defineProperty(window, "FileReader", {
      configurable: true,
      writable: true,
      value: class MockFileReader {
        onload: (() => void) | null = null;
        result = "data:image/png;base64,test";
        readAsDataURL = () => { capturedOnload = this.onload; };
      },
    });

    try {
      renderWithProviders(<Home />);
      await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

      const fileInput = screen.getByLabelText(/wgraj wlasne logo/i);
      const file = new File(["png"], "logo.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      act(() => { capturedOnload?.(); });

      expect(screen.getByText(/usun logo/i)).toBeInTheDocument();

      await user.click(screen.getByText(/usun logo/i));
      expect(screen.queryByText(/usun logo/i)).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "FileReader", {
        configurable: true,
        writable: true,
        value: OriginalFileReader,
      });
    }
  });

  it("czysci timeout kopiowania przy odmontowaniu", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const timerUser = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    const { unmount } = renderWithProviders(<Home />);
    await timerUser.type(getInput(), "https://example.com");
    await timerUser.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await timerUser.click(
      screen.getByText("Skopiuj").closest("button") as HTMLElement
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skopiowano/i })).toBeInTheDocument();
    });

    // Odmontuj z aktywnym timeoutem - test pokrywa cleanup effect
    unmount();
    vi.useRealTimers();
  });

  it("resetuje timeout kopiowania przy ponownym kopiowaniu", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const timerUser = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    renderWithProviders(<Home />);
    await timerUser.type(getInput(), "https://example.com");
    await timerUser.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    // Pierwsze kopiowanie
    await timerUser.click(
      screen.getByText("Skopiuj").closest("button") as HTMLElement
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skopiowano/i })).toBeInTheDocument();
    });

    // Drugie kopiowanie przed uplywem 2s - pokrywa clearCopyResetTimeout branch
    await timerUser.click(
      screen.getByRole("button", { name: /skopiowano/i })
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skopiowano/i })).toBeInTheDocument();
    });

    act(() => { vi.advanceTimersByTime(2000); });

    await waitFor(() => {
      expect(screen.getByText("Skopiuj").closest("button")).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("wyswietla placeholder w panelu wynikow przed generowaniem", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText("Miejsce na Twój Kod QR")).toBeInTheDocument();
  });

  it("po generowaniu wyswietla przycisk powrotu do edycji", async () => {
    renderWithProviders(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    const backButton = screen.getByText(/edytuj projekt/i).closest("button");
    expect(backButton).toBeInTheDocument();

    await user.click(backButton!);

    // Po kliknieciu powrotu formularz jest widoczny
    expect(getInput()).toBeInTheDocument();
  });

  it("generuje QR z wlasnym logo w trybie zaawansowanym", async () => {
    const OriginalImage = window.Image;
    const OriginalFileReader = window.FileReader;
    let capturedOnload: (() => void) | null = null;

    Object.defineProperty(window, "Image", {
      configurable: true,
      writable: true,
      value: class MockImage {
        onload: null | (() => void) = null;
        onerror: null | (() => void) = null;
        set src(_value: string) { this.onload?.(); }
      },
    });

    Object.defineProperty(window, "FileReader", {
      configurable: true,
      writable: true,
      value: class MockFileReader {
        onload: (() => void) | null = null;
        result = "data:image/png;base64,customlogo";
        readAsDataURL = () => { capturedOnload = this.onload; };
      },
    });

    // Mock canvas getContext zeby drawLogoOnCanvas mogl narysowac logo
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const noop = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      beginPath: noop, moveTo: noop, lineTo: noop, arcTo: noop,
      quadraticCurveTo: noop, closePath: noop, clip: noop, fill: noop,
      drawImage: noop, save: noop, restore: noop, fillRect: noop,
      fillStyle: "",
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    try {
      renderWithProviders(<Home />);
      await user.click(screen.getByRole("tab", { name: /z logotypem/i }));

      const fileInput = screen.getByLabelText(/wgraj wlasne logo/i);
      const file = new File(["png"], "logo.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      act(() => { capturedOnload?.(); });

      await user.type(getInput(), "https://example.com");
      await user.click(getGenerateButton());

      await waitFor(() => {
        expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
      });

      expect(generateQRToCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        "https://example.com",
        expect.objectContaining({ errorCorrectionLevel: "H" })
      );
    } finally {
      Object.defineProperty(window, "Image", {
        configurable: true,
        writable: true,
        value: OriginalImage,
      });
      Object.defineProperty(window, "FileReader", {
        configurable: true,
        writable: true,
        value: OriginalFileReader,
      });
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    }
  });
});
