// =====================================================
// COLOQUE SUA OPENAI API KEY AQUI
// NÃO COMPARTILHE ESTA CHAVE PUBLICAMENTE
// NÃO faça commit deste arquivo com a chave preenchida.
// Prefira sempre configurar via variável de ambiente OPENAI_API_KEY
// (arquivo .env local, ou "Environment Variables" no painel do
// Vercel/Render/Railway). O valor abaixo só é usado se a variável
// de ambiente não existir.
// =====================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "COLOQUE_SUA_API_KEY_AQUI";

// Único lugar do projeto onde o modelo é definido.
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

module.exports = { OPENAI_API_KEY, OPENAI_MODEL };
