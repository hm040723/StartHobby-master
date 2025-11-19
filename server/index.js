// server/index.js
const express = require("express");
const cors = require("cors");
const db = require("./db");

const quizRoutes = require("./routes/quizRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/quizzes", quizRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
