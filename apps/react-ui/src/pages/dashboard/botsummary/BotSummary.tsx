import React, { useRef } from 'react';
import SummaryCard from '@/shared-components/SummaryCard';

import BouncyText from '@/shared-components/BouncyText';
import ColorShuffleText from '@/shared-components/ColorShuffleText';

import { VerticalColumnFeeder } from '@/pages/sandbox/CarouselVariants';
import { type LLMCommentary } from '@blc/contracts';

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

  // random image as placeholder
  summaries.forEach((summary) => {
    if (!srcMapRef.current[summary.ts]) {
      srcMapRef.current[summary.ts] = srcOrRandom();
    }
  });

  const newestTs = summaries[0]?.ts ?? null;

  return (
    <div className="px-4 pb-2">
      <div className="flex gap-2 justify-center items-center font-semibold mb-2 italic mb-2" >
        <ColorShuffleText
          className={styles.doombergSmallLogo}
          loading={loading}
          text="DOOMBERG"
        />
        <BouncyText
          loading={loading}
          length={500}
          text="SAYS..."
        />
      </div>
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
                    className={clsx(
                      "text-sm/5 border-b border-gray-300",
                      summary.summaryType === "spike" && "bg-red-50",
                    )}
                    volumeWord={summary.volumeWord}
                    priceWord={summary.priceWord}
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