import maxHedronSrc from './max_hedron.png';

const BotSummary: React.FC = () => {
  return (
    <div className="h-full p-4 border rounded">
      <img src={maxHedronSrc} alt="Max Hedron" className="mx-auto my-4" />
      <p className={"px-4 text-justify"}>
        In the last two hours, Bitcoin drifted lower on light volume, slipping from around $64,200 to $63,700 as a few large sell orders pushed through thin order books. After briefly undercutting a nearby support level, buyers stepped in and the price snapped back quickly, reclaiming $63,900 within minutes. Momentum then flipped: a short squeeze carried BTC up toward $64,500, where profit-taking capped the move and price chopped sideways. By the end of the window, it settled near $64,150, with volatility cooling but liquidity still uneven.
      </p>
    </div>
    )
}

export default BotSummary