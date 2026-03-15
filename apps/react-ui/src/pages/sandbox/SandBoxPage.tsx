// Getting solid on ReactJS. Building classic, non-trivial components by hand.

import SummaryCard from "@/shared-components/SummaryCard";
import SimpleComponent from "./SimpleComponent";

import { useState } from "react";
import { TradCarousel, VerticalColumnFeeder } from "./CarouselVariants";
import { generateLoremIpsum } from "@/plainUtils";

import clsx from 'clsx';
import s from './SandboxPage.module.scss';

const SandBoxPage = () => {
  const [verticals, setVerticals] = useState<React.ReactNode[]>(() =>
    ['Top', 'Of', 'The', 'Morning', 'Mr.', 'Parker']
    .map((word) => (
      <SummaryCard
        key={crypto.randomUUID()}
        className="p-4 border rounded-lg mb-4"
        text={word}
      />
    ))
  );

  const genChild = (name: string) => {
    return (prev: React.ReactNode[]): React.ReactNode[] => {
      const random =  Math.floor(Math.random() * 1000);
      const key = name + '-' + random;
      return [
        <SummaryCard
          className="p-4 border rounded-lg mb-4"
          key={crypto.randomUUID()}
          text={generateLoremIpsum(40)}
          src={`https://robohash.org/${key}?set=set4`}
          srcHeight={40}
        />,
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
      <SimpleComponent>
        <div>I am a child</div>
        <div>I am another child</div>
      </SimpleComponent>
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