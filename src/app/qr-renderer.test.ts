import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  DEFAULT_QR_APPEARANCE,
  generateQRToCanvas,
  generateQRToSVG,
  normalizeHexColor,
} from "./qr-renderer";

const mockCreate = vi.fn();

vi.mock("qrcode", () => ({
  create: mockCreate,
  default: {
    create: mockCreate,
  },
}));

function createMatrix(
  size = 21,
  activeCells: Array<[number, number]> = [
    [8, 8],
    [8, 9],
    [9, 8],
    [10, 11],
    [12, 13],
  ]
) {
  const activeSet = new Set(activeCells.map(([row, col]) => `${row}:${col}`));

  return {
    size,
    get(row: number, col: number) {
      return activeSet.has(`${row}:${col}`) ? 1 : 0;
    },
  };
}

describe("normalizeHexColor", () => {
  it("normalizuje kolor do wielkich liter", () => {
    expect(normalizeHexColor("#12ab34", "#000000")).toBe("#12AB34");
  });

  it("rozszerza skrocony zapis hex", () => {
    expect(normalizeHexColor("#abc", "#000000")).toBe("#AABBCC");
  });

  it("uzywa fallbacku dla niepoprawnej wartosci", () => {
    expect(normalizeHexColor("blue", "#F6E4B5")).toBe("#F6E4B5");
  });
});

describe("generateQRToCanvas", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockReturnValue({ modules: createMatrix() });
  });

  it("generuje QR i zwraca data URL", async () => {
    const canvas = document.createElement("canvas");

    const result = await generateQRToCanvas(canvas, "https://example.com", {
      ...DEFAULT_QR_APPEARANCE,
      errorCorrectionLevel: "H",
    });

    expect(result).toBe("data:image/png;base64,mockdata");
    expect(mockCreate).toHaveBeenCalledWith("https://example.com", {
      errorCorrectionLevel: "H",
    });
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(300);
  });

  it("rzuca blad gdy generowanie macierzy zawiedzie", async () => {
    mockCreate.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    const canvas = document.createElement("canvas");

    await expect(
      generateQRToCanvas(canvas, "https://example.com")
    ).rejects.toThrow("fail");
  });
});

describe("generateQRToSVG", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockReturnValue({ modules: createMatrix() });
  });

  it("generuje SVG string z wybranymi kolorami", async () => {
    const result = await generateQRToSVG("https://example.com", {
      moduleShape: "dots",
      darkColor: "#123ABC",
      lightColor: "#F5E1AA",
    });

    expect(result).toContain('fill="#F5E1AA"');
    expect(result).toContain('fill="#123ABC"');
    expect(result).toContain("<circle");
  });

  it("rysuje path dla stylu diamentowego", async () => {
    const result = await generateQRToSVG("https://example.com", {
      moduleShape: "diamond",
    });

    expect(result).toContain("<path");
  });
});
