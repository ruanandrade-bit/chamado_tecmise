// ============================================
// 🧠 Serviço OpenAI (ChatGPT + DALL-E)
// ============================================

const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Modelos configuráveis via .env (defaults = mais baratos)
const MODELO_CHAT = process.env.OPENAI_MODELO_CHAT || 'gpt-4o-mini';
const MODELO_VISION = process.env.OPENAI_MODELO_VISION || 'gpt-4o-mini';
const MODELO_IMAGEM = process.env.OPENAI_MODELO_IMAGEM || 'dall-e-3';
const IMAGEM_QUALIDADE = process.env.OPENAI_IMAGEM_QUALIDADE || 'standard';
const IMAGEM_ESTILO = process.env.OPENAI_IMAGEM_ESTILO || 'vivid';

console.log(`🧠 Modelos configurados:`);
console.log(`   Chat: ${MODELO_CHAT}`);
console.log(`   Vision: ${MODELO_VISION}`);
console.log(`   Imagem: ${MODELO_IMAGEM} (${IMAGEM_QUALIDADE}, ${IMAGEM_ESTILO})`);

/**
 * Envia mensagem para o ChatGPT e retorna a resposta
 * @param {string} systemPrompt - System prompt com identidade da empresa
 * @param {string} userMessage - Mensagem do usuário
 * @param {Array} conversationHistory - Histórico de conversa (opcional)
 * @returns {string} Resposta do ChatGPT
 */
async function chatCompletion(systemPrompt, userMessage, conversationHistory = []) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: MODELO_CHAT,
      messages,
      max_tokens: 1500,
      temperature: 0.8,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ChatGPT:', error.message);
    throw new Error(`Erro ao comunicar com ChatGPT: ${error.message}`);
  }
}

/**
 * Gera uma imagem usando DALL-E 3
 * @param {string} prompt - Prompt descritivo para a imagem
 * @returns {string} URL da imagem gerada
 */
async function gerarImagem(prompt) {
  try {
    const response = await openai.images.generate({
      model: MODELO_IMAGEM,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: IMAGEM_QUALIDADE,
      style: IMAGEM_ESTILO,
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    };
  } catch (error) {
    console.error('❌ Erro DALL-E:', error.message);
    throw new Error(`Erro ao gerar imagem: ${error.message}`);
  }
}

/**
 * Analisa uma imagem de referência usando GPT-4o Vision
 * @param {string} imageUrl - URL da imagem para análise
 * @returns {string} Análise visual da imagem
 */
async function analisarReferencia(imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: MODELO_VISION,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem de referência visual e identifique:
1. Paleta de cores usada (códigos hex se possível)
2. Estilo tipográfico
3. Composição e layout
4. Mood/atmosfera
5. Elementos visuais destacados
6. Estilo geral (minimalista, chamativo, elegante, etc.)

Seja detalhado e técnico na análise. Responda em português.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro análise de referência:', error.message);
    throw new Error(`Erro ao analisar referência: ${error.message}`);
  }
}

module.exports = { chatCompletion, gerarImagem, analisarReferencia };
