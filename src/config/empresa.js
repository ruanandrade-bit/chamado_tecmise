// ============================================
// 🏢 Configuração do Perfil da Empresa
// Carregado via variáveis de ambiente (.env)
// ============================================

require('dotenv').config();

const empresaConfig = {
  nome: process.env.EMPRESA_NOME || 'Minha Empresa',
  descricao: process.env.EMPRESA_DESCRICAO || 'Empresa de tecnologia',
  publicoAlvo: process.env.EMPRESA_PUBLICO || 'Jovens e adultos 18-35',
  tom: process.env.EMPRESA_TOM || 'moderno, premium',
  cores: process.env.EMPRESA_CORES || 'Azul (#0066ff), Branco (#ffffff)',
  estilo: process.env.EMPRESA_ESTILO || 'minimalista e elegante',
  objetivo: process.env.EMPRESA_OBJETIVO || 'vendas e engajamento',
};

/**
 * Retorna o perfil completo da empresa como texto formatado
 * para ser usado no system prompt do ChatGPT
 */
function getPerfilEmpresaTexto() {
  return `
📋 PERFIL DA EMPRESA:
- Nome: ${empresaConfig.nome}
- O que faz: ${empresaConfig.descricao}
- Público-alvo: ${empresaConfig.publicoAlvo}
- Tom da marca: ${empresaConfig.tom}
- Cores principais: ${empresaConfig.cores}
- Estilo visual: ${empresaConfig.estilo}
- Objetivo dos posts: ${empresaConfig.objetivo}
  `.trim();
}

module.exports = { empresaConfig, getPerfilEmpresaTexto };
