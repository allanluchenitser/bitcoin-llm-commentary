import maxHedronSrc from '@/assets/max_hedron.png';

import { type LLMCommentary } from '@blc/contracts';


type BotSummaryProps = {
  summaries: LLMCommentary[];
};

const BotSummary: React.FC<BotSummaryProps> = ({ summaries }) => {
  return (
    <div className="h-full p-4 border rounded">
      <img src={maxHedronSrc} alt="Max Hedron" className="mx-auto my-4" />
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
                      <p className="text-sm text-gray-600 mb-1">{new Date(summary.ts).toLocaleString()}</p>
                      <p>{summary.commentary}</p>
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