
import { useState } from "react";
import { TradCarousel, VerticalColumnFeeder } from "./CarouselVariants";

import clsx from 'clsx';
import s from './SandboxPage.module.scss';
// import { type SummaryCardProps } from "@/shared-components/SummaryCard";
// import { generateLoremIpsum } from "@/plainUtils";
// import { v4 as uuidv4 } from "uuid";

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
  const [verticals, setVerticals] = useState<React.ReactNode[]>([
    <div className={s.verticalChild} key="Top">Top</div>,
    <div className={s.verticalChild} key="Of">Of</div>,
    <div className={s.verticalChild} key="The">The</div>,
    <div className={s.verticalChild} key="Morning">Morning</div>,
    <div className={s.verticalChild} key="Mr.">Mr.</div>,
    <div className={s.verticalChild} key="Parker">Parker</div>,
  ]);

  const genChild = (name: string) => {
    return (prev: React.ReactNode[]): React.ReactNode[] => {
      const random =  Math.floor(Math.random() * 1000)
      const key = name + '-' + random;
      return [<div className={s.verticalChild} key={key}>{key}</div>, ...prev];
    }
  }

  return (
    <div className={clsx(s.sandBoxPage, 'container flex p-4')}>
      <div className="flex-1 flex justify-center">
        <TradCarousel className="h-44 text-center w-1/3">
          <div>From</div>
          <div>Side</div>
          <div>To</div>
          <div>Side</div>
          <div>We</div>
          <div>Go</div>
        </TradCarousel>
      </div>
      <div className="flex-1 flex justify-center">
        <VerticalColumnFeeder className="w-[80%]">
          {verticals}
        </VerticalColumnFeeder>
      </div>
      <button
        className="absolute top-5 right-5 cursor-pointer px-4 py-2 border rounded"
        onClick={() => setVerticals(genChild('freddy'))}
      >
        Add
      </button>
    </div>
  );
}

export default SandBoxPage;