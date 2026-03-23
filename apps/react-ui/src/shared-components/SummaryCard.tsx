import { type JSX } from "react";
import clsx from "clsx";
import { type LLMCommentary } from "@blc/contracts";

export type SummaryCardProps = {
  summary: LLMCommentary;
  className?: string;
  src: string | undefined;
  srcHeight?: number;
  as?: keyof JSX.IntrinsicElements;
};

export default function SummaryCard({
  summary: { commentary, ts },
  src,
  srcHeight = 40,

  className = "",
  as: Tag = "div",
}: SummaryCardProps) {

  return (
    <div>
      <Tag
        className={clsx(
          "font-mono overflow-auto relative pb-[2px]",
          className
        )}
        aria-label={commentary}
        title={commentary}
      >
        {src && (
          <img
            className="float-right mb-[1px] ml-2"
            style={{ height: srcHeight }}
            src={src}
            alt=""
          />
        )}
        <span>{commentary}</span>
      </Tag>
      <div className="text-sm text-gray-600 mb-4 italic text-right">
        {new Date(ts).toLocaleString()}
      </div>
    </div>
  );
}