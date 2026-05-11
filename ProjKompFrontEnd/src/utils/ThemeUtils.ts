export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "projkomp.theme";

export function normalizeTheme(value: string | null | undefined): ThemeMode {
  return value === "light" ? "light" : "dark";
}

export function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const safeHex = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
    return { r: 79, g: 113, b: 165 };
  }

  return {
    r: Number.parseInt(safeHex.slice(0, 2), 16),
    g: Number.parseInt(safeHex.slice(2, 4), 16),
    b: Number.parseInt(safeHex.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${clampChannel(r).toString(16).padStart(2, "0")}${clampChannel(g).toString(16).padStart(2, "0")}${clampChannel(b).toString(16).padStart(2, "0")}`;
}

export function getClassDisplayColor(color: string, theme: ThemeMode) {
  if (theme === "dark") {
    return color;
  }

  const { r, g, b } = hexToRgb(color);
  const mixWithWhite = 0.68;
  const nextR = r + (255 - r) * mixWithWhite;
  const nextG = g + (255 - g) * mixWithWhite;
  const nextB = b + (255 - b) * mixWithWhite;

  return rgbToHex(nextR, nextG, nextB);
}
