// =====================================================
// COLOQUE SUA OPENROUTER API KEY AQUI
// NÃO COMPARTILHE ESTA CHAVE PUBLICAMENTE
// Prefira sempre configurar via variável de ambiente OPENROUTER_API_KEY
// (Environment Variables no painel da Vercel).
// =====================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "COLOQUE_SUA_OPENROUTER_API_KEY_AQUI";

// Único lugar do projeto onde o modelo é definido.
// "openrouter/free" é o roteador automático de modelos gratuitos da
// OpenRouter: ele sempre sabe quais modelos estão gratuitos NESTE
// momento (a lista muda com muita frequência), então evita o problema
// de fixar um nome específico que pode parar de ser gratuito de um
// dia pro outro. O backend (api/chat.js) tenta de novo automaticamente
// se o sorteio cair num modelo que não sirva (ex.: um classificador de
// moderação em vez de um modelo de conversa).
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

module.exports = { OPENROUTER_API_KEY, OPENROUTER_MODEL };
