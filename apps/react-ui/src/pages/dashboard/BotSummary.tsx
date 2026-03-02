import maxHedronSrc from '@/assets/max_hedron.png';
import { WipeReveal } from '@/shared-components/WipeReveal';

import { type LLMCommentary } from '@blc/contracts';


type BotSummaryProps = {
  summaries: LLMCommentary[];
};

const BotSummary: React.FC<BotSummaryProps> = ({ summaries }) => {
  return (
    <div className="h-full p-4 border rounded">
      <img src={maxHedronSrc} alt="Max Hedron" className="mx-auto mt-2 mb-4" />
      <div className={"px-4 text-justify"}>
        {
          summaries.length > 0
            ?
            (
              <div>
                <p className="font-semibold mb-2">Max Hedron's Market Commentary:</p>
                {
                  summaries.map((summary, index) => (
                    <div key={index} className="mb-4">
                      <p>
                        <WipeReveal text={summary.commentary} />
                      </p>
                      <div className="text-sm text-gray-600 mb-1 italic text-right">{new Date(summary.ts).toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            )
            : "Max Hedron is analyzing the market and will provide insights here shortly..."
        }
      </div>
    </div>
    )
}

export default BotSummary