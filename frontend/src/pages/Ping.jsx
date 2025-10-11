import { useEffect, useState } from "react";

export default function Ping() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("/api/healthz")
      .then((r) => {
        if (r.ok) setStatus("OK");
        else setStatus(`NG (${r.status})`);
      })
      .catch((e) => setStatus(`ERROR: ${e}`));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Backend Health</h2>
      <p>/api/healthz → {status}</p>
    </div>
  );
}
