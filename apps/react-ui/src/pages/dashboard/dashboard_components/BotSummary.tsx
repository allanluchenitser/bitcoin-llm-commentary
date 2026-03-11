// import maxHedronSrc from '@/assets/max_hedron.png';
import hFireSrc from '@/assets/h_fire.png';
import hInfoSrc from '@/assets/h_info.png';
import hSadSrc from '@/assets/h_sad.png';
import hUpSrc from '@/assets/h_up.png';
import clsx from 'clsx';

import { motion, AnimatePresence } from "framer-motion";
import { SummaryCard } from '@/shared-components/SummaryCard';

import { type LLMCommentary } from '@blc/contracts';
import { type CSSPropertiesWithVars } from '@/types/customReactTypes';

import styles from "./BotSummary.module.css";

function srcOrRandom(src: string | undefined = undefined) {
  return src ?? randomSrc();
}

function randomSrc() {
  const srcs = [hFireSrc, hInfoSrc, hSadSrc, hUpSrc];
  return srcs[Math.floor(Math.random() * srcs.length)];
}

type BotSummaryProps = {
  summaries: LLMCommentary[];
  loading?: boolean;
};

const BotSummary: React.FC<BotSummaryProps> = ({ summaries, loading = false }) => {
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
                      src={srcOrRandom(hInfoSrc)}
                      srcHeight={80}
                      className="text-sm/5 border-b border-gray-300"
                    />
                    <div className="text-sm text-gray-600 mb-1 italic text-right">
                      {new Date(summary.ts).toLocaleString()}
                    </div>
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