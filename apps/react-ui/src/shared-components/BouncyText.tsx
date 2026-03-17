import { useRef, useEffect } from "react";
import { type CSSPropertiesWithVars } from "@/types/customReactTypes";
import clsx from "clsx";
import styles from "./BouncyText.module.scss";

type BouncyTextParams = {
  text: string,
  loading: boolean,
  className?: string,
  length?: number
}

function resetAnimation(el: HTMLDivElement) {
  if (el.classList.contains(styles.animate)) {
    el.classList.remove(styles.animate);
    void el.offsetHeight;
  }
  el.classList.add(styles.animate);
}

const BouncyText = ({ text, loading = false, length = 1000, className}: BouncyTextParams) => {
  const animateRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const textWithNbsp = text.replace(/ /g, '\u00A0');

  useEffect(() => {
    if (!animateRef.current) return;

    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }

    if (loading) {
      resetAnimation(animateRef.current);

      timer.current = setInterval(() => {
        if (animateRef.current) resetAnimation(animateRef.current);
      }, textWithNbsp.length * 100 + length);
    }

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }

  }, [loading, textWithNbsp.length, length]);

  return (
    <div ref={animateRef} className={clsx(styles.bouncyText, className)} style={{ '--length': `${length}ms` } as CSSPropertiesWithVars}>
      {textWithNbsp.split('').map((char, i) =>
        <span style={{ '--i': i } as CSSPropertiesWithVars} key={i}>
          {char}
        </span>
      )}
    </div>
  )
}

export default BouncyText;