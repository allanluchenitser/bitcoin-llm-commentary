import { useEffect, useState } from "react";

export default function SandBox() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("side effect ran");
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div>count: {count}</div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer active:bg-blue-700"
        onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}