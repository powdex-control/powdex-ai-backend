// =====================================================
// Alternativa ao deploy serverless da Vercel: um servidor Node/Express
// tradicional, para rodar em Render, Railway, um VPS, etc.
// Reaproveita a mesma lógica de backend/api/chat.js.
// Requer Node 18+ (usa fetch nativo).
// =====================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const chatHandler = require("./api/chat");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", chatHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`POWDEX AI backend rodando em http://localhost:${PORT}`);
});
