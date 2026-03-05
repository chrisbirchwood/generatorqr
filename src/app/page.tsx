"use client";

import { useState, useRef, useCallback } from "react";
import QRCode from "qrcode";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Wprowadz link");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError("Wprowadz poprawny URL (np. https://example.com)");
      return;
    }

    setError("");
    setCopied(false);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, trimmed, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      setQrDataUrl(dataUrl);
    } catch {
      setError("Nie udalo sie wygenerowac kodu QR");
    }
  }, [url]);

  const copyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Nie udalo sie skopiowac"));
        }, "image/png");
      });

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (qrDataUrl) {
        const link = document.createElement("a");
        link.download = "qr-code.png";
        link.href = qrDataUrl;
        link.click();
      }
    }
  }, [qrDataUrl]);

  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      generateQR();
    }
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
          <div className="flex flex-col gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
            {error && (
              <p className="text-red-500 text-sm px-1">{error}</p>
            )}
            <button
              onClick={generateQR}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-colors text-sm sm:text-base cursor-pointer"
            >
              Generuj kod QR
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {qrDataUrl && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="Kod QR"
                  className="w-48 h-48 sm:w-64 sm:h-64"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm sm:text-base cursor-pointer ${
                    copied
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200"
                  }`}
                >
                  {copied ? "Skopiowano!" : "Kopiuj"}
                </button>
                <button
                  onClick={downloadQR}
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
