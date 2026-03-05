import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock ClipboardItem ktory nie istnieje w jsdom
if (typeof globalThis.ClipboardItem === "undefined") {
  globalThis.ClipboardItem = class ClipboardItem {
    readonly types: string[];
    constructor(private items: Record<string, Blob>) {
      this.types = Object.keys(items);
    }
    async getType(type: string) {
      return this.items[type];
    }
  } as unknown as typeof ClipboardItem;
}

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  createImageData: vi.fn(() => []),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  clip: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  canvas: { width: 300, height: 300 },
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(
  () => "data:image/png;base64,mockdata"
);

HTMLCanvasElement.prototype.toBlob = vi.fn(function (
  this: HTMLCanvasElement,
  callback: BlobCallback
) {
  callback(new Blob(["mock"], { type: "image/png" }));
}) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
