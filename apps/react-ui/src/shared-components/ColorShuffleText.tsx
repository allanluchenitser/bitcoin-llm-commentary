import { useRef }
import { type CSSPropertiesWithVars } from "@/types/customReactTypes";

const function ColorShuffleText({ text }) {
  const colorShuffleRef = useRef<HTMLSpanElement | null>(null);

  return (
    <span ref={colorShuffleRef} className={clsx(styles.doombergSmallLogo, "font-bold relative -top-1px")}>
    {colorCycleText.split('').map((char, i) => {
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