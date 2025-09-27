const express = require("express");
const app = express();

const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));

// 動作確認用のJSON API
app.get("/api/time", (_req, res) => {
  res.json({ now: new Date().toISOString() });
});

app.get("/api/db/now", async (_req, res) => {
  const r = await pool.query("select now() as now");
  res.json(r.rows[0]);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
