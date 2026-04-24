// ============================================
// 📋 Registro dos Slash Commands do Discord
// ============================================

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  // /criar - Iniciar novo design
  new SlashCommandBuilder()
    .setName('criar')
    .setDescription('🎨 Criar um novo design para Instagram')
    .addStringOption(opt =>
      opt.setName('ideia')
        .setDescription('Ideia do post (ex: promoção de verão, lançamento de produto)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('tipo')
        .setDescription('Tipo do post')
        .setRequired(false)
        .addChoices(
          { name: '🛒 Promoção', value: 'promoção' },
          { name: '🏢 Institucional', value: 'institucional' },
          { name: '📢 Lançamento', value: 'lançamento' },
          { name: '📅 Evento', value: 'evento' },
          { name: '💡 Dica/Educativo', value: 'dica' },
          { name: '🎉 Comemorativo', value: 'comemorativo' },
          { name: '📊 Depoimento/Social Proof', value: 'depoimento' },
          { name: '🔥 Urgência/Escassez', value: 'urgência' },
        )
    )
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Mensagem principal que quer transmitir')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('instrucoes')
        .setDescription('Instruções extras de design (ex: usar foto de produto, tom alegre)')
        .setRequired(false)
    ),

  // /feedback - Enviar feedback sobre o design atual
  new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('🔄 Enviar feedback para melhorar o design atual')
    .addStringOption(opt =>
      opt.setName('comentario')
        .setDescription('Seu feedback (ex: mais moderno, cores mais fortes, menos texto)')
        .setRequired(true)
    ),

  // /aprovar - Aprovar o design final
  new SlashCommandBuilder()
    .setName('aprovar')
    .setDescription('✅ Aprovar o design atual e encerrar a sessão'),

  // /referencia - Enviar imagem de referência
  new SlashCommandBuilder()
    .setName('referencia')
    .setDescription('🖼️ Enviar imagem de referência visual')
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem de referência (design, post antigo, inspiração)')
        .setRequired(true)
    ),

  // /refazer - Gerar nova variação sem feedback
  new SlashCommandBuilder()
    .setName('refazer')
    .setDescription('🔁 Gerar nova variação criativa (sem feedback específico)'),

  // /status - Ver sessão atual
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Ver informações da sessão de design atual'),

  // /cancelar - Cancelar sessão
  new SlashCommandBuilder()
    .setName('cancelar')
    .setDescription('🛑 Cancelar a sessão de design atual'),

  // /perfil - Ver perfil da empresa
  new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('🏢 Ver o perfil da empresa configurado'),

  // /ajuda - Mostrar comandos
  new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('❓ Ver todos os comandos disponíveis'),
];

/**
 * Registra os comandos no Discord
 */
async function registrarComandos() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('📋 Registrando slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    );

    console.log('✅ Slash commands registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
    throw error;
  }
}

module.exports = { registrarComandos, commands };
