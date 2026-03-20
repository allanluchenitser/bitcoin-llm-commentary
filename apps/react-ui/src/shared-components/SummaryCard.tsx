import { type JSX } from "react";
import clsx from "clsx";

export type SummaryCardProps = {
  id?: string;
  text: string;
  className?: string;
  src?: string;
  dateText?: string;
  srcHeight?: number;
  as?: keyof JSX.IntrinsicElements;
  volumeWord?: string;
  priceWord?: string;
};

export default function SummaryCard({
  text,
  className = "",
  src,
  dateText,
  srcHeight = 20,
  as: Tag = "div",
  volumeWord,
  priceWord,
}: SummaryCardProps) {

  return (
    <div>
      <Tag
        className={clsx(
          "font-mono overflow-auto relative pb-[2px]",
          className
        )}
        aria-label={text}
        title={text}
      >
        {src && (
          <img
            className="float-right mb-[1px] ml-2"
            style={{ height: srcHeight }}
            src={src}
            alt=""
          />
        )}
        <span>{text}</span>
      </Tag>
      <div className="text-sm text-gray-600 mb-4 italic text-right">
        {dateText}
      </div>
      <div className="text-sm text-gray-600 mb-4 italic text-right">
        {volumeWord && <span className="mr-2">{volumeWord}</span>}
        {priceWord && <span>{priceWord}</span>}
      </div>
    </div>
  );
}