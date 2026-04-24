// ============================================
// 🎨 Handler: /criar - Novo Design
// ============================================

const { EmbedBuilder } = require('discord.js');
const { chatCompletion, gerarImagem, analisarReferencia } = require('../services/openai');
const { getSystemPrompt, getDesignPrompt, getTextoArtePrompt } = require('../config/prompts');
const { iniciarSessao, registrarVersao, getSessao, temSessaoAtiva } = require('../services/sessaoDesign');
const { empresaConfig } = require('../config/empresa');
const { analisarReferenciasLocais, resumoReferencias } = require('../services/referenciasLocais');

async function handleCriar(interaction) {
  // Verificar se já tem sessão ativa
  if (temSessaoAtiva(interaction.channelId)) {
    return interaction.reply({
      content: '⚠️ Já existe uma sessão de design ativa neste canal!\nUse `/aprovar` para finalizar ou `/cancelar` para começar outra.',
      ephemeral: true,
    });
  }

  const ideia = interaction.options.getString('ideia');
  const tipo = interaction.options.getString('tipo');
  const mensagem = interaction.options.getString('mensagem');
  const instrucoes = interaction.options.getString('instrucoes');

  // Iniciar sessão
  iniciarSessao(interaction.channelId, { ideia, tipo, mensagem, instrucoes });

  // Defer para dar tempo de processar
  await interaction.deferReply();

  try {
    // Buscar sessão para verificar referências do Discord
    const sessao = getSessao(interaction.channelId);
    let referenciaExtra = '';
    if (sessao.analiseReferencias) {
      referenciaExtra = `\n\n🖼️ REFERÊNCIAS DO DISCORD:\n${sessao.analiseReferencias}`;
    }

    // 🖼️ Analisar referências da pasta local /referencias
    const refLocal = resumoReferencias();
    let refLocalTexto = '';
    let refLocalInfo = '';
    if (refLocal.total > 0) {
      await interaction.editReply({ content: `🔍 Analisando ${refLocal.total} referência(s) da pasta local...` });
      const resultado = await analisarReferenciasLocais(analisarReferencia);
      if (resultado.analiseCompleta) {
        refLocalTexto = `\n\n🖼️ REFERÊNCIAS DA PASTA LOCAL (${resultado.total} imagens):\n${resultado.analiseCompleta}`;
        refLocalInfo = `\n📎 ${resultado.total} ref. locais (${resultado.novas} novas, ${resultado.cacheadas} em cache)`;
      }
    }

    // 1. Gerar prompt de design via ChatGPT
    const promptDesign = getDesignPrompt(ideia, tipo, mensagem, instrucoes, '', 1);
    const systemPrompt = getSystemPrompt() + referenciaExtra + refLocalTexto;

    const dallePrompt = await chatCompletion(systemPrompt, promptDesign);

    // 2. Gerar a imagem via DALL-E 3
    const { url: imagemUrl, revisedPrompt } = await gerarImagem(dallePrompt);

    // 3. Gerar texto da arte via ChatGPT
    const textoArte = await chatCompletion(
      getSystemPrompt(),
      getTextoArtePrompt(ideia, tipo, mensagem)
    );

    // 4. Registrar versão na sessão
    registrarVersao(interaction.channelId, {
      promptDalle: dallePrompt,
      imagemUrl,
      textoArte,
    });

    // 5. Montar embed de resposta
    const embed = new EmbedBuilder()
      .setColor(0x00d26a)
      .setTitle(`🎨 Design v1 — ${empresaConfig.nome}`)
      .setDescription(`**🎯 Ideia aplicada:** ${ideia}`)
      .addFields(
        {
          name: '📌 Tipo',
          value: tipo || 'Institucional',
          inline: true,
        },
        {
          name: '🔢 Versão',
          value: '1',
          inline: true,
        },
        {
          name: '✍️ Texto da Arte',
          value: textoArte.substring(0, 1024),
        },
        {
          name: '🧠 O que foi feito',
          value: `Design inicial criado com base na identidade da marca, briefing fornecido e paleta de cores oficial.${refLocalInfo}`,
        }
      )
      .setImage(imagemUrl)
      .setFooter({
        text: '💬 Use /feedback para ajustes | ✅ /aprovar para finalizar | 🔁 /refazer para nova variação',
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Erro no /criar:', error);
    await interaction.editReply({
      content: `❌ Erro ao gerar design: ${error.message}\n\nVerifique se a API Key da OpenAI está configurada corretamente no arquivo \`.env\`.`,
    });
  }
}

module.exports = { handleCriar };
