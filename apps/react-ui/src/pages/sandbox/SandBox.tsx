import { useEffect, useState } from "react";

export default function SandBox() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchRandomNumber() {
      const json = await fetch("/api/v1.0/randomnumber?min=1&max=100&count=1");
      const data = await json.json();
      setCount(data[0]);
    }
    fetchRandomNumber();
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