import { useEffect, useRef } from "react";

export function useRenderCommitCounter(name: string) {
  const renders = useRef(0);
  const commits = useRef(0);

  // Counts every render attempt
  renders.current += 1;
  console.log(name, "render", renders.current);

  // Counts commits
  useEffect(() => {
    commits.current += 1;
    console.log(name, "commit", commits.current, "after render", renders.current);
  });
}