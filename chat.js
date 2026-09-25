// =====================================================
// Backend do POWDEX AI.
// Único responsável por falar com a OpenAI — a API key nunca
// chega ao navegador do usuário.
// Funciona como função serverless (Vercel: /api/chat) e também
// é reaproveitado pelo server.js (Express), veja backend/server.js.
// =====================================================
const { OPENAI_API_KEY, OPENAI_MODEL } = require("../config");

const SYSTEM_PROMPT =
  "Você é o assistente inteligente do POWDEX CONTROL, um sistema desenvolvido para " +
  "auxiliar no acompanhamento e gerenciamento de processos relacionados à reutilização " +
  "e controle de pó de pintura eletrostática.\n\n" +
  "Seu objetivo é ajudar os usuários a entender dados, processos, funcionamento do " +
  "sistema, desperdício, reaproveitamento, eficiência, organização e possíveis melhorias.\n\n" +
  "Responda de forma clara, objetiva e útil. Quando não tiver informações suficientes, " +
  "deixe isso claro e não invente dados. Você pode conversar normalmente com o usuário " +
  "e manter o contexto da conversa atual.";

const MAX_HISTORY_MESSAGES = 16;

module.exports = async function chatHandler(req, res){
  // Ajuste "*" para o domínio do seu app em produção, se quiser restringir.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  if (!OPENAI_API_KEY || OPENAI_API_KEY === "COLOQUE_SUA_API_KEY_AQUI"){
    return res.status(500).json({ error: "Backend sem OPENAI_API_KEY configurada." });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    // Sanitiza e limita o histórico recebido do front-end.
    const trimmed = incoming
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!trimmed.length){
      return res.status(400).json({ error: "Nenhuma mensagem válida enviada." });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        temperature: 0.5,
        max_tokens: 700
      })
    });

    if (!openaiRes.ok){
      const errText = await openaiRes.text();
      console.error("Erro da OpenAI:", openaiRes.status, errText);
      return res.status(502).json({ error: "Não foi possível conectar à IA no momento." });
    }

    const data = await openaiRes.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    return res.status(200).json({ reply });
  } catch (err){
    console.error("Erro no backend do POWDEX AI:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
