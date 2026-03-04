import { type JSX } from "react";
import styles from "./WipeReveal.module.css";
import clsx from "clsx";

console.log(styles);

type WipeRevealProps = {
  text: string;
  speedMsPerChar?: number;
  delayMs?: number;
  className?: string;
  src?: string;
  srcWidth?: number;
  as?: keyof JSX.IntrinsicElements;
};

type CSSVars = React.CSSProperties & {
    [derp: `--${string}`]: string | number
}

export function WipeReveal({
  text,
  speedMsPerChar = 30,   // smaller = faster
  delayMs = 0,
  className = "",
  src,
  srcWidth = 20,
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
      className={clsx(
        styles.wipeReveal,
        className
      )}
      style={styleVars}
      aria-label={text}
      title={text}
    >
      {src && (
        <img
          src={src}
          alt=""
          style={{ float: "left", marginRight: 12, marginBottom: 4, width: srcWidth }}
          className={`inline-block mr-2 mb-1 w-[${srcWidth}px]`}
        />
      )}
      {text}
    </Tag>
  );
}