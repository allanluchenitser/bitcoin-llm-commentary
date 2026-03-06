import maxHedronSrc from '@/assets/max_hedron.png';
import { WipeReveal } from '@/shared-components/WipeReveal';

import { type LLMCommentary } from '@blc/contracts';


type BotSummaryProps = {
  summaries: LLMCommentary[];
  loading?: boolean;
};

const style = {
  fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
  fontWeight: 'bold',
  fontStyle: 'italic',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: '#222',
  lineHeight: '1',
  textShadow: '2px 2px 0 #fff, 4px 4px 0 #000',
  display: 'inline',
};

const BotSummary: React.FC<BotSummaryProps> = ({ summaries, loading = false }) => {
  return (
    <div className="px-4 pb-2">
      <p className="font-semibold mb-2 italic" >
        <span style={style} className="font-bold relative -top-[1px]">Doomberg</span>
        <span className="ml-2">SAYS...</span>
      </p>
      <div className="px-4 text-justify">
        {
          summaries.length > 0
            ?
            (
              <div>
                <div key={0} className="mb-4">
                {
                  loading
                    ? <div className="flex justify-center space-x-2 w-full">... <span className="animate-pulse">incoming...</span></div>
                    : <>
                      <WipeReveal
                          text={summaries[0].commentary}
                          src={maxHedronSrc}
                          srcWidth={100}
                          className="text-sm/5"
                        />
                      <div className="text-sm text-gray-600 mb-1 italic text-right">
                        {new Date(summaries[0].ts).toLocaleString()}
                      </div>
                    </>
                }
                </div>
              {
                summaries.slice(1).map((summary, index) => (
                  <div key={index + 1} className="mb-4">
                    <WipeReveal
                      text={summary.commentary}
                      src={maxHedronSrc}
                      srcWidth={100}
                      className="text-sm/5"
                    />
                    <div className="text-sm text-gray-600 mb-1 italic text-right">
                      {new Date(summary.ts).toLocaleString()}
                    </div>
                  </div>
                ))
              }
              </div>
            )
            : "Max Hedron is analyzing the market and will provide insights here shortly..."
        }
      </div>
    </div>
    )
}

export default BotSummary