import React, { useRef } from 'react';
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

const BotSummary: React.FC<BotSummaryProps> = ({ summaries, loading = false }) => {
  const srcMapRef = useRef<{ [ts: string]: string }>({});

  // Ensure each summary.ts gets a src only once
  summaries.forEach((summary) => {
    if (!srcMapRef.current[summary.ts]) {
      srcMapRef.current[summary.ts] = srcOrRandom();
    }
  });

  const newestTs = summaries[0]?.ts ?? null;

  return (
    <div className="px-4 pb-2">
      <p className="font-semibold mb-2 italic" >
        <span className={clsx(styles.doombergSmallLogo, "font-bold relative -top-1px")}>Doomberg</span>
        <span className={clsx("ml-2",
            styles.ellipseAnimation,
            loading && styles.active,
          )}
        >
          {'SAYS...'.split('').map((char, i) => {
            return <span key={i} style={{ '--i': i } as CSSPropertiesWithVars}>{char}</span>
          })}
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
            : "Max Hedron is analyzing the market and will provide insights here shortly..."
        }
      </div>
    </div>
    )
}

export default React.memo(BotSummary);