import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT ?? 8080);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
