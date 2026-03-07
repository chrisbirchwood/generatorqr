import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_QR_APPEARANCE,
  generateQRToCanvas,
  generateQRToSVG,
} from "./qr-renderer";
import Home, {
  copyCanvasToClipboard,
  downloadDataUrl,
  downloadSvgString,
  injectLogoIntoSvg,
  presetLogoToDataUrl,
  validateUrl,
} from "./page";

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
  return screen.getByRole("textbox", { name: /link do zakodowania/i });
}

function getGenerateButton() {
  return screen.getByRole("button", { name: /generuj|generowanie/i });
}

describe("validateUrl", () => {
  it("zwraca blad dla pustego stringa", () => {
    expect(validateUrl("")).toEqual({
      valid: false,
      error: "Wprowadz link",
    });
  });

  it("zwraca blad dla samych spacji", () => {
    expect(validateUrl("   ")).toEqual({
      valid: false,
      error: "Wprowadz link",
    });
  });

  it("zwraca blad dla niepoprawnego URL", () => {
    expect(validateUrl("nie-url")).toEqual({
      valid: false,
      error: "Wprowadz poprawny URL (np. https://example.com)",
    });
  });

  it("zwraca blad dla protokolu javascript:", () => {
    expect(validateUrl("javascript:alert(1)")).toEqual({
      valid: false,
      error: "Dozwolone sa tylko linki http:// i https://",
    });
  });

  it("zwraca blad dla protokolu ftp:", () => {
    expect(validateUrl("ftp://example.com")).toEqual({
      valid: false,
      error: "Dozwolone sa tylko linki http:// i https://",
    });
  });

  it("akceptuje http URL", () => {
    expect(validateUrl("http://example.com")).toEqual({ valid: true });
  });

  it("akceptuje https URL", () => {
    expect(validateUrl("https://example.com")).toEqual({ valid: true });
  });

  it("akceptuje URL ze spacjami na poczatku/koncu", () => {
    expect(validateUrl("  https://example.com  ")).toEqual({ valid: true });
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
    render(<Home />);
    expect(screen.getByText("Generator QR")).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(getInput()).toHaveAccessibleName("Link do zakodowania");
    expect(getGenerateButton()).toBeInTheDocument();
  });

  it("w trybie podstawowym nie pokazuje ustawien zaawansowanych", () => {
    render(<Home />);
    expect(screen.queryByText("Styl modulu QR")).not.toBeInTheDocument();
    expect(screen.queryByText("Kolor kodu QR")).not.toBeInTheDocument();
    expect(screen.queryByText("Kolor tla")).not.toBeInTheDocument();
  });

  it("pokazuje ustawienia stylu i kolorow dopiero w trybie zaawansowanym", async () => {
    render(<Home />);
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
    render(<Home />);

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
      render(<Home />);

      await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
      await user.click(screen.getByRole("button", { name: /whatsapp/i }));
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

  it("w trybie mono kafelki presetow przyjmuja kolory z ustawien QR", async () => {
    render(<Home />);

    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    fireEvent.change(screen.getByLabelText(/wybierz kolor kodu qr/i), {
      target: { value: "#12AB34" },
    });
    fireEvent.change(screen.getByLabelText(/wybierz kolor tla/i), {
      target: { value: "#F5E1AA" },
    });
    await user.click(screen.getByRole("button", { name: /wariant logo mono/i }));

    const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
    expect(whatsappButton).toHaveStyle({ backgroundColor: "#12AB34" });

    const iconWrapper = whatsappButton.querySelector("span");
    expect(iconWrapper?.innerHTML).toContain('fill="#F5E1AA"');
  });

  it("w trybie podstawowym ignoruje wczesniej ustawione opcje zaawansowane", async () => {
    render(<Home />);

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
    render(<Home />);
    await user.click(getGenerateButton());
    expect(screen.getByText("Wprowadz link")).toBeInTheDocument();
  });

  it("wyswietla blad walidacji dla niepoprawnego URL", async () => {
    render(<Home />);
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());
    expect(
      screen.getByText("Wprowadz poprawny URL (np. https://example.com)")
    ).toBeInTheDocument();
  });

  it("wyswietla blad dla zablokowanego protokolu", async () => {
    render(<Home />);
    await user.type(getInput(), "ftp://example.com");
    await user.click(getGenerateButton());
    expect(
      screen.getByText("Dozwolone sa tylko linki http:// i https://")
    ).toBeInTheDocument();
  });

  it("czysci blad przy wpisywaniu", async () => {
    render(<Home />);
    await user.click(getGenerateButton());
    expect(screen.getByText("Wprowadz link")).toBeInTheDocument();
    await user.type(getInput(), "a");
    expect(screen.queryByText("Wprowadz link")).not.toBeInTheDocument();
  });

  it("usuwa poprzedni QR po walidacyjnym bledzie kolejnej proby", async () => {
    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Twój Luksusowy Kod QR")).toBeInTheDocument();
    });

    await user.clear(getInput());
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());

    expect(
      screen.getByText("Wprowadz poprawny URL (np. https://example.com)")
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Twój Luksusowy Kod QR")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Skopiuj")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("PNG")
    ).not.toBeInTheDocument();
  });

  it("generuje QR dla poprawnego URL", async () => {
    render(<Home />);
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
    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
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

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(
        screen.getByText("Nie udalo sie wygenerowac kodu QR")
      ).toBeInTheDocument();
    });
  });

  it("usuwa poprzedni QR gdy ponowne generowanie zawiedzie", async () => {
    render(<Home />);
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
        screen.getByText("Nie udalo sie wygenerowac kodu QR")
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
    render(<Home />);
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
    render(<Home />);
    expect(
      screen.queryByText("Skopiuj")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("PNG")).not.toBeInTheDocument();
    expect(screen.queryByText("SVG")).not.toBeInTheDocument();
  });

  it("renderuje zakladki Podstawowy i Z logotypem", () => {
    render(<Home />);
    expect(screen.getByRole("tab", { name: /podstawowy/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /z logotypem/i })).toBeInTheDocument();
  });

  it("domyslnie nie pokazuje wyboru logo", () => {
    render(<Home />);
    expect(screen.queryByText(/logo w centrum/i)).not.toBeInTheDocument();
  });

  it("pokazuje wybor logo po kliknieciu zakladki Z logotypem", async () => {
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    expect(screen.getByText(/logo w centrum/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^x$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tiktok/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /telegram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /signal/i })).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /wgraj wlasne logo/i })
    ).toBeInTheDocument();
  });

  it("ukrywa wybor logo po powrocie na zakladke Podstawowy", async () => {
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    expect(screen.getByText(/logo w centrum/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /podstawowy/i }));
    expect(screen.queryByText(/logo w centrum/i)).not.toBeInTheDocument();
  });

  it("pozwala wybrac preset logo i pokazuje przycisk Usun", async () => {
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    await user.click(screen.getByRole("button", { name: /whatsapp/i }));
    expect(screen.getByText(/usun logo/i)).toBeInTheDocument();
  });

  it("pozwala odznaczac preset logo klikajac ponownie", async () => {
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: /z logotypem/i }));
    await user.click(screen.getByRole("button", { name: /whatsapp/i }));
    expect(screen.getByText(/usun logo/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /whatsapp/i }));
    expect(screen.queryByText(/usun logo/i)).not.toBeInTheDocument();
  });

  it("renderuje przelacznik motywu po zamontowaniu obiektu", async () => {
    render(<Home />);
    const themeBtn = await screen.findByRole("button", { name: /przełącz motyw/i });
    expect(themeBtn).toBeInTheDocument();
  });
});
