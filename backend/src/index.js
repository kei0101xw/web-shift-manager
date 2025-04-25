const express = require("express");
const cors = require("cors"); // ★ これを追加！

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // ★ これを追加！

// あとは今まで通り
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
