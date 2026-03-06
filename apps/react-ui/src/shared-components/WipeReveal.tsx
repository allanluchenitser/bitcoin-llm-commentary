import { type JSX } from "react";
import styles from "./WipeReveal.module.css";
import clsx from "clsx";

// console.log(styles);

type WipeRevealProps = {
  text: string;
  className?: string;
  src?: string;
  srcWidth?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function WipeReveal({
  text,
  className = "",
  src,
  srcWidth = 20,
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
          style={{ float: "right", marginLeft: 12, marginBottom: 2, width: srcWidth }}
          className={`inline-block w-[${srcWidth}px]`}
        />
      )}
      <span>{text}</span>
    </Tag>
  );
}