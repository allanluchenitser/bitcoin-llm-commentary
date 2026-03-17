// Getting solid on ReactJS. Building classic, non-trivial components by hand.

import SummaryCard from "@/shared-components/SummaryCard";
import SimpleComponent from "./TestComponent";
import BouncyText from "@/shared-components/BouncyText";

import { useState } from "react";
import { TradCarousel, VerticalColumnFeeder } from "./CarouselVariants";
import { generateLoremIpsum } from "@/plainUtils";

import clsx from 'clsx';
import s from './SandboxPage.module.scss';

const addVertical = () => ({
    key: crypto.randomUUID(),
    text: generateLoremIpsum(40)
})

const SandBoxPage = () => {
  const [verticals, setVerticals] = useState(() =>
    Array.from({ length: 6 }).map(addVertical)
  );

  const [loading, setLoading] = useState(false);

  const token = verticals[0]?.key ?? null;

  return (
    <div className={clsx(s.sandBoxPage, 'container flex p-4')}>
      {/* <div className="flex-1 flex justify-center">
        <TradCarousel className="h-44 text-center w-1/3">
          <div>From</div>
          <div>Side</div>
          <div>To</div>
          <div>Side</div>
          <div>We</div>
          <div>Go</div>
        </TradCarousel>
      </div> */}
      <div className="flex-1 flex justify-center">
        <VerticalColumnFeeder animateToken={token} className="w-[80%]">
          {verticals.map((v) =>
            <SummaryCard
              className="p-4 border rounded-lg mb-4"
              key={v.key}
              text={v.text}
              src={`https://robohash.org/${v.key}?set=set4`}
              srcHeight={40}
            />
          )}
        </VerticalColumnFeeder>
      </div>
      {/* <div className="flex-1">
        <SimpleComponent>
          <div>I am a child</div>
          <div>I am another child</div>
        </SimpleComponent>
     </div> */}
     <div className="flex-1">
        <BouncyText text="Loading... Cool?" loading={loading} className="text-2xl" />
     </div>
     <div className={clsx(s.controls, 'flex flex-col')}>
      <button onClick={() => setVerticals(prev => [addVertical(), ...prev])}>
        Add Card
      </button>
      <button onClick={() => setLoading(prev => !prev)}>
        { loading ? "Loading" : "Still" }
      </button>
     </div>
    </div>
  );
}

export default SandBoxPage;