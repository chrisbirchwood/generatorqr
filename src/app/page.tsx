"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const URL_INPUT_ID = "qr-url";
const URL_ERROR_ID = "qr-url-error";

export function validateUrl(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: "Wprowadz link" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: "Wprowadz poprawny URL (np. https://example.com)",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      valid: false,
      error: "Dozwolone sa tylko linki http:// i https://",
    };
  }

  return { valid: true };
}

export async function generateQRToCanvas(
  canvas: HTMLCanvasElement,
  url: string
): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  await QRCode.toCanvas(canvas, url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return canvas.toDataURL("image/png");
}

export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement
): Promise<boolean> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Nie udalo sie skopiowac"));
    }, "image/png");
  });

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);

  return true;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function getQRFilename(): string {
  return `qr-${Date.now()}.png`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const isGeneratingRef = useRef(false);

  const clearCopyResetTimeout = () => {
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (isGeneratingRef.current) {
      return;
    }

    clearCopyResetTimeout();
    setCopied(false);
    setQrDataUrl(null);

    const trimmedUrl = url.trim();
    const validation = validateUrl(trimmedUrl);
    if (!validation.valid) {
      setError(validation.error ?? "Wprowadz poprawny URL");
      return;
    }

    setError("");
    isGeneratingRef.current = true;
    setLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not ready");
      }

      const dataUrl = await generateQRToCanvas(canvas, trimmedUrl);
      setQrDataUrl(dataUrl);
    } catch {
      setError("Nie udalo sie wygenerowac kodu QR");
    } finally {
      isGeneratingRef.current = false;
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !qrDataUrl) {
      return;
    }

    try {
      clearCopyResetTimeout();
      await copyCanvasToClipboard(canvas);
      setCopied(true);
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 2000);
    } catch {
      downloadDataUrl(qrDataUrl, getQRFilename());
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) {
      return;
    }

    downloadDataUrl(qrDataUrl, getQRFilename());
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleGenerate();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Generator QR
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Wklej link i wygeneruj kod QR
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8">
          <form
            className="flex flex-col gap-3"
            noValidate
            onSubmit={handleSubmit}
          >
            <label
              htmlFor={URL_INPUT_ID}
              className="px-1 text-sm font-medium text-slate-700"
            >
              Link do zakodowania
            </label>
            <input
              id={URL_INPUT_ID}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              disabled={loading}
              placeholder="https://example.com"
              autoComplete="url"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? URL_ERROR_ID : undefined}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
            {error && (
              <p id={URL_ERROR_ID} className="text-red-500 text-sm px-1">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Generowanie..." : "Generuj kod QR"}
            </button>
          </form>

          <canvas ref={canvasRef} className="hidden" />

          {qrDataUrl && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <Image
                  src={qrDataUrl}
                  alt="Kod QR"
                  width={256}
                  height={256}
                  unoptimized
                  className="w-48 h-48 sm:w-64 sm:h-64"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCopy}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm sm:text-base cursor-pointer ${
                    copied
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200"
                  }`}
                >
                  {copied ? "Skopiowano!" : "Kopiuj"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors text-sm sm:text-base cursor-pointer"
                >
                  Pobierz
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-slate-400 text-xs mt-6 space-y-1">
          <p>Kody generowane lokalnie w przegladarce</p>
          <p>
            Stworzone przez{" "}
            <span className="text-slate-600 font-medium">Krzysztof Brzezina</span>
            {" | "}
            <a
              href="https://wa.me/48517466553"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              WhatsApp 517 466 553
            </a>
            {" | "}
            <a
              href="mailto:krzysztof.brzezina@gmail.com"
              className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              krzysztof.brzezina@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
