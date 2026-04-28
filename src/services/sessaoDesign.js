// ============================================
// 🔁 Gerenciador de Sessões de Design
// Sistema de loop com feedback iterativo
// ============================================

/**
 * Armazena sessões ativas por canal do Discord
 * Cada sessão mantém memória do processo criativo
 */
const sessoes = new Map();

/**
 * Cria ou retorna uma sessão de design
 */
function getSessao(channelId) {
  if (!sessoes.has(channelId)) {
    sessoes.set(channelId, {
      ativa: false,
      ideia: null,
      tipo: null,
      mensagem: null,
      instrucoes: null,
      versao: 0,
      feedbackAcumulado: '',
      referencias: [],
      analiseReferencias: '',
      ultimoPromptDalle: '',
      ultimaImagemUrl: '',
      textoArte: '',
      historicoChatGPT: [],
      criadaEm: null,
      atualizadaEm: null,
    });
  }
  return sessoes.get(channelId);
}

/**
 * Inicia uma nova sessão de design
 */
function iniciarSessao(channelId, { ideia, tipo, mensagem, instrucoes }) {
  const sessao = getSessao(channelId);
  sessao.ativa = true;
  sessao.ideia = ideia;
  sessao.tipo = tipo || 'institucional';
  sessao.mensagem = mensagem || ideia;
  sessao.instrucoes = instrucoes || '';
  sessao.versao = 0;
  sessao.feedbackAcumulado = '';
  sessao.historicoChatGPT = [];
  sessao.criadaEm = new Date();
  sessao.atualizadaEm = new Date();
  // Mantém referências entre sessões
  return sessao;
}

/**
 * Registra uma nova versão gerada
 */
function registrarVersao(channelId, { promptDalle, imagemUrl, textoArte }) {
  const sessao = getSessao(channelId);
  sessao.versao += 1;
  sessao.ultimoPromptDalle = promptDalle;
  sessao.ultimaImagemUrl = imagemUrl;
  sessao.textoArte = textoArte;
  sessao.atualizadaEm = new Date();
  return sessao;
}

/**
 * Adiciona feedback do usuário à sessão
 */
function adicionarFeedback(channelId, feedback) {
  const sessao = getSessao(channelId);
  sessao.feedbackAcumulado += `\n[v${sessao.versao}] ${feedback}`;
  sessao.atualizadaEm = new Date();
  return sessao;
}

/**
 * Adiciona uma referência visual à sessão
 */
function adicionarReferencia(channelId, { url, analise }) {
  const sessao = getSessao(channelId);
  sessao.referencias.push({ url, analise, adicionadaEm: new Date() });
  sessao.analiseReferencias += `\n--- Referência ${sessao.referencias.length} ---\n${analise}`;
  sessao.atualizadaEm = new Date();
  return sessao;
}

/**
 * Encerra a sessão (usuário aprovou)
 */
function encerrarSessao(channelId) {
  const sessao = getSessao(channelId);
  sessao.ativa = false;
  sessao.atualizadaEm = new Date();
  return sessao;
}

/**
 * Verifica se há sessão ativa
 */
function temSessaoAtiva(channelId) {
  return sessoes.has(channelId) && sessoes.get(channelId).ativa;
}

/**
 * Remove completamente uma sessão
 */
function deletarSessao(channelId) {
  sessoes.delete(channelId);
}

module.exports = {
  getSessao,
  iniciarSessao,
  registrarVersao,
  adicionarFeedback,
  adicionarReferencia,
  encerrarSessao,
  temSessaoAtiva,
  deletarSessao,
};
