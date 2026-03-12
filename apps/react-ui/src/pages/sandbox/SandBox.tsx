import SummaryCard, { type SummaryCardProps } from "@/shared-components/SummaryCard";
import { generateLoremIpsum } from "@/plainUtils";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";

const TOTAL_CARDS = 5;

function generateCard() {
  return {
    id: uuidv4(),
    text: generateLoremIpsum(20),
    src: "https://placehold.co/80x80/png",
    srcHeight: 80,
  }
}

const SandBox: React.FC = () => {
  const [cards, setCards] = useState<SummaryCardProps[]>(() =>
    Array.from({ length: TOTAL_CARDS }, () => generateCard())
  );

  return (
    <div className="container flex p-4">
      <div className="w-1/2 flex flex-col">
        {
          cards.map((card) =>
            <div className="border rounded-lg p-4 mb-4" key={card.id}>
              <SummaryCard
                text={card.text}
                src={card.src}
                srcHeight={card.srcHeight}
                dateText={card.dateText}
              />
          </div>
          )
        }
      </div>
      <div className="w-1/2 p-4 flex flex-col">
        <button
          className="
            px-4
            py-2
            bg-blue-500
            text-white
            rounded
            mb-4
            justify-self-center
            cursor-pointer
            hover:bg-blue-600 active:bg-blue-700

          "
          onClick={() => {
            console.log("Adding card...");
            setCards(prev => [generateCard(), ...prev])
          }}
        >
          Add Card
        </button>
      </div>
    </div>
  );
}

export default SandBox;