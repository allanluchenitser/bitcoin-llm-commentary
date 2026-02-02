import { useEffect, useState } from "react";

export default function SandBox() {
  const [count, setCount] = useState(0);

  // runs once (mount), cleanup runs on unmount
  useEffect(() => {
    console.log("mount");
    return () => console.log("unmount");
  }, []);

  // runs after every render where `count` changed
  // cleanup runs BEFORE the next run (and on unmount)
  useEffect(() => {
    console.log("effect run: count =", count);
    return () => console.log("effect cleanup: previous count was", count);
  }, [count]);

  return (
    <div style={{ padding: 16 }}>
      <div>count: {count}</div>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <p style={{ color: "#6b7280" }}>Open DevTools console to see timing.</p>
    </div>
  );
}