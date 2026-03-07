import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home, {
  validateUrl,
  generateQRToCanvas,
  generateQRToSVG,
  copyCanvasToClipboard,
  downloadDataUrl,
  downloadSvgString,
} from "./page";

// Mock qrcode - dynamic import
vi.mock("qrcode", () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
    toString: vi.fn().mockResolvedValue("<svg>mock</svg>"),
  },
}));

function getInput() {
  return screen.getByRole("textbox", { name: /link do zakodowania/i });
}

function getGenerateButton() {
  return screen.getByRole("button", { name: /generuj|generowanie/i });
}

// --- Unit testy wyodrebnionych funkcji ---

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

describe("generateQRToCanvas", () => {
  it("generuje QR i zwraca data URL", async () => {
    const canvas = document.createElement("canvas");
    const result = await generateQRToCanvas(canvas, "https://example.com");
    expect(result).toBe("data:image/png;base64,mockdata");
  });

  it("rzuca blad gdy qrcode zawiedzie", async () => {
    const { default: QRCode } = await import("qrcode");
    vi.mocked(QRCode.toCanvas).mockRejectedValueOnce(new Error("fail"));

    const canvas = document.createElement("canvas");
    await expect(
      generateQRToCanvas(canvas, "https://example.com")
    ).rejects.toThrow("fail");
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

    // Przywroc
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

describe("generateQRToSVG", () => {
  it("generuje SVG string", async () => {
    const result = await generateQRToSVG("https://example.com");
    expect(result).toBe("<svg>mock</svg>");
  });
});

describe("downloadSvgString", () => {
  it("tworzy blob URL i klika link", () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: mockClick });
      }
      return el;
    });

    downloadSvgString("<svg>test</svg>", "test.svg");
    expect(mockClick).toHaveBeenCalled();
  });
});

describe("downloadDataUrl", () => {
  it("tworzy link i klika go", () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: mockClick });
      }
      return el;
    });

    downloadDataUrl("data:image/png;base64,test", "test.png");
    expect(mockClick).toHaveBeenCalled();
  });
});

// --- Testy komponentowe ---

describe("Home komponent", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
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
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await user.clear(getInput());
    await user.type(getInput(), "nie-url");
    await user.click(getGenerateButton());

    expect(
      screen.getByText("Wprowadz poprawny URL (np. https://example.com)")
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Kod QR")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /kopiuj do schowka/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pobierz jako png/i })
    ).not.toBeInTheDocument();
  });

  it("generuje QR dla poprawnego URL", async () => {
    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /kopiuj do schowka/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pobierz jako png/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pobierz jako svg/i })).toBeInTheDocument();
  });

  it("generuje QR po Enter", async () => {
    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });
  });

  it("wyswietla loading state", async () => {
    const { default: QRCode } = await import("qrcode");
    let resolveToCanvas!: () => void;
    vi.mocked(QRCode.toCanvas).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveToCanvas = resolve;
        })
    );

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    expect(screen.getByText("Generowanie...")).toBeInTheDocument();
    expect(getGenerateButton()).toBeDisabled();
    expect(getInput()).toBeDisabled();

    resolveToCanvas();
    await waitFor(() => {
      expect(screen.queryByText("Generowanie...")).not.toBeInTheDocument();
    });
  });

  it("nie rozpoczyna drugiego generowania podczas trwajacego requestu", async () => {
    const { default: QRCode } = await import("qrcode");
    vi.mocked(QRCode.toCanvas).mockClear();

    let resolveToCanvas!: () => void;
    vi.mocked(QRCode.toCanvas).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveToCanvas = resolve;
        })
    );

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    expect(QRCode.toCanvas).toHaveBeenCalledTimes(1);

    fireEvent.submit(getGenerateButton().closest("form")!);

    expect(QRCode.toCanvas).toHaveBeenCalledTimes(1);

    resolveToCanvas();
    await waitFor(() => {
      expect(screen.queryByText("Generowanie...")).not.toBeInTheDocument();
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
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await timerUser.click(screen.getByRole("button", { name: /kopiuj do schowka/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skopiowano/i })).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /kopiuj do schowka/i })).toBeInTheDocument();
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
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: mockClick });
      }
      return el;
    });

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /kopiuj do schowka/i }));

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it("pobiera QR jako PNG po kliknieciu ikony PNG", async () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: mockClick });
      }
      return el;
    });

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pobierz jako png/i }));
    expect(mockClick).toHaveBeenCalled();
  });

  it("pobiera QR jako SVG po kliknieciu ikony SVG", async () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: mockClick });
      }
      return el;
    });

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pobierz jako svg/i }));
    expect(mockClick).toHaveBeenCalled();
  });

  it("wyswietla blad gdy generowanie zawiedzie", async () => {
    const { default: QRCode } = await import("qrcode");
    vi.mocked(QRCode.toCanvas).mockRejectedValueOnce(new Error("QR error"));

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
    const { default: QRCode } = await import("qrcode");

    render(<Home />);
    await user.type(getInput(), "https://example.com");
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(screen.getByAltText("Kod QR")).toBeInTheDocument();
    });

    await user.clear(getInput());
    await user.type(getInput(), "https://example.org");
    vi.mocked(QRCode.toCanvas).mockRejectedValueOnce(new Error("QR error"));
    await user.click(getGenerateButton());

    await waitFor(() => {
      expect(
        screen.getByText("Nie udalo sie wygenerowac kodu QR")
      ).toBeInTheDocument();
    });

    expect(screen.queryByAltText("Kod QR")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /kopiuj do schowka/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pobierz jako png/i })
    ).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: /kopiuj do schowka/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pobierz jako png/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pobierz jako svg/i })).not.toBeInTheDocument();
  });
});
