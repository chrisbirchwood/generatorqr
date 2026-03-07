"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { resetCookieConsent } from "./components/CookieBanner";
import {
  DEFAULT_QR_APPEARANCE,
  QR_STYLE_OPTIONS,
  generateQRToCanvas,
  generateQRToSVG,
  normalizeHexColor,
  type QrModuleShape,
} from "./qr-renderer";

const URL_INPUT_ID = "qr-url";
const URL_ERROR_ID = "qr-url-error";

type TabMode = "basic" | "advanced";
type LogoVariant = "color" | "monochrome";
type PresetLogo =
  | "whatsapp"
  | "instagram"
  | "x"
  | "tiktok"
  | "facebook"
  | "telegram"
  | "signal";

const PRESET_LOGOS: Record<PresetLogo, { label: string; svg: string; color: string }> = {
  whatsapp: {
    label: "WhatsApp",
    color: "#25D366",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  },
  x: {
    label: "X",
    color: "#000000",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  },
  tiktok: {
    label: "TikTok",
    color: "#000000",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M15.84 2c.33 1.86 1.45 3.73 3.96 4.1v3.04c-1.47-.04-2.84-.44-3.96-1.2v7.36a6.16 6.16 0 1 1-6.17-6.16c.34 0 .67.03.99.09v3.16a3.28 3.28 0 1 0 2.3 3.11V2h2.88z"/></svg>`,
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11 10.12 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.54-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.94-1.96 1.9v2.29h3.34l-.53 3.49h-2.81V24C19.61 23.07 24 18.09 24 12.07z"/></svg>`,
  },
  telegram: {
    label: "Telegram",
    color: "#229ED9",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M21.55 4.18 2.82 11.4c-1.28.52-1.27 1.24-.23 1.56l4.8 1.5 11.1-7c.52-.32 1-.15.61.2l-8.99 8.11-.35 4.9c.52 0 .75-.24 1.04-.53l2.5-2.43 5.2 3.84c.96.53 1.66.26 1.9-.89l3.44-16.2c.34-1.42-.54-2.06-1.79-1.48z"/></svg>`,
  },
  signal: {
    label: "Signal",
    color: "#3A76F0",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2.5c-5.25 0-9.5 3.78-9.5 8.45 0 2.35 1.1 4.47 2.87 6l-.3 3.98 3.85-2.1c.96.3 1.99.46 3.08.46 5.25 0 9.5-3.78 9.5-8.44S17.25 2.5 12 2.5Zm0 2.02c4.12 0 7.46 2.88 7.46 6.43s-3.34 6.42-7.46 6.42c-1.01 0-1.98-.17-2.86-.47l-.39-.13-1.52.83.12-1.57-.38-.31c-1.54-1.26-2.43-3.05-2.43-4.77 0-3.55 3.34-6.43 7.46-6.43Z"/><circle cx="5.9" cy="7.1" r=".85"/><circle cx="18.1" cy="7.1" r=".85"/><circle cx="3.95" cy="10.55" r=".72"/><circle cx="20.05" cy="10.55" r=".72"/><circle cx="5.05" cy="14.1" r=".72"/><circle cx="18.95" cy="14.1" r=".72"/></svg>`,
  },
};

const STYLE_PREVIEW_CELLS = [
  [0, 0],
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [2, 3],
  [3, 0],
  [3, 2],
] as const;

function getShapePreviewStyle(
  moduleShape: QrModuleShape,
  row: number,
  col: number
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    backgroundColor: "#263A63",
  };

  if (moduleShape === "dots") {
    return {
      ...baseStyle,
      borderRadius: "999px",
    };
  }

  if (moduleShape === "rounded") {
    return {
      ...baseStyle,
      borderRadius: "0.45rem",
    };
  }

  if (moduleShape === "connected") {
    const top = row === 0;
    const right = col === 3;
    const bottom = row === 3;
    const left = col === 0;

    return {
      ...baseStyle,
      borderRadius: `${top && left ? "0.65rem" : "0.2rem"} ${top && right ? "0.65rem" : "0.2rem"
        } ${bottom && right ? "0.65rem" : "0.2rem"} ${bottom && left ? "0.65rem" : "0.2rem"
        }`,
    };
  }

  if (moduleShape === "diamond") {
    return {
      ...baseStyle,
      borderRadius: "0.2rem",
      transform: "rotate(45deg) scale(0.82)",
    };
  }

  return baseStyle;
}

function ModuleShapePreview({ moduleShape }: { moduleShape: QrModuleShape }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const isActive = STYLE_PREVIEW_CELLS.some(
          ([activeRow, activeCol]) => activeRow === row && activeCol === col
        );

        return (
          <span
            key={`${row}-${col}`}
            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isActive ? "" : "bg-zinc-200 dark:bg-slate-200"
              }`}
            style={isActive ? getShapePreviewStyle(moduleShape, row, col) : undefined}
          />
        );
      })}
    </div>
  );
}

function ColorField({
  label,
  pickerLabel,
  value,
  onChange,
}: {
  label: string;
  pickerLabel: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [textValue, setTextValue] = useState(value.replace(/^#/, ""));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTextValue(value.replace(/^#/, ""));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6).toUpperCase();
    setTextValue(newValue);
    if (newValue.length === 6 || newValue.length === 3) {
      onChange(normalizeHexColor("#" + newValue, value));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(normalizeHexColor(newValue, value));
  };

  return (
    <div className="flex flex-col gap-1.5 focus-within:text-blue-500 dark:focus-within:text-gold-400 group">
      <span className="px-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 group-focus-within:text-blue-600 dark:group-focus-within:text-gold-400 transition-colors">
        {label}
      </span>
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 pl-3 pr-2 py-1.5 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:border-gold-500 dark:focus-within:ring-gold-500">
        <label className="flex items-center gap-1.5 cursor-text flex-1">
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-sm">#</span>
          <input
            type="text"
            value={textValue}
            onChange={handleTextChange}
            className="w-16 bg-transparent text-zinc-900 dark:text-white font-mono text-sm focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 uppercase"
            maxLength={6}
          />
        </label>
        <input
          type="color"
          aria-label={pickerLabel}
          value={value}
          onChange={handleColorChange}
          className="h-8 w-8 cursor-pointer rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent p-0.5"
        />
      </div>
    </div>
  );
}

function LogoVariantSwitch({
  value,
  onChange,
}: {
  value: LogoVariant;
  onChange: (nextValue: LogoVariant) => void;
}) {
  const options: Array<{ value: LogoVariant; label: string }> = [
    {
      value: "color",
      label: "Kolorowe",
    },
    {
      value: "monochrome",
      label: "Mono",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 group">
      <span className="px-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors">
        Wariant logo
      </span>
      <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 p-1 shadow-sm transition-all">
        <div className="grid grid-cols-2 gap-1 w-full">
          {options.map((option) => {
            const isActive = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                aria-label={`Wariant logo ${option.label}`}
                onClick={() => onChange(option.value)}
                className={`rounded-xl px-2 py-1.5 text-center transition-all ${isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-white/10"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                  }`}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LogoPresetButton({
  label,
  backgroundColor,
  selected,
  onClick,
  children,
}: {
  label: string;
  backgroundColor: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border-2 shadow-sm ${selected
          ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-gold-500 dark:ring-gold-500/30"
          : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30"
          }`}
        style={{ backgroundColor }}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-100 border border-white/10 opacity-0 shadow-lg transition-opacity duration-150 whitespace-nowrap group-hover:opacity-100 group-focus-within:opacity-100 z-10">
        {label}
      </span>
    </div>
  );
}

function getPresetLogoPreview(
  preset: PresetLogo,
  variant: LogoVariant,
  darkColor: string,
  lightColor: string
) {
  return {
    backgroundColor:
      variant === "monochrome" ? darkColor : PRESET_LOGOS[preset].color,
    svg:
      variant === "monochrome"
        ? PRESET_LOGOS[preset].svg.replace(/fill="white"/gi, `fill="${lightColor}"`)
        : PRESET_LOGOS[preset].svg,
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nie udalo sie zaladowac obrazka"));
    img.src = src;
  });
}

export function drawLogoOnCanvas(
  canvas: HTMLCanvasElement,
  logoImg: HTMLImageElement,
  logoSizeFraction = 0.22,
  backgroundColor = "#FFFFFF"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const logoSize = Math.floor(canvas.width * logoSizeFraction);
  const x = Math.floor((canvas.width - logoSize) / 2);
  const y = Math.floor((canvas.height - logoSize) / 2);

  const padding = Math.floor(logoSize * 0.1);
  const bgSize = logoSize + padding * 2;
  const bgX = x - padding;
  const bgY = y - padding;
  const radius = Math.floor(bgSize * 0.15);

  ctx.beginPath();
  ctx.moveTo(bgX + radius, bgY);
  ctx.lineTo(bgX + bgSize - radius, bgY);
  ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
  ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
  ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
  ctx.lineTo(bgX + radius, bgY + bgSize);
  ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
  ctx.lineTo(bgX, bgY + radius);
  ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
  ctx.closePath();
  ctx.fillStyle = backgroundColor;
  ctx.fill();

  ctx.drawImage(logoImg, x, y, logoSize, logoSize);
}

export function presetLogoToDataUrl(
  preset: PresetLogo,
  options?: {
    variant?: LogoVariant;
    backgroundColor?: string;
    iconColor?: string;
  }
): string {
  const { svg, color } = PRESET_LOGOS[preset];
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const innerSvg = svg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const iconViewBox = viewBoxMatch?.[1] ?? "0 0 24 24";
  const variant = options?.variant ?? "color";
  const badgeColor =
    variant === "monochrome"
      ? options?.backgroundColor ?? DEFAULT_QR_APPEARANCE.darkColor
      : color;
  const iconColor =
    variant === "monochrome"
      ? options?.iconColor ?? DEFAULT_QR_APPEARANCE.lightColor
      : "#FFFFFF";
  const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="15" fill="${badgeColor}"/>
    <svg x="18" y="18" width="64" height="64" viewBox="${iconViewBox}" preserveAspectRatio="xMidYMid meet" fill="${iconColor}">
      ${innerSvg}
    </svg>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(wrappedSvg)}`;
}

export function injectLogoIntoSvg(
  svgString: string,
  logoDataUrl: string,
  logoSizeFraction = 0.22,
  backgroundColor = "#FFFFFF"
): string {
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) return svgString;
  const parts = viewBoxMatch[1].split(/\s+/).map(Number);
  const svgWidth = parts[2];
  const svgHeight = parts[3];

  const logoSize = Math.floor(svgWidth * logoSizeFraction);
  const padding = Math.floor(logoSize * 0.1);
  const bgSize = logoSize + padding * 2;
  const x = (svgWidth - logoSize) / 2;
  const y = (svgHeight - logoSize) / 2;
  const bgX = x - padding;
  const bgY = y - padding;
  const radius = Math.floor(bgSize * 0.15);

  const logoElement = `<rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${radius}" fill="${backgroundColor}"/><image href="${logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}"/>`;

  return svgString.replace("</svg>", `${logoElement}</svg>`);
}

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

export function downloadSvgString(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function getQRFilename(ext: string): string {
  return `qr-${Date.now()}.${ext}`;
}

function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Next-themes hydration safety
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-zinc-900/50 backdrop-blur-xl transition-all cursor-pointer shadow-sm pointer-events-none opacity-0" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm group"
      title="Przełącz motyw"
      aria-label="Przełącz motyw"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <Sun className="absolute w-5 h-5 text-zinc-600 dark:text-zinc-400 dark:hover:text-gold-400 hover:text-blue-500 transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute w-5 h-5 text-zinc-600 dark:text-zinc-400 dark:hover:text-gold-400 hover:text-blue-500 transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      </div>
    </button>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabMode>("basic");
  const [wizardStep, setWizardStep] = useState<"form" | "result">("form");
  const [selectedPreset, setSelectedPreset] = useState<PresetLogo | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>("color");
  const [moduleShape, setModuleShape] = useState<QrModuleShape>(
    DEFAULT_QR_APPEARANCE.moduleShape
  );
  const [darkColor, setDarkColor] = useState(DEFAULT_QR_APPEARANCE.darkColor);
  const [lightColor, setLightColor] = useState(DEFAULT_QR_APPEARANCE.lightColor);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const isGeneratingRef = useRef(false);
  const isAdvancedTab = tab === "advanced";
  const normalizedDarkColor = normalizeHexColor(
    darkColor,
    DEFAULT_QR_APPEARANCE.darkColor
  );
  const normalizedLightColor = normalizeHexColor(
    lightColor,
    DEFAULT_QR_APPEARANCE.lightColor
  );

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

  const handleGenerate = async (
    overrides?: {
      logoVariant?: LogoVariant;
    }
  ) => {
    if (isGeneratingRef.current) {
      return;
    }

    clearCopyResetTimeout();
    setCopied(false);
    setQrDataUrl(null);
    setQrSvg(null);

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

      const appearance = isAdvancedTab
        ? {
          moduleShape,
          darkColor: normalizedDarkColor,
          lightColor: normalizedLightColor,
        }
        : DEFAULT_QR_APPEARANCE;
      const activeLogoUrl = isAdvancedTab
        ? selectedPreset
          ? presetLogoToDataUrl(selectedPreset, {
            variant: overrides?.logoVariant ?? logoVariant,
            backgroundColor: appearance.darkColor,
            iconColor: appearance.lightColor,
          })
          : customLogoUrl
        : null;
      const ecLevel = activeLogoUrl ? "H" : "M";

      const [, svg] = await Promise.all([
        generateQRToCanvas(canvas, trimmedUrl, {
          ...appearance,
          errorCorrectionLevel: ecLevel,
        }),
        generateQRToSVG(trimmedUrl, {
          ...appearance,
          errorCorrectionLevel: ecLevel,
        }),
      ]);

      if (activeLogoUrl) {
        const logoImg = await loadImage(activeLogoUrl);
        drawLogoOnCanvas(canvas, logoImg, 0.22, appearance.lightColor);
      }

      const dataUrl = canvas.toDataURL("image/png");
      setQrDataUrl(dataUrl);
      setQrSvg(
        activeLogoUrl
          ? injectLogoIntoSvg(svg, activeLogoUrl, 0.22, appearance.lightColor)
          : svg
      );
      setWizardStep("result");
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
      downloadDataUrl(qrDataUrl, getQRFilename("png"));
    }
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, getQRFilename("png"));
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    downloadSvgString(qrSvg, getQRFilename("svg"));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleGenerate();
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogoUrl(reader.result as string);
      setSelectedPreset(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: PresetLogo) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(preset);
      setCustomLogoUrl(null);
    }
  };

  const handleTabChange = (newTab: TabMode) => {
    setTab(newTab);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-3 sm:p-6 lg:p-8 lg:py-4 relative transition-colors duration-500">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-50">
        <ThemeSwitcher />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 justify-center">
        {/* Left Column - Controls (Hidden if step is "result") */}
        <div className={`flex-1 lg:max-w-[42rem] flex flex-col pt-0 lg:pt-2 ${wizardStep === "result" ? "hidden" : "flex"}`}>
          <div className="mb-4 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-blue-500 dark:from-gold-400 dark:via-gold-500 dark:to-gold-600 mb-1.5 tracking-tight">
              Generator QR
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0">
              Transformuj linki w eleganckie, luksusowe kody QR perfekcyjnej jakości. Ekskluzywne i darmowe narzędzie.
            </p>
          </div>

          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl shadow-zinc-200/50 dark:shadow-black border border-zinc-200 dark:border-white/5 p-4 sm:p-5 relative overflow-hidden transition-all">
            {/* Ambient background glow inside the form card */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-400/20 dark:bg-gold-500/5 blur-3xl pointer-events-none" />

            <div className="flex mb-3 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 p-1 border border-zinc-200 dark:border-white/5 relative z-10 transition-colors" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "basic"}
                onClick={() => handleTabChange("basic")}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${tab === "basic"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-gold-400 shadow-sm dark:shadow-lg ring-1 ring-zinc-200 dark:ring-white/10"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/30"
                  }`}
              >
                Podstawowy
              </button>
              <button
                role="tab"
                aria-selected={tab === "advanced"}
                onClick={() => handleTabChange("advanced")}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${tab === "advanced"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-gold-400 shadow-sm dark:shadow-lg ring-1 ring-zinc-200 dark:ring-white/10"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/30"
                  }`}
              >
                Z logotypem
              </button>
            </div>

            <form className="flex flex-col gap-2.5" noValidate onSubmit={handleSubmit}>
              <label
                htmlFor={URL_INPUT_ID}
                className="px-1 text-sm font-medium text-zinc-600 dark:text-zinc-300"
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
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-gold-500/50 focus:border-blue-500 dark:focus:border-gold-500 transition-all text-sm sm:text-base"
              />

              {tab === "advanced" && (
                <>
                  <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/30 p-3 sm:p-4 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="px-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          Styl modulu QR
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                          {QR_STYLE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setModuleShape(option.value)}
                              aria-pressed={moduleShape === option.value}
                              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2 text-xs font-semibold transition-all cursor-pointer ${moduleShape === option.value
                                ? "border-blue-500 dark:border-gold-500 bg-blue-400/10 dark:bg-gold-500/10 text-blue-600 dark:text-gold-400 shadow-[0_0_10px_rgba(59,130,246,0.15)] dark:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                                : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-800 dark:hover:text-zinc-200"
                                }`}
                            >
                              <ModuleShapePreview moduleShape={option.value} />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-[10rem_10rem_minmax(12rem,1fr)]">
                        <ColorField
                          label="Kolor kodu QR"
                          pickerLabel="Wybierz kolor kodu QR"
                          value={darkColor}
                          onChange={setDarkColor}
                        />
                        <ColorField
                          label="Kolor tla"
                          pickerLabel="Wybierz kolor tla"
                          value={lightColor}
                          onChange={setLightColor}
                        />
                        <LogoVariantSwitch
                          value={logoVariant}
                          onChange={(nextValue) => {
                            setLogoVariant(nextValue);
                            if (qrDataUrl && selectedPreset) {
                              void handleGenerate({ logoVariant: nextValue });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="px-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      Logo w centrum kodu QR
                    </span>
                    <div className="flex gap-1.5 items-center flex-wrap">
                      {(Object.keys(PRESET_LOGOS) as PresetLogo[]).map((key) => {
                        const preview = getPresetLogoPreview(
                          key,
                          logoVariant,
                          normalizedDarkColor,
                          normalizedLightColor
                        );

                        return (
                          <LogoPresetButton
                            key={key}
                            label={PRESET_LOGOS[key].label}
                            backgroundColor={preview.backgroundColor}
                            selected={selectedPreset === key}
                            onClick={() => handleSelectPreset(key)}
                          >
                            <span
                              className="w-6 h-6 block"
                              dangerouslySetInnerHTML={{ __html: preview.svg }}
                            />
                          </LogoPresetButton>
                        );
                      })}
                      <button
                        type="button"
                        title="Wgraj wlasne logo"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border-2 shadow-sm ${customLogoUrl && !selectedPreset
                          ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-gold-500 dark:ring-gold-500/30 bg-white dark:bg-zinc-800"
                          : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30 bg-zinc-50 dark:bg-zinc-900"
                          }`}
                      >
                        {customLogoUrl && !selectedPreset ? (
                          <Image
                            src={customLogoUrl}
                            alt="Wlasne logo"
                            width={24}
                            height={24}
                            unoptimized
                            className="h-6 w-6 object-contain rounded"
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCustomLogoUpload}
                        className="hidden"
                        aria-label="Wgraj wlasne logo"
                      />
                      {(selectedPreset || customLogoUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset(null);
                            setCustomLogoUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer ml-1"
                        >
                          Usun logo
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <p id={URL_ERROR_ID} className="text-red-500 text-sm px-1 font-medium mt-1">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-500 hover:via-blue-400 hover:to-blue-300 active:from-blue-700 active:to-blue-600 dark:from-gold-600 dark:via-gold-500 dark:to-gold-400 dark:hover:from-gold-500 dark:hover:via-gold-400 dark:hover:to-gold-300 dark:active:from-gold-700 dark:active:to-gold-600 disabled:from-zinc-200 disabled:to-zinc-200 dark:disabled:from-zinc-800 dark:disabled:to-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-white dark:text-zinc-950 font-bold tracking-wide rounded-xl text-base cursor-pointer disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
              >
                {loading ? "Generowanie..." : "Generuj kod QR"}
              </button>
            </form>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Footer links under controls */}
          <div className="text-zinc-500 dark:text-zinc-500 text-[11px] mt-6 space-y-1.5 text-center lg:text-left transition-colors">
            <p>Kody generowane lokalnie.</p>
            <p className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 sm:gap-2">
              <span>Stworzone przez <span className="text-zinc-700 dark:text-zinc-400 font-medium">Krzysztof Brzezina</span></span>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
              <a
                href="https://wa.me/48517466553"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-gold-500 hover:text-blue-500 dark:hover:text-gold-400 font-medium transition-colors"
              >
                WhatsApp 517 466 553
              </a>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
              <a
                href="mailto:krzysztof.brzezina@gmail.com"
                className="text-blue-600 dark:text-gold-500 hover:text-blue-500 dark:hover:text-gold-400 font-medium transition-colors"
              >
                krzysztof.brzezina@gmail.com
              </a>
            </p>
            <p className="space-x-2 pt-2">
              <a
                href="/regulamin"
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Regulamin i polityka
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <button
                onClick={resetCookieConsent}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Ustawienia cookies
              </button>
            </p>
          </div>
        </div>

        {/* Right Column - QR Code Result Area (Hidden if step is "form") */}
        <div className={`flex-1 lg:max-w-[45rem] mt-8 lg:mt-0 flex flex-col justify-center ${wizardStep === "form" ? "hidden" : "flex"}`}>
          <div className="sticky top-12 lg:top-24 w-full h-full min-h-[500px] flex items-center justify-center bg-white/40 dark:bg-zinc-950/40 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 relative overflow-hidden backdrop-blur-2xl shadow-xl dark:shadow-none transition-colors">

            {/* Subtle animated background glow for the right column */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 dark:from-gold-500/5 to-transparent pointer-events-none" />

            {!qrDataUrl && !loading && (
              <div className="text-center p-8 flex flex-col items-center justify-center z-10 opacity-70">
                <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-6 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-600 transition-colors">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                    <path d="M3 12h.01" />
                    <path d="M12 3h.01" />
                    <path d="M12 16v.01" />
                    <path d="M16 12h1" />
                    <path d="M21 12v.01" />
                    <path d="M12 21v-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-300 mb-2 transition-colors">Miejsce na Twój Kod QR</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-xs transition-colors">Wypełnij formularz obok i kliknij generuj, aby zobaczyć magię.</p>
              </div>
            )}

            {loading && (
              <div className="z-10 flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 dark:border-gold-500/20 dark:border-t-gold-500 rounded-full animate-spin mb-4" />
                <p className="text-blue-600 dark:text-gold-400 font-medium">Tworzenie arcydzieła...</p>
              </div>
            )}

            {qrDataUrl && !loading && (
              <div className="z-10 flex flex-col items-center gap-8 p-6 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="relative group perspective-1000">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 dark:from-gold-600 dark:to-gold-400 rounded-[2rem] blur-xl opacity-30 dark:opacity-20 group-hover:opacity-50 dark:group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white p-6 rounded-3xl shadow-2xl transition-transform duration-500 transform group-hover:scale-[1.02]">
                    <Image
                      src={qrDataUrl}
                      alt="Twój Luksusowy Kod QR"
                      width={320}
                      height={320}
                      unoptimized
                      className="w-56 h-56 sm:w-72 sm:h-72 object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center w-full">
                  <button
                    onClick={handleCopy}
                    title={copied ? "Skopiowano!" : "Kopiuj do schowka"}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all cursor-pointer font-medium shadow-md ${copied
                      ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30"
                      : "bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                      }`}
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        <span>Skopiowano</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        <span>Skopiuj</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadPng}
                      title="Pobierz wysokiej jakości PNG"
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-md cursor-pointer font-medium"
                    >
                      <span>PNG</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </button>
                    <button
                      onClick={handleDownloadSvg}
                      title="Pobierz wektorowy SVG"
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-md cursor-pointer font-medium"
                    >
                      <span>SVG</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    </button>
                  </div>
                </div>

                {/* Back to Editing Button */}
                <button
                  onClick={() => setWizardStep("form")}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-4 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-white/5 rounded-2xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  <span>Edytuj projekt kodu QR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
