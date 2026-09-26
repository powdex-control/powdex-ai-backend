// =====================================================
// Backend do POWDEX AI (usando OpenRouter).
// Único responsável por falar com a IA — a API key nunca
// chega ao navegador do usuário.
// =====================================================
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require("../config");

// Descrição completa e real do funcionamento do POWDEX CONTROL.
// Isso é o que permite a IA responder "como o app funciona" com precisão,
// em vez de só falar sobre o propósito geral do sistema.
const SYSTEM_PROMPT =
`Você é o assistente inteligente do POWDEX CONTROL, um sistema de controle de recuperação de pó de pintura eletrostática. Você conhece profundamente como o aplicativo funciona, por dentro, e também pode ver os dados reais da cabine que a pessoa está usando (enviados a cada pergunta em "Dados atuais do sistema"). Use SEMPRE esses dados reais quando a pergunta envolver números, status ou histórico — nunca invente valores.

COMO O APLICATIVO FUNCIONA (estrutura real):

1. LOGIN DE CABINE
   Ao abrir o sistema, o usuário escolhe uma cabine (ex.: CAB-001) e digita a senha específica daquela cabine para entrar. Cada cabine tem seus próprios dados, senha e histórico.

2. TELA "VISÃO GERAL" (tela principal após o login)
   Mostra 4 indicadores no topo: pó recuperado (kg acumulado), lotes registrados, economia estimada (kg × preço/kg) e o preço do pó configurado.
   Tem o bloco "Status da operação": mostra se a cabine está Livre, Em operação, Pausada ou em Manutenção, quem é o operador do turno, e desde quando está nesse status. Tem botões para Iniciar operação, Pausar, Retomar e Encerrar operação.
   Tem o formulário "Registrar recuperação": o usuário escolhe uma gaveta (Gaveta 01, 02 ou 03) e informa o peso recuperado em kg; ao confirmar, o sistema cria um novo "lote" no histórico daquela gaveta e calcula automaticamente a economia (peso × preço do kg).
   Mostra uma tabela com os últimos registros e um atalho para o histórico completo.
   Tem o botão "Zerar dados", que reinicia os dados daquela cabine, e "Trocar cabine", que desloga e volta para a tela de login.

3. TELA "HISTÓRICO DE LOTES"
   Lista completa de todos os lotes registrados na cabine (data/hora, número do lote, cabine, gaveta, peso, preço/kg no momento e economia gerada), com totais (kg total, número de lotes, média por lote, valor total) e exportação em CSV.

4. TELA "ECONOMIA / RELATÓRIO"
   Mostra relatório de economia total, detalhado por gaveta e um exemplo de cálculo (peso × preço = economia), com exportação em CSV.

5. TELA "CONFIGURAÇÕES"
   Permite ajustar o preço do pó por kg (usado em todos os cálculos de economia) e a meta diária de produção (kg) daquela cabine. O número da cabine é fixo e não pode ser editado por aqui.

6. TELA "GERENCIAMENTO GERAL" (acesso restrito por senha de gerente, separada da senha da cabine)
   Só aparece depois de um login extra de gerente. Mostra: número total de cabines, total de operadores e economia total do sistema (somando todas as cabines); abertura de turno (operador + turno de trabalho); histórico de turnos de todas as cabines; rastreabilidade de todos os lotes de todas as cabines; ranking de operadores por lotes, kg recuperado e economia gerada; exportação de relatório geral em CSV.

7. SINCRONIZAÇÃO
   Os dados são salvos e sincronizados em tempo real via Firebase, então várias telas/dispositivos vendo a mesma cabine ficam atualizados automaticamente ("Sistema conectado" aparece no topo quando está tudo certo).

8. ALERTAS
   O sistema avisa, por exemplo, quando uma cabine fica em operação contínua por mais de 4 horas sem pausa.

COMO RESPONDER:
- Se a pergunta for sobre "como funciona" alguma parte do app, explique com base na estrutura real acima.
- Se a pergunta for sobre números, produção, desperdício, economia, lotes ou status, use os dados em "Dados atuais do sistema" (enviados junto com a pergunta). Se a pergunta pedir algo que não está nesses dados (ex.: dados de outra cabine, quando a pessoa não está logada como gerente), diga claramente que não tem acesso a essa informação a partir daqui, em vez de inventar.
- Seja claro, direto e útil. Pode usar listas e negrito quando ajudar a organizar a resposta.
- Mantenha o contexto da conversa atual.`;

const MAX_HISTORY_MESSAGES = 16;
const MAX_CONTEXT_CHARS = 4000;

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

    // Dados reais da cabine (enviados pelo front-end em ai/ai-chat.js).
    const context = typeof body.context === "string" ? body.context.slice(0, MAX_CONTEXT_CHARS) : "";
    const fullSystemPrompt = context
      ? SYSTEM_PROMPT + "\n\n--- Dados atuais do sistema (use estes dados reais; não invente números) ---\n" + context
      : SYSTEM_PROMPT;

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
        messages: [{ role: "system", content: fullSystemPrompt }, ...trimmed],
        temperature: 0.4,
        max_tokens: 900,
        reasoning: { exclude: true }
      })
    });

    if (!orRes.ok){
      const errText = await orRes.text();
      console.error("Erro do OpenRouter:", orRes.status, errText);
      return res.status(502).json({ error: "Não foi possível conectar à IA no momento." });
    }

    const data = await orRes.json();
    let reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    // Proteção extra: alguns modelos gratuitos de "raciocínio" às vezes vazam o
    // pensamento interno mesmo pedindo para excluir — remove blocos comuns desse tipo.
    if (reply){
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      reply = reply.replace(/^(analysis|reasoning|thinking)[:\s][\s\S]*?\n\n/i, "").trim();
    }

    return res.status(200).json({ reply });
  } catch (err){
    console.error("Erro no backend do POWDEX AI:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
