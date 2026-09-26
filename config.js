// =====================================================
// COLOQUE SUA OPENROUTER API KEY AQUI
// NÃO COMPARTILHE ESTA CHAVE PUBLICAMENTE
// Prefira sempre configurar via variável de ambiente OPENROUTER_API_KEY
// (Environment Variables no painel da Vercel).
// =====================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "COLOQUE_SUA_OPENROUTER_API_KEY_AQUI";

// Único lugar do projeto onde os modelos são definidos.
// É uma LISTA (não um único modelo): o OpenRouter tenta o primeiro da lista
// e, se ele não estiver disponível/gratuito naquele momento, tenta o
// próximo automaticamente. Isso evita quebrar quando um modelo gratuito
// específico sai do ar ou deixa de ser gratuito.
// IMPORTANTE: a OpenRouter aceita no máximo 3 modelos nessa lista.
// Pode sobrescrever via variável de ambiente OPENROUTER_MODELS,
// separando os nomes por vírgula (também no máximo 3).
const OPENROUTER_MODELS = (process.env.OPENROUTER_MODELS
  ? process.env.OPENROUTER_MODELS.split(",").map(s => s.trim()).filter(Boolean)
  : [
      "meta-llama/llama-3.3-70b-instruct:free",
      "qwen/qwen3-14b:free",
      "mistralai/mistral-7b-instruct:free"
    ]
).slice(0, 3);

module.exports = { OPENROUTER_API_KEY, OPENROUTER_MODELS };
