import React, { useRef, useEffect } from 'react';
import SummaryCard from '@/shared-components/SummaryCard';
import { VerticalColumnFeeder } from '@/pages/sandbox/CarouselVariants';
import { type LLMCommentary } from '@blc/contracts';
import { type CSSPropertiesWithVars } from '@/types/customReactTypes';

import clsx from 'clsx';
import styles from "./BotSummary.module.scss";

import hFireSrc from '@/assets/h_fire.png';
import hInfoSrc from '@/assets/h_info.png';
import hSadSrc from '@/assets/h_sad.png';
import hUpSrc from '@/assets/h_up.png';

const summaryIcons = [hFireSrc, hInfoSrc, hSadSrc, hUpSrc];

function srcOrRandom(src: string | undefined = undefined) {
  return src ?? randomSrc();
}

function randomSrc() {
  return summaryIcons[Math.floor(Math.random() * summaryIcons.length)];
}

type BotSummaryProps = {
  summaries: LLMCommentary[];
  loading?: boolean;
};

const BotSummary = ({ summaries, loading = false }: BotSummaryProps) => {
  const srcMapRef = useRef<{ [ts: string]: string }>({});

  const animateRef = useRef<HTMLSpanElement | null>(null);
  const colorShuffleRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const animateEl = animateRef.current;
    const colorShuffleEl = colorShuffleRef.current;

    if (!animateEl || !colorShuffleEl) return;

    if (loading) {
      animateEl.classList.add(styles.ellipseAnimation);
      colorShuffleEl.classList.add(styles.colorShuffle);
    } else {
      animateEl.classList.remove(styles.ellipseAnimation);
      colorShuffleEl.classList.remove(styles.colorShuffle);
    }
  }, [loading]);

  // random image as placeholder
  summaries.forEach((summary) => {
    if (!srcMapRef.current[summary.ts]) {
      srcMapRef.current[summary.ts] = srcOrRandom();
    }
  });

  const newestTs = summaries[0]?.ts ?? null;
  const animatedText = "SAYS...";
  const colorCycleText = "DOOMBERG";

  return (
    <div className="px-4 pb-2">
      <p className="font-semibold mb-2 italic" >
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
        <span ref={animateRef} className={clsx(styles.waveBox, "ml-2")}>
          {animatedText.split('').map((char, i) =>
            <span key={i} style={{ '--i': i } as CSSPropertiesWithVars}>
              {char}
            </span>
          )}
        </span>
      </p>
      <div className="px-4 text-justify">
        {
          summaries.length > 0
            ?
            (
              <VerticalColumnFeeder animateToken={newestTs}>
                {summaries.map((summary) => (
                  <SummaryCard
                    key={summary.ts}
                    text={summary.commentary}
                    src={srcMapRef.current[summary.ts]}
                    srcHeight={55}
                    dateText={new Date(summary.ts).toLocaleString()}
                    className="text-sm/5 border-b border-gray-300"
                  />
                ))}
              </VerticalColumnFeeder>
            )
            : "Doomberg is analyzing the market and will provide insights here shortly..."
        }
      </div>
    </div>
    )
}

export default React.memo(BotSummary);