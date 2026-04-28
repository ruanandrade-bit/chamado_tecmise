// ============================================
// ✅ Handler: /aprovar - Finalizar Design
// 🔁 Handler: /refazer - Nova Variação
// 🖼️ Handler: /referencia - Referência Visual
// 📊 Handler: /status - Ver Sessão
// 🛑 Handler: /cancelar - Cancelar Sessão
// 🏢 Handler: /perfil - Ver Perfil
// ❓ Handler: /ajuda - Comandos
// ============================================

const { EmbedBuilder } = require('discord.js');
const { chatCompletion, gerarImagem, analisarReferencia } = require('../services/openai');
const { getSystemPrompt, getDesignPrompt } = require('../config/prompts');
const {
  getSessao,
  registrarVersao,
  encerrarSessao,
  temSessaoAtiva,
  deletarSessao,
  adicionarReferencia,
} = require('../services/sessaoDesign');
const { empresaConfig, getPerfilEmpresaTexto } = require('../config/empresa');
const { analisarReferenciasLocais, resumoReferencias } = require('../services/referenciasLocais');

// ✅ APROVAR
async function handleAprovar(interaction) {
  if (!temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '⚠️ Não há sessão ativa para aprovar.',
      ephemeral: true,
    });
  }

  const sessao = getSessao(interaction.channelId);
  encerrarSessao(interaction.channelId);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('✅ Design Aprovado!')
    .setDescription(`**${sessao.ideia}** foi aprovado na versão **${sessao.versao}**`)
    .addFields(
      { name: '🔢 Total de versões', value: `${sessao.versao}`, inline: true },
      { name: '📅 Criado em', value: sessao.criadaEm.toLocaleString('pt-BR'), inline: true },
      { name: '✍️ Texto Final', value: sessao.textoArte.substring(0, 1024) }
    )
    .setImage(sessao.ultimaImagemUrl)
    .setFooter({ text: `Design final aprovado — ${empresaConfig.nome}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  // Limpar sessão
  deletarSessao(interaction.channelId);
}

// 🔁 REFAZER (sem feedback, nova variação criativa)
async function handleRefazer(interaction) {
  if (!temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '⚠️ Não há sessão ativa. Use `/criar` para começar.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    const sessao = getSessao(interaction.channelId);

    let referenciaExtra = '';
    if (sessao.analiseReferencias) {
      referenciaExtra = `\n\n🖼️ REFERÊNCIAS:\n${sessao.analiseReferencias}`;
    }

    // Referências locais da pasta /referencias
    const resultadoLocal = await analisarReferenciasLocais(analisarReferencia);
    if (resultadoLocal.analiseCompleta) {
      referenciaExtra += `\n\n🖼️ REFERÊNCIAS LOCAIS:\n${resultadoLocal.analiseCompleta}`;
    }

    const variacaoPrompt = `
Crie uma VARIAÇÃO CRIATIVA COMPLETAMENTE DIFERENTE do design anterior.
Mude a composição, layout e abordagem visual, mas mantendo:
- A mesma identidade da marca
- As mesmas cores
- O mesmo briefing

Briefing original: ${sessao.ideia}
Tipo: ${sessao.tipo}
Mensagem: ${sessao.mensagem}

Prompt anterior (NÃO repita): ${sessao.ultimoPromptDalle}

Crie um prompt novo e criativo em inglês para DALL-E. Responda APENAS com o prompt.
    `;

    const systemPrompt = getSystemPrompt() + referenciaExtra;
    const dallePrompt = await chatCompletion(systemPrompt, variacaoPrompt);

    const { url: imagemUrl } = await gerarImagem(dallePrompt);

    registrarVersao(interaction.channelId, {
      promptDalle: dallePrompt,
      imagemUrl,
      textoArte: sessao.textoArte,
    });

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`🔁 Nova Variação v${sessao.versao} — ${empresaConfig.nome}`)
      .setDescription(`**🎯 Ideia:** ${sessao.ideia}`)
      .addFields(
        { name: '🧠 O que foi feito', value: 'Nova variação criativa gerada com layout e composição diferentes, mantendo a identidade da marca.' },
        { name: '🔢 Versão', value: `${sessao.versao}`, inline: true }
      )
      .setImage(imagemUrl)
      .setFooter({ text: '💬 /feedback | ✅ /aprovar | 🔁 /refazer' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erro no /refazer:', error);
    await interaction.editReply({ content: `❌ Erro: ${error.message}` });
  }
}

// 🖼️ REFERÊNCIA VISUAL
async function handleReferencia(interaction) {
  const attachment = interaction.options.getAttachment('imagem');

  if (!attachment.contentType?.startsWith('image/')) {
    return interaction.reply({
      content: '⚠️ Por favor, envie apenas imagens (PNG, JPG, WEBP).',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    // Analisar imagem com GPT-4o Vision
    const analise = await analisarReferencia(attachment.url);

    // Adicionar à sessão
    adicionarReferencia(interaction.channelId, {
      url: attachment.url,
      analise,
    });

    const sessao = getSessao(interaction.channelId);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🖼️ Referência Analisada')
      .setDescription('A referência visual foi analisada e será considerada nas próximas gerações.')
      .addFields(
        { name: '📊 Total de referências', value: `${sessao.referencias.length}`, inline: true },
        { name: '🔍 Análise', value: analise.substring(0, 1024) }
      )
      .setThumbnail(attachment.url)
      .setFooter({ text: 'Esta referência será usada em todas as gerações desta sessão.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erro no /referencia:', error);
    await interaction.editReply({ content: `❌ Erro ao analisar referência: ${error.message}` });
  }
}

// 📊 STATUS
async function handleStatus(interaction) {
  if (!temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '📊 Nenhuma sessão ativa. Use `/criar` para começar.',
      ephemeral: true,
    });
  }

  const sessao = getSessao(interaction.channelId);

  const refLocal = resumoReferencias();

  const embed = new EmbedBuilder()
    .setColor(0x2c3e50)
    .setTitle('📊 Sessão de Design Ativa')
    .addFields(
      { name: '🎯 Ideia', value: sessao.ideia, inline: false },
      { name: '📌 Tipo', value: sessao.tipo, inline: true },
      { name: '🔢 Versão Atual', value: `${sessao.versao}`, inline: true },
      { name: '🖼️ Ref. Discord', value: `${sessao.referencias.length}`, inline: true },
      { name: '📂 Ref. Locais', value: `${refLocal.total} (${refLocal.analisadas} analisadas)`, inline: true },
      { name: '📅 Iniciada em', value: sessao.criadaEm.toLocaleString('pt-BR'), inline: true },
      { name: '🔄 Atualizada em', value: sessao.atualizadaEm.toLocaleString('pt-BR'), inline: true },
    );

  if (sessao.feedbackAcumulado) {
    embed.addFields({ name: '💬 Feedbacks', value: sessao.feedbackAcumulado.substring(0, 1024) });
  }

  if (sessao.ultimaImagemUrl) {
    embed.setThumbnail(sessao.ultimaImagemUrl);
  }

  await interaction.reply({ embeds: [embed] });
}

// 🛑 CANCELAR
async function handleCancelar(interaction) {
  if (!temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '⚠️ Não há sessão ativa para cancelar.',
      ephemeral: true,
    });
  }

  const sessao = getSessao(interaction.channelId);
  deletarSessao(interaction.channelId);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🛑 Sessão Cancelada')
        .setDescription(`Sessão "${sessao.ideia}" foi cancelada na versão ${sessao.versao}.`)
        .setTimestamp(),
    ],
  });
}

// 🏢 PERFIL
async function handlePerfil(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle(`🏢 Perfil — ${empresaConfig.nome}`)
    .addFields(
      { name: '📝 Descrição', value: empresaConfig.descricao },
      { name: '👥 Público-alvo', value: empresaConfig.publicoAlvo },
      { name: '🎨 Tom da marca', value: empresaConfig.tom },
      { name: '🎨 Cores', value: empresaConfig.cores },
      { name: '✨ Estilo visual', value: empresaConfig.estilo },
      { name: '🎯 Objetivo', value: empresaConfig.objetivo },
    )
    .setFooter({ text: 'Configure no arquivo .env para alterar' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

// ❓ AJUDA
async function handleAjuda(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle('❓ Comandos do BIA Designer')
    .setDescription('Bot de design automatizado com ChatGPT + DALL-E')
    .addFields(
      {
        name: '🎨 `/criar`',
        value: 'Inicia novo design. Informe a ideia, tipo, mensagem e instruções extras.',
      },
      {
        name: '🖼️ `/referencia`',
        value: 'Envia imagem de referência pelo Discord. A IA analisa e usa como base.',
      },
      {
        name: '📂 Pasta `/referencias`',
        value: 'Coloque imagens na pasta `referencias/` do projeto. O bot analisa automaticamente!',
      },
      {
        name: '🔄 `/feedback`',
        value: 'Envia feedback para melhorar o design atual. O design evolui, não reinicia.',
      },
      {
        name: '🔁 `/refazer`',
        value: 'Gera nova variação criativa sem feedback específico.',
      },
      {
        name: '✅ `/aprovar`',
        value: 'Aprova o design final e encerra a sessão.',
      },
      {
        name: '📊 `/status`',
        value: 'Mostra informações da sessão ativa (versão, feedbacks, referências).',
      },
      {
        name: '🛑 `/cancelar`',
        value: 'Cancela a sessão atual sem salvar.',
      },
      {
        name: '🏢 `/perfil`',
        value: 'Mostra o perfil da empresa configurado.',
      },
    )
    .setFooter({ text: '🔁 Fluxo: /referencia → /criar → /feedback → /aprovar' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  handleAprovar,
  handleRefazer,
  handleReferencia,
  handleStatus,
  handleCancelar,
  handlePerfil,
  handleAjuda,
};
