import { type JSX } from "react";
import styles from "./WipeReveal.module.css";
import clsx from "clsx";

type WipeRevealProps = {
  text: string;
  className?: string;
  src?: string;
  srcHeight?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function WipeReveal({
  text,
  className = "",
  src,
  srcHeight = 20,
  as: Tag = "div",
}: WipeRevealProps) {

  return (
    <Tag
      className={clsx(
        styles.wipeReveal,
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