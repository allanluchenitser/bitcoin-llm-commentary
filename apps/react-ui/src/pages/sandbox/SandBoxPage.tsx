
import { TradCarousel } from "./CarouselVariants";

// import { type SummaryCardProps } from "@/shared-components/SummaryCard";
// import { generateLoremIpsum } from "@/plainUtils";
// import { v4 as uuidv4 } from "uuid";
// import { useState } from "react";

// const TOTAL_CARDS = 5;

// function generateCard() {
//   return {
//     id: uuidv4(),
//     text: generateLoremIpsum(20),
//     src: "https://placehold.co/80x80/png",
//     srcHeight: 80,
//   }
// }

const SandBoxPage = () => {
  return (
    <div className="container p-4">
      <TradCarousel className="h-44 text-center w-1/3">
        <div>How</div>
        <div>Do</div>
        <div>You</div>
        <div>Do</div>
        <div>Mr</div>
        <div>Kinkle</div>
      </TradCarousel>
    </div>
  );
}

export default SandBoxPage;