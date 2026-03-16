import type { BitMatrix } from "qrcode";

export type QrModuleShape =
  | "square"
  | "dots"
  | "rounded"
  | "connected"
  | "diamond";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type QrAppearance = {
  moduleShape: QrModuleShape;
  darkColor: string;
  lightColor: string;
};

export type QrRenderOptions = Partial<QrAppearance> & {
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  width?: number;
  margin?: number;
};

type MatrixLike = Pick<BitMatrix, "size" | "get">;

type CornerRadii = {
  tl: number;
  tr: number;
  br: number;
  bl: number;
};

type ResolvedQrRenderOptions = QrAppearance & {
  errorCorrectionLevel: QrErrorCorrectionLevel;
  width: number;
  margin: number;
};

type QrModuleNamespace = typeof import("qrcode") & {
  default?: {
    create?: typeof import("qrcode").create;
  };
};

const DEFAULT_WIDTH = 300;
const DEFAULT_MARGIN = 2;
const FINDER_SIZE = 7;
const FINDER_WHITE_RING_INSET = 1;
const FINDER_INNER_DOT_INSET = 2;

export const DEFAULT_QR_APPEARANCE: QrAppearance = {
  moduleShape: "square",
  darkColor: "#000000",
  lightColor: "#FFFFFF",
};

export const QR_STYLE_OPTIONS: ReadonlyArray<{
  value: QrModuleShape;
  label: string;
}> = [
  { value: "square", label: "Klasyczny" },
  { value: "dots", label: "Kropki" },
  { value: "rounded", label: "Zaokraglony" },
  { value: "connected", label: "Plynny" },
  { value: "diamond", label: "Diament" },
] as const;

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function resolveQrCreate(module: QrModuleNamespace) {
  const create = module.create ?? module.default?.create;

  if (!create) {
    throw new Error("QRCode.create is unavailable");
  }

  return create;
}

async function createMatrix(
  text: string,
  errorCorrectionLevel: QrErrorCorrectionLevel
): Promise<MatrixLike> {
  const qrcode = (await import("qrcode")) as QrModuleNamespace;
  const create = resolveQrCreate(qrcode);
  return create(text, { errorCorrectionLevel }).modules;
}

function resolveOptions(options: QrRenderOptions = {}): ResolvedQrRenderOptions {
  return {
    moduleShape: options.moduleShape ?? DEFAULT_QR_APPEARANCE.moduleShape,
    darkColor: normalizeHexColor(
      options.darkColor ?? DEFAULT_QR_APPEARANCE.darkColor,
      DEFAULT_QR_APPEARANCE.darkColor
    ),
    lightColor: normalizeHexColor(
      options.lightColor ?? DEFAULT_QR_APPEARANCE.lightColor,
      DEFAULT_QR_APPEARANCE.lightColor
    ),
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
    width: options.width ?? DEFAULT_WIDTH,
    margin: options.margin ?? DEFAULT_MARGIN,
  };
}

function isDarkModule(matrix: MatrixLike, row: number, col: number) {
  if (row < 0 || col < 0 || row >= matrix.size || col >= matrix.size) {
    return false;
  }

  return Boolean(matrix.get(row, col));
}

function isFinderCell(row: number, col: number, size: number) {
  const isTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const isTopRight = row < FINDER_SIZE && col >= size - FINDER_SIZE;
  const isBottomLeft = row >= size - FINDER_SIZE && col < FINDER_SIZE;

  return isTopLeft || isTopRight || isBottomLeft;
}

function getCellOffset(index: number, cellSize: number, margin: number) {
  return (index + margin) * cellSize;
}

function getModuleShapeRadii(
  matrix: MatrixLike,
  row: number,
  col: number,
  cellSize: number
): CornerRadii {
  const radius = cellSize * 0.42;
  const hasTop = isDarkModule(matrix, row - 1, col);
  const hasRight = isDarkModule(matrix, row, col + 1);
  const hasBottom = isDarkModule(matrix, row + 1, col);
  const hasLeft = isDarkModule(matrix, row, col - 1);

  return {
    tl: !hasTop && !hasLeft ? radius : 0,
    tr: !hasTop && !hasRight ? radius : 0,
    br: !hasBottom && !hasRight ? radius : 0,
    bl: !hasBottom && !hasLeft ? radius : 0,
  };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CornerRadii
) {
  const tl = Math.min(radii.tl, width / 2, height / 2);
  const tr = Math.min(radii.tr, width / 2, height / 2);
  const br = Math.min(radii.br, width / 2, height / 2);
  const bl = Math.min(radii.bl, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CornerRadii
) {
  const tl = Math.min(radii.tl, width / 2, height / 2);
  const tr = Math.min(radii.tr, width / 2, height / 2);
  const br = Math.min(radii.br, width / 2, height / 2);
  const bl = Math.min(radii.bl, width / 2, height / 2);

  return [
    `M ${formatNumber(x + tl)} ${formatNumber(y)}`,
    `L ${formatNumber(x + width - tr)} ${formatNumber(y)}`,
    `Q ${formatNumber(x + width)} ${formatNumber(y)} ${formatNumber(
      x + width
    )} ${formatNumber(y + tr)}`,
    `L ${formatNumber(x + width)} ${formatNumber(y + height - br)}`,
    `Q ${formatNumber(x + width)} ${formatNumber(y + height)} ${formatNumber(
      x + width - br
    )} ${formatNumber(y + height)}`,
    `L ${formatNumber(x + bl)} ${formatNumber(y + height)}`,
    `Q ${formatNumber(x)} ${formatNumber(y + height)} ${formatNumber(
      x
    )} ${formatNumber(y + height - bl)}`,
    `L ${formatNumber(x)} ${formatNumber(y + tl)}`,
    `Q ${formatNumber(x)} ${formatNumber(y)} ${formatNumber(x + tl)} ${formatNumber(
      y
    )}`,
    "Z",
  ].join(" ");
}

function drawDiamondPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const inset = size * 0.06;
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, y + inset);
  ctx.lineTo(x + size - inset, centerY);
  ctx.lineTo(centerX, y + size - inset);
  ctx.lineTo(x + inset, centerY);
  ctx.closePath();
}

function diamondPath(x: number, y: number, size: number) {
  const inset = size * 0.06;
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  return [
    `M ${formatNumber(centerX)} ${formatNumber(y + inset)}`,
    `L ${formatNumber(x + size - inset)} ${formatNumber(centerY)}`,
    `L ${formatNumber(centerX)} ${formatNumber(y + size - inset)}`,
    `L ${formatNumber(x + inset)} ${formatNumber(centerY)}`,
    "Z",
  ].join(" ");
}

function drawModuleToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: MatrixLike,
  row: number,
  col: number,
  cellSize: number,
  margin: number,
  moduleShape: QrModuleShape
) {
  const x = getCellOffset(col, cellSize, margin);
  const y = getCellOffset(row, cellSize, margin);

  switch (moduleShape) {
    case "square":
      ctx.fillRect(x, y, cellSize, cellSize);
      return;
    case "dots":
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.36, 0, Math.PI * 2);
      ctx.fill();
      return;
    case "rounded":
      drawRoundedRectPath(ctx, x, y, cellSize, cellSize, {
        tl: cellSize * 0.34,
        tr: cellSize * 0.34,
        br: cellSize * 0.34,
        bl: cellSize * 0.34,
      });
      ctx.fill();
      return;
    case "connected":
      drawRoundedRectPath(
        ctx,
        x,
        y,
        cellSize,
        cellSize,
        getModuleShapeRadii(matrix, row, col, cellSize)
      );
      ctx.fill();
      return;
    case "diamond":
      drawDiamondPath(ctx, x, y, cellSize);
      ctx.fill();
      return;
  }
}

function moduleToSvg(
  matrix: MatrixLike,
  row: number,
  col: number,
  cellSize: number,
  margin: number,
  fill: string,
  moduleShape: QrModuleShape
) {
  const x = getCellOffset(col, cellSize, margin);
  const y = getCellOffset(row, cellSize, margin);

  switch (moduleShape) {
    case "square":
      return `<rect x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(
        cellSize
      )}" height="${formatNumber(cellSize)}" fill="${fill}"/>`;
    case "dots":
      return `<circle cx="${formatNumber(x + cellSize / 2)}" cy="${formatNumber(
        y + cellSize / 2
      )}" r="${formatNumber(cellSize * 0.36)}" fill="${fill}"/>`;
    case "rounded":
      return `<rect x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(
        cellSize
      )}" height="${formatNumber(cellSize)}" rx="${formatNumber(
        cellSize * 0.34
      )}" fill="${fill}"/>`;
    case "connected":
      return `<path d="${roundedRectPath(
        x,
        y,
        cellSize,
        cellSize,
        getModuleShapeRadii(matrix, row, col, cellSize)
      )}" fill="${fill}"/>`;
    case "diamond":
      return `<path d="${diamondPath(x, y, cellSize)}" fill="${fill}"/>`;
  }
}

function drawFinderPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  moduleShape: QrModuleShape,
  darkColor: string,
  lightColor: string
) {
  const outerSize = cellSize * FINDER_SIZE;
  const middleInset = cellSize * FINDER_WHITE_RING_INSET;
  const middleSize = cellSize * (FINDER_SIZE - FINDER_WHITE_RING_INSET * 2);
  const innerInset = cellSize * FINDER_INNER_DOT_INSET;
  const innerSize = cellSize * (FINDER_SIZE - FINDER_INNER_DOT_INSET * 2);

  if (moduleShape === "dots") {
    const centerX = x + outerSize / 2;
    const centerY = y + outerSize / 2;
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, middleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (moduleShape === "diamond") {
    ctx.fillStyle = darkColor;
    drawDiamondPath(ctx, x, y, outerSize);
    ctx.fill();
    ctx.fillStyle = lightColor;
    drawDiamondPath(ctx, x + middleInset, y + middleInset, middleSize);
    ctx.fill();
    ctx.fillStyle = darkColor;
    drawDiamondPath(ctx, x + innerInset, y + innerInset, innerSize);
    ctx.fill();
    return;
  }

  const outerRadius = moduleShape === "square" ? 0 : cellSize * 1.45;
  const middleRadius = moduleShape === "square" ? 0 : cellSize;
  const innerRadius = moduleShape === "square" ? 0 : cellSize * 0.7;

  ctx.fillStyle = darkColor;
  drawRoundedRectPath(ctx, x, y, outerSize, outerSize, {
    tl: outerRadius,
    tr: outerRadius,
    br: outerRadius,
    bl: outerRadius,
  });
  ctx.fill();

  ctx.fillStyle = lightColor;
  drawRoundedRectPath(
    ctx,
    x + middleInset,
    y + middleInset,
    middleSize,
    middleSize,
    {
      tl: middleRadius,
      tr: middleRadius,
      br: middleRadius,
      bl: middleRadius,
    }
  );
  ctx.fill();

  ctx.fillStyle = darkColor;
  drawRoundedRectPath(ctx, x + innerInset, y + innerInset, innerSize, innerSize, {
    tl: innerRadius,
    tr: innerRadius,
    br: innerRadius,
    bl: innerRadius,
  });
  ctx.fill();
}

function finderPatternToSvg(
  x: number,
  y: number,
  cellSize: number,
  moduleShape: QrModuleShape,
  darkColor: string,
  lightColor: string
) {
  const outerSize = cellSize * FINDER_SIZE;
  const middleInset = cellSize * FINDER_WHITE_RING_INSET;
  const middleSize = cellSize * (FINDER_SIZE - FINDER_WHITE_RING_INSET * 2);
  const innerInset = cellSize * FINDER_INNER_DOT_INSET;
  const innerSize = cellSize * (FINDER_SIZE - FINDER_INNER_DOT_INSET * 2);

  if (moduleShape === "dots") {
    const centerX = x + outerSize / 2;
    const centerY = y + outerSize / 2;

    return [
      `<circle cx="${formatNumber(centerX)}" cy="${formatNumber(centerY)}" r="${formatNumber(
        outerSize / 2
      )}" fill="${darkColor}"/>`,
      `<circle cx="${formatNumber(centerX)}" cy="${formatNumber(centerY)}" r="${formatNumber(
        middleSize / 2
      )}" fill="${lightColor}"/>`,
      `<circle cx="${formatNumber(centerX)}" cy="${formatNumber(centerY)}" r="${formatNumber(
        innerSize / 2
      )}" fill="${darkColor}"/>`,
    ].join("");
  }

  if (moduleShape === "diamond") {
    return [
      `<path d="${diamondPath(x, y, outerSize)}" fill="${darkColor}"/>`,
      `<path d="${diamondPath(x + middleInset, y + middleInset, middleSize)}" fill="${lightColor}"/>`,
      `<path d="${diamondPath(x + innerInset, y + innerInset, innerSize)}" fill="${darkColor}"/>`,
    ].join("");
  }

  const outerRadius = moduleShape === "square" ? 0 : cellSize * 1.45;
  const middleRadius = moduleShape === "square" ? 0 : cellSize;
  const innerRadius = moduleShape === "square" ? 0 : cellSize * 0.7;

  return [
    `<rect x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(
      outerSize
    )}" height="${formatNumber(outerSize)}" rx="${formatNumber(outerRadius)}" fill="${darkColor}"/>`,
    `<rect x="${formatNumber(x + middleInset)}" y="${formatNumber(
      y + middleInset
    )}" width="${formatNumber(middleSize)}" height="${formatNumber(
      middleSize
    )}" rx="${formatNumber(middleRadius)}" fill="${lightColor}"/>`,
    `<rect x="${formatNumber(x + innerInset)}" y="${formatNumber(
      y + innerInset
    )}" width="${formatNumber(innerSize)}" height="${formatNumber(
      innerSize
    )}" rx="${formatNumber(innerRadius)}" fill="${darkColor}"/>`,
  ].join("");
}

function renderMatrixToCanvas(
  canvas: HTMLCanvasElement,
  matrix: MatrixLike,
  options: ResolvedQrRenderOptions
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is unavailable");
  }

  canvas.width = options.width;
  canvas.height = options.width;

  ctx.clearRect(0, 0, options.width, options.width);
  ctx.fillStyle = options.lightColor;
  ctx.fillRect(0, 0, options.width, options.width);

  const cellSize = options.width / (matrix.size + options.margin * 2);

  ctx.fillStyle = options.darkColor;
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!isDarkModule(matrix, row, col) || isFinderCell(row, col, matrix.size)) {
        continue;
      }

      drawModuleToCanvas(
        ctx,
        matrix,
        row,
        col,
        cellSize,
        options.margin,
        options.moduleShape
      );
    }
  }

  const finderOrigins = [
    [0, 0],
    [0, matrix.size - FINDER_SIZE],
    [matrix.size - FINDER_SIZE, 0],
  ] as const;

  for (const [row, col] of finderOrigins) {
    drawFinderPatternToCanvas(
      ctx,
      getCellOffset(col, cellSize, options.margin),
      getCellOffset(row, cellSize, options.margin),
      cellSize,
      options.moduleShape,
      options.darkColor,
      options.lightColor
    );
  }
}

function renderMatrixToSvg(
  matrix: MatrixLike,
  options: ResolvedQrRenderOptions
): string {
  const cellSize = options.width / (matrix.size + options.margin * 2);
  const parts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${options.width}" height="${options.width}" viewBox="0 0 ${options.width} ${options.width}">`,
    `<rect width="${options.width}" height="${options.width}" fill="${options.lightColor}"/>`,
  ];

  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!isDarkModule(matrix, row, col) || isFinderCell(row, col, matrix.size)) {
        continue;
      }

      parts.push(
        moduleToSvg(
          matrix,
          row,
          col,
          cellSize,
          options.margin,
          options.darkColor,
          options.moduleShape
        )
      );
    }
  }

  const finderOrigins = [
    [0, 0],
    [0, matrix.size - FINDER_SIZE],
    [matrix.size - FINDER_SIZE, 0],
  ] as const;

  for (const [row, col] of finderOrigins) {
    parts.push(
      finderPatternToSvg(
        getCellOffset(col, cellSize, options.margin),
        getCellOffset(row, cellSize, options.margin),
        cellSize,
        options.moduleShape,
        options.darkColor,
        options.lightColor
      )
    );
  }

  parts.push("</svg>");

  return parts.join("\n");
}

export function normalizeHexColor(value: string, fallback: string) {
  const normalized = value.trim().toUpperCase();
  const shortMatch = normalized.match(/^#([0-9A-F]{3})$/);

  if (shortMatch) {
    return `#${shortMatch[1]
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }

  return fallback.toUpperCase();
}

export async function generateQRToCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const resolvedOptions = resolveOptions(options);
  const matrix = await createMatrix(url, resolvedOptions.errorCorrectionLevel);
  renderMatrixToCanvas(canvas, matrix, resolvedOptions);
  return canvas.toDataURL("image/png");
}

export async function generateQRToSVG(
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const resolvedOptions = resolveOptions(options);
  const matrix = await createMatrix(url, resolvedOptions.errorCorrectionLevel);
  return renderMatrixToSvg(matrix, resolvedOptions);
}
