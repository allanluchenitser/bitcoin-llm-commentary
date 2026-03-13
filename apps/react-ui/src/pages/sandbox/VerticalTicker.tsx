import { type SummaryCardProps } from "@/shared-components/SummaryCard";
import { useEffect, useRef } from "react";


const VerticalTicker = ({ cards }: { cards: SummaryCardProps[] }) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
  }, [cards]);

  return (
    <div className="vertical-ticker">
      {cards.map((card) => (
        <div key={card.id} className="border rounded-lg p-4 mb-4">
          { JSON.stringify(card) }
        </div>
      ))}
    </div>
  )
}

export default VerticalTicker;




// export default VerticalTicker2;

