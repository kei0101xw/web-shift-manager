const express = require("express");
const app = express();

app.use(express.json());

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));

// 動作確認用のJSON API
app.get("/api/time", (_req, res) => {
  res.json({ now: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
