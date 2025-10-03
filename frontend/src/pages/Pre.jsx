import { useEffect, useState } from "react";

export default function Pre() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/time") // ← 相対パスでOK（Vite proxyがbackendへ）
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Pre Start</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
