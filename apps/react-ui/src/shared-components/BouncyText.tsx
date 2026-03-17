import { useRef, useEffect } from "react";
import { type CSSPropertiesWithVars } from "@/types/customReactTypes";
import clsx from "clsx";
import styles from "./BouncyText.module.scss";

type BouncyTextParams = {
  text: string,
  loading: boolean,
  className?: string,
}

const BouncyText = ({ text, loading = false, className}: BouncyTextParams) => {
  const animateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading) {
      animateRef.current?.classList.add(styles.animate);
    }
  }, [loading]);

  return (
    <div ref={animateRef} className={clsx(styles.bouncyText, className)}>
      {text.split('').map((char, i) =>
        <span
          style={{ '--i': i } as CSSPropertiesWithVars}
          key={i}
          data-last-span={i === text.length - 1 ? true : undefined}
          onAnimationIteration={
            i === text.length - 1
              ? () => {
                console.log('iterated, loading = ', loading);
                if (loading === false) {
                  animateRef.current?.classList.remove(styles.animate)
                }
              }
              : undefined
          }
        >
          {char}
        </span>
      )}
    </div>
  )
}

export default BouncyText