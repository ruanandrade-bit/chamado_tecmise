// ============================================
// 🧠 System Prompts para o ChatGPT
// ============================================

const { getPerfilEmpresaTexto } = require('./empresa');

/**
 * System prompt principal que define o comportamento da IA
 * como designer fixo da empresa
 */
function getSystemPrompt() {
  return `
Você é uma IA especialista em design gráfico, branding e marketing digital.
Você atua como designer FIXO de uma empresa específica e deve SEMPRE manter a identidade visual consistente.

${getPerfilEmpresaTexto()}

🎨 REGRAS DE DESIGN (OBRIGATÓRIO):
- Hierarquia visual clara
- Tipografia legível e profissional
- Cores 100% consistentes com a paleta da marca
- Espaçamento profissional entre elementos
- Foco em marketing e conversão
- Evitar aparência genérica de IA
- Formato Instagram: 1080x1080px

✍️ REGRAS DE TEXTO NA ARTE:
- Curto e impactante
- Fácil leitura
- Sem excesso de texto
- Coerente com o tom da marca

📐 COMPOSIÇÃO:
- Layout equilibrado
- Ponto focal claro
- Contraste adequado entre texto e fundo
- Elementos visuais que reforçam a mensagem
  `.trim();
}

/**
 * Gera o prompt para criar a descrição visual do design
 * que será enviada ao DALL-E
 */
function getDesignPrompt(ideia, tipo, mensagem, instrucoes, feedbackAcumulado, versaoAtual) {
  let prompt = `
Crie um prompt DETALHADO em inglês para gerar uma imagem de design gráfico profissional para Instagram (1080x1080px).

📌 BRIEFING DO POST:
- Ideia: ${ideia}
- Tipo: ${tipo || 'institucional'}
- Mensagem principal: ${mensagem || ideia}
${instrucoes ? `- Instruções extras: ${instrucoes}` : ''}
`;

  if (versaoAtual > 1 && feedbackAcumulado) {
    prompt += `
🔄 FEEDBACK ACUMULADO (versão ${versaoAtual}):
${feedbackAcumulado}

⚠️ IMPORTANTE: O design deve EVOLUIR com base no feedback, NÃO reiniciar do zero.
`;
  }

  prompt += `
📋 REQUISITOS DO PROMPT GERADO:
1. Descreva a composição visual completa (layout, posição dos elementos)
2. Especifique as cores EXATAS da paleta da marca
3. Descreva o estilo tipográfico (sem incluir texto específico, o DALL-E não faz texto bem)
4. Defina o mood/atmosfera da imagem
5. Inclua detalhes de iluminação e texturas
6. Mencione que é formato quadrado 1080x1080 para Instagram
7. PROÍBA qualquer texto renderizado na imagem - a arte deve ser puramente visual/gráfica
8. O estilo deve ser ${getPerfilEmpresaTexto().includes('estilo') ? 'consistente com a marca' : 'profissional e premium'}

Responda APENAS com o prompt em inglês. Nada mais.
`;

  return prompt.trim();
}

/**
 * Prompt para gerar o texto que acompanha a arte (caption/overlay)
 */
function getTextoArtePrompt(ideia, tipo, mensagem) {
  return `
Com base na identidade da marca, gere o TEXTO que deveria aparecer na arte do Instagram.

📌 BRIEFING:
- Ideia: ${ideia}
- Tipo: ${tipo || 'institucional'}
- Mensagem: ${mensagem || ideia}

Responda no formato:
📝 HEADLINE: (texto principal, máximo 6 palavras)
📝 SUBTÍTULO: (texto de apoio, máximo 10 palavras)
📝 CTA: (call-to-action, se aplicável)

Mantenha o tom ${require('./empresa').empresaConfig.tom} da marca.
Responda APENAS com o texto formatado. Nada mais.
  `.trim();
}

module.exports = { getSystemPrompt, getDesignPrompt, getTextoArtePrompt };
