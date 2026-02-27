import maxHedronSrc from '@/assets/max_hedron.png';

type BotSummaryProps = {
  summaries: any[];
};

const BotSummary: React.FC<BotSummaryProps> = ({ summaries }) => {
  return (
    <div className="h-full p-4 border rounded">
      <img src={maxHedronSrc} alt="Max Hedron" className="mx-auto my-4" />
      <p className={"px-4 text-justify"}>
        {
          summaries.length > 0
            ? summaries[0].summary
            : "Max Hedron is analyzing the market and will provide insights here shortly..."
        }
      </p>
    </div>
    )
}

export default BotSummary