import { type JSX } from "react";
import styles from "./SummaryCard.module.css";
import clsx from "clsx";

type SummaryCardProps = {
  text: string;
  className?: string;
  src?: string;
  srcHeight?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function SummaryCard({
  text,
  className = "",
  src,
  srcHeight = 20,
  as: Tag = "div",
}: SummaryCardProps) {

  return (
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
  );
}