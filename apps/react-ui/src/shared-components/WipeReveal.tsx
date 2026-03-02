import { type JSX } from "react";
import styles from "./WipeReveal.module.css";
import clsx from "clsx";

type WipeRevealProps = {
  text: string;
  speedMsPerChar?: number;
  delayMs?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

type CSSVars = React.CSSProperties & {
    [derp: `--${string}`]: string | number
}

export function WipeReveal({
  text,
  speedMsPerChar = 12,   // smaller = faster
  delayMs = 0,
  className = "",
  as: Tag = "div",
}: WipeRevealProps) {
  const chars = text?.length ?? 0;
  const durMs = Math.max(1, chars * speedMsPerChar);

  const styleVars: CSSVars = {
    "--chars": chars,
    "--dur": `${durMs}ms`,
    "--delay": `${delayMs}ms`,
  }

  return (
    <Tag
      className={clsx(styles.wipeReveal, className)}
      style={styleVars}
      aria-label={text}
      title={text}
    >
      {text}
    </Tag>
  );
}