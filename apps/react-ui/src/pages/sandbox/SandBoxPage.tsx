// Getting solid on ReactJS. Building classic, non-trivial components by hand.

import { useState } from "react";
import { TradCarousel, VerticalColumnFeeder } from "./CarouselVariants";

import clsx from 'clsx';
import s from './SandboxPage.module.scss';

const SandBoxPage = () => {
  const [verticals, setVerticals] = useState<React.ReactNode[]>(() =>
    ['Top', 'Of', 'The', 'Morning', 'Mr.', 'Parker']
    .map((word) => (
      <div className={s.verticalChild} key={word}>{word}</div>
    ))
  );

  const genChild = (name: string) => {
    return (prev: React.ReactNode[]): React.ReactNode[] => {
      const random =  Math.floor(Math.random() * 1000);
      const key = name + '-' + random;
      return [
        <div className={s.verticalChild} key={key}>{key}</div>,
        ...prev
      ];
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
        className={s.addVerticalButton}
        onClick={() => setVerticals(genChild('freddy'))}
      >
        Add
      </button>
    </div>
  );
}

export default SandBoxPage;