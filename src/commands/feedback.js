// ============================================
// 🔄 Handler: /feedback - Melhorar Design
// ============================================

const { EmbedBuilder } = require('discord.js');
const { chatCompletion, gerarImagem, analisarReferencia } = require('../services/openai');
const { getSystemPrompt, getDesignPrompt } = require('../config/prompts');
const {
  getSessao,
  adicionarFeedback,
  registrarVersao,
  temSessaoAtiva,
} = require('../services/sessaoDesign');
const { empresaConfig } = require('../config/empresa');
const { analisarReferenciasLocais } = require('../services/referenciasLocais');

async function handleFeedback(interaction) {
  if (!temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '⚠️ Não há sessão de design ativa!\nUse `/criar` para começar.',
      ephemeral: true,
    });
  }

  const comentario = interaction.options.getString('comentario');

  await interaction.deferReply();

  try {
    // Adicionar feedback à sessão
    adicionarFeedback(interaction.channelId, comentario);
    const sessao = getSessao(interaction.channelId);

    // Contexto de referências
    let referenciaExtra = '';
    if (sessao.analiseReferencias) {
      referenciaExtra = `\n\n🖼️ REFERÊNCIAS VISUAIS:\n${sessao.analiseReferencias}`;
    }

    // 1. Gerar novo prompt com feedback
    const promptDesign = getDesignPrompt(
      sessao.ideia,
      sessao.tipo,
      sessao.mensagem,
      sessao.instrucoes,
      sessao.feedbackAcumulado,
      sessao.versao + 1
    );

    const feedbackContext = `
O usuário deu o seguinte feedback sobre a versão ${sessao.versao}:
"${comentario}"

Feedback acumulado de todas as versões:
${sessao.feedbackAcumulado}

Prompt da última versão gerada:
${sessao.ultimoPromptDalle}

EVOLUA o design. Não reinicie do zero. Melhore com base no feedback.
    `;

    // Referências locais da pasta /referencias
    const resultadoLocal = await analisarReferenciasLocais(analisarReferencia);
    if (resultadoLocal.analiseCompleta) {
      referenciaExtra += `\n\n🖼️ REFERÊNCIAS LOCAIS:\n${resultadoLocal.analiseCompleta}`;
    }

    const systemPrompt = getSystemPrompt() + referenciaExtra;
    const dallePrompt = await chatCompletion(systemPrompt, promptDesign + '\n\n' + feedbackContext);

    // 2. Gerar nova imagem
    const { url: imagemUrl } = await gerarImagem(dallePrompt);

    // 3. Gerar descrição das melhorias
    const melhorias = await chatCompletion(
      getSystemPrompt(),
      `Resuma em 2-3 frases curtas o que foi melhorado na versão ${sessao.versao + 1} do design, considerando o feedback: "${comentario}". Responda APENAS com as melhorias.`
    );

    // 4. Registrar nova versão
    registrarVersao(interaction.channelId, {
      promptDalle: dallePrompt,
      imagemUrl,
      textoArte: sessao.textoArte,
    });

    // 5. Responder
    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`🔄 Design v${sessao.versao} — ${empresaConfig.nome}`)
      .setDescription(`**🎯 Ideia aplicada:** ${sessao.ideia}`)
      .addFields(
        {
          name: '💬 Feedback recebido',
          value: comentario.substring(0, 500),
        },
        {
          name: '🧠 O que foi melhorado',
          value: melhorias.substring(0, 1024),
        },
        {
          name: '🔢 Versão',
          value: `${sessao.versao}`,
          inline: true,
        },
        {
          name: '📊 Feedbacks acumulados',
          value: `${sessao.versao - 1}`,
          inline: true,
        },
        {
          name: '✍️ Texto da Arte',
          value: sessao.textoArte.substring(0, 1024),
        }
      )
      .setImage(imagemUrl)
      .setFooter({
        text: '💬 /feedback para mais ajustes | ✅ /aprovar para finalizar | 🔁 /refazer para nova variação',
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erro no /feedback:', error);
    await interaction.editReply({
      content: `❌ Erro ao gerar nova versão: ${error.message}`,
    });
  }
}

module.exports = { handleFeedback };
