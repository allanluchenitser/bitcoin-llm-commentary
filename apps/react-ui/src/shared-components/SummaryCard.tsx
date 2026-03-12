import { type JSX } from "react";
import styles from "./SummaryCard.module.css";
import clsx from "clsx";

export type SummaryCardProps = {
  id?: string;
  text: string;
  className?: string;
  src?: string;
  dateText?: string;
  srcHeight?: number;
  as?: keyof JSX.IntrinsicElements;
};

export default function SummaryCard({
  text,
  className = "",
  src,
  dateText,
  srcHeight = 20,
  as: Tag = "div",
}: SummaryCardProps) {

  return (
    <div>
      <Tag
        className={clsx(
          styles.summaryCard,
          className
        )}
        aria-label={text}
        title={text}
      >
        {src && (
          <img
            src={src}
            alt=""
            style={{ float: "right", marginLeft: 12, marginBottom: 2, width: srcHeight }}
            className={`inline-block w-[${srcHeight}px]`}
          />
        )}
        <span>{text}</span>
      </Tag>
      <div className="text-sm text-gray-600 mb-1 italic text-right">
        {dateText}
      </div>
    </div>
  );
}