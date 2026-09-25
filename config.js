// =====================================================
// COLOQUE SUA OPENROUTER API KEY AQUI
// NÃO COMPARTILHE ESTA CHAVE PUBLICAMENTE
// Prefira sempre configurar via variável de ambiente OPENROUTER_API_KEY
// (Environment Variables no painel da Vercel).
// =====================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "COLOQUE_SUA_OPENROUTER_API_KEY_AQUI";

// Único lugar do projeto onde o modelo é definido.
// "openrouter/free" escolhe automaticamente um modelo gratuito disponível.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

module.exports = { OPENROUTER_API_KEY, OPENROUTER_MODEL };
