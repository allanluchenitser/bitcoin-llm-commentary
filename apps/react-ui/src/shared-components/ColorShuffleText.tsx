import styles from "./ColorShuffleText.module.scss";
import clsx from "clsx"
import { type CSSPropertiesWithVars } from "@/types/customReactTypes";

type ColorShuffleTextParams = {
  text: string;
  loading: boolean,
  className?: string,
}

export default function ColorShuffleText({ text, loading = false, className }: ColorShuffleTextParams) {
  return (
    <span
      className={
        clsx(className, styles.colorShuffleText, loading && styles.active)
      }
      style={
        { '--length': '2000ms' } as CSSPropertiesWithVars
      }
    >
      {text.split('').map((char, i) => {
        const h = Math.floor(Math.random() * 360);
        return (
          <span
            key={i}
            style={{ "--i": i, "--h": h } as CSSPropertiesWithVars}
          >
            {char}
          </span>
        );
      })}
    </span>
  )
}