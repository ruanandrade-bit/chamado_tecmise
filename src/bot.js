// ============================================
// 🤖 ProjectBIA — Bot Principal
// Discord Bot + ChatGPT + DALL-E
// Designer Automatizado de Redes Sociais
// ============================================

require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const { registrarComandos } = require('./commands/register');
const { handleCriar } = require('./commands/criar');
const { handleFeedback } = require('./commands/feedback');
const {
  handleAprovar,
  handleRefazer,
  handleReferencia,
  handleStatus,
  handleCancelar,
  handlePerfil,
  handleAjuda,
} = require('./commands/handlers');
const { empresaConfig } = require('./config/empresa');

// ============================================
// 🔒 Validação de Variáveis de Ambiente
// ============================================

function validarConfig() {
  const erros = [];

  if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'COLE_SEU_TOKEN_AQUI') {
    erros.push('❌ DISCORD_TOKEN não configurado no .env');
  }
  if (!process.env.DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID === 'COLE_SEU_CLIENT_ID_AQUI') {
    erros.push('❌ DISCORD_CLIENT_ID não configurado no .env');
  }
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'COLE_SUA_API_KEY_AQUI') {
    erros.push('❌ OPENAI_API_KEY não configurada no .env');
  }

  if (erros.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  CONFIGURAÇÃO INCOMPLETA');
    console.log('='.repeat(60));
    erros.forEach(e => console.log(e));
    console.log('\n📋 Siga as instruções do README.md para configurar.');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

validarConfig();

// ============================================
// 🤖 Criar Cliente Discord
// ============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// ============================================
// 📡 Evento: Bot Online
// ============================================

client.once(Events.ClientReady, async (readyClient) => {
  console.log('\n' + '='.repeat(60));
  console.log(`🤖 BIA Designer está ONLINE!`);
  console.log(`📛 Logado como: ${readyClient.user.tag}`);
  console.log(`🏢 Empresa: ${empresaConfig.nome}`);
  console.log(`🎨 Estilo: ${empresaConfig.estilo}`);
  console.log(`🎯 Objetivo: ${empresaConfig.objetivo}`);
  console.log(`📡 Servidores: ${readyClient.guilds.cache.size}`);
  console.log('='.repeat(60) + '\n');

  // Status do bot
  readyClient.user.setActivity('🎨 /criar para novo design', {
    type: ActivityType.Watching,
  });

  // Registrar slash commands
  try {
    await registrarComandos();
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err.message);
  }
});

// ============================================
// 🎮 Evento: Interação (Slash Commands)
// ============================================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  console.log(`📨 Comando: /${commandName} — por ${interaction.user.tag} em #${interaction.channel?.name || 'DM'}`);

  try {
    switch (commandName) {
      case 'criar':
        await handleCriar(interaction);
        break;
      case 'feedback':
        await handleFeedback(interaction);
        break;
      case 'aprovar':
        await handleAprovar(interaction);
        break;
      case 'refazer':
        await handleRefazer(interaction);
        break;
      case 'referencia':
        await handleReferencia(interaction);
        break;
      case 'status':
        await handleStatus(interaction);
        break;
      case 'cancelar':
        await handleCancelar(interaction);
        break;
      case 'perfil':
        await handlePerfil(interaction);
        break;
      case 'ajuda':
        await handleAjuda(interaction);
        break;
      default:
        await interaction.reply({
          content: '❓ Comando desconhecido. Use `/ajuda` para ver os comandos.',
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error(`❌ Erro no comando /${commandName}:`, error);

    const errorMsg = `❌ Ocorreu um erro ao processar o comando.\n\`\`\`${error.message}\`\`\``;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
});

// ============================================
// 🚀 Login do Bot
// ============================================

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('\n❌ FALHA AO CONECTAR NO DISCORD!');
  console.error('Possíveis causas:');
  console.error('  1. Token do Discord inválido');
  console.error('  2. Sem conexão com a internet');
  console.error('  3. Bot não foi criado corretamente no Discord Developer Portal');
  console.error('\n🔗 https://discord.com/developers/applications');
  console.error('\nErro:', err.message);
  process.exit(1);
});

// ============================================
// 🔧 Tratamento de Erros Globais
// ============================================

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
