const RESET = "\x1b[0m";
const COLORS = {
  green: "\x1b[38;2;0;255;0m",
  cyan: "\x1b[38;2;0;255;255m",
  yellow: "\x1b[38;2;255;255;0m",
  red: "\x1b[1;38;2;255;96;96m",
} as const;

const useColor =
  typeof process !== "undefined" &&
  !!process.stdout?.isTTY &&
  process.env.NO_COLOR === undefined;

const c = (s: string, color: keyof typeof COLORS) =>
  useColor ? `${COLORS[color]}${s}${RESET}` : s;

export const color = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`${c("[i]", "cyan")} ${msg}`, ...args),

  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`${c("[!]", "yellow")} ${msg}`, ...args),

  error: (msg: string, ...args: unknown[]) =>
    console.error(`${c("[x]", "red")} ${msg}`, ...args),

  debug: (msg: string, ...args: unknown[]) =>
    console.log(`${c("[d]", "green")} ${msg}`, ...args),
};
