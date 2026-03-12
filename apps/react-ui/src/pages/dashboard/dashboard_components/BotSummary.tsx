import React, { useRef } from 'react';
import SummaryCard from '@/shared-components/SummaryCard';

import { motion, AnimatePresence } from "framer-motion";
import { type LLMCommentary } from '@blc/contracts';
import { type CSSPropertiesWithVars } from '@/types/customReactTypes';

import clsx from 'clsx';
import styles from "./BotSummary.module.css";

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

  return (
    <div className="px-4 pb-2">
      <p className="font-semibold mb-2 italic" >
        <span className={clsx(styles.doombergSmallLogo, "font-bold relative -top-1px")}>Doomberg</span>
        <span className={
          clsx(
            styles.ellipseAnimation,
            loading && styles.active,
            "ml-2",
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
              <div>
              <AnimatePresence initial={false}>
                {summaries.map((summary) => (
                  <motion.div
                    key={summary.ts}
                    className="mb-4"
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    layout
                  >
                    <SummaryCard
                      text={summary.commentary}
                      src={srcMapRef.current[summary.ts]}
                      srcHeight={80}
                      dateText={new Date(summary.ts).toLocaleString()}
                      className="text-sm/5 border-b border-gray-300"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              </div>
            )
            : "Max Hedron is analyzing the market and will provide insights here shortly..."
        }
      </div>
    </div>
    )
}

export default BotSummary