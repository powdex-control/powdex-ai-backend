// =====================================================
// Backend do POWDEX AI (usando OpenRouter).
// Único responsável por falar com a IA — a API key nunca
// chega ao navegador do usuário.
// =====================================================
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require("../config");

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "COLOQUE_SUA_OPENROUTER_API_KEY_AQUI"){
    return res.status(500).json({ error: "Backend sem OPENROUTER_API_KEY configurada." });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const trimmed = incoming
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!trimmed.length){
      return res.status(400).json({ error: "Nenhuma mensagem válida enviada." });
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "HTTP-Referer": "https://powdex-control.github.io",
        "X-Title": "POWDEX AI"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        temperature: 0.5,
        max_tokens: 700
      })
    });

    if (!orRes.ok){
      const errText = await orRes.text();
      console.error("Erro do OpenRouter:", orRes.status, errText);
      return res.status(502).json({ error: "Não foi possível conectar à IA no momento." });
    }

    const data = await orRes.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    return res.status(200).json({ reply });
  } catch (err){
    console.error("Erro no backend do POWDEX AI:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
