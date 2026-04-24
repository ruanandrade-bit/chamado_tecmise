// ============================================
// 🖼️ Serviço de Referências Locais
// Lê imagens da pasta /referencias e analisa
// com GPT Vision. Cacheia as análises para
// não gastar API analisando a mesma imagem.
// ============================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PASTA_REFERENCIAS = path.join(__dirname, '..', '..', 'referencias');
const CACHE_FILE = path.join(PASTA_REFERENCIAS, '.cache_analises.json');

// Extensões de imagem aceitas
const EXTENSOES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];

/**
 * Carrega o cache de análises anteriores
 */
function carregarCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('⚠️ Erro ao carregar cache de referências:', err.message);
  }
  return {};
}

/**
 * Salva o cache de análises
 */
function salvarCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Erro ao salvar cache de referências:', err.message);
  }
}

/**
 * Gera um hash MD5 do conteúdo do arquivo para detectar mudanças
 */
function hashArquivo(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Lista todas as imagens na pasta de referências
 */
function listarImagens() {
  try {
    if (!fs.existsSync(PASTA_REFERENCIAS)) {
      fs.mkdirSync(PASTA_REFERENCIAS, { recursive: true });
      return [];
    }

    const arquivos = fs.readdirSync(PASTA_REFERENCIAS);
    return arquivos
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return EXTENSOES.includes(ext);
      })
      .map(f => ({
        nome: f,
        caminho: path.join(PASTA_REFERENCIAS, f),
      }));
  } catch (err) {
    console.error('❌ Erro ao listar referências:', err.message);
    return [];
  }
}

/**
 * Converte uma imagem local para base64 data URL
 */
function imagemParaBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Analisa todas as imagens da pasta, usando cache quando possível
 * @param {Function} analisarFn - Função de análise do openai.js (analisarReferencia)
 * @returns {Object} { total, novas, cacheadas, analiseCompleta }
 */
async function analisarReferenciasLocais(analisarFn) {
  const imagens = listarImagens();

  if (imagens.length === 0) {
    return {
      total: 0,
      novas: 0,
      cacheadas: 0,
      analiseCompleta: '',
    };
  }

  const cache = carregarCache();
  let novas = 0;
  let cacheadas = 0;
  let analisesTexto = [];

  for (const img of imagens) {
    const hash = hashArquivo(img.caminho);

    // Verificar se já foi analisada (mesmo hash = mesma imagem)
    if (cache[img.nome] && cache[img.nome].hash === hash) {
      // Usar análise cacheada
      analisesTexto.push(`--- 📎 ${img.nome} (cache) ---\n${cache[img.nome].analise}`);
      cacheadas++;
      console.log(`   📎 ${img.nome} — usando cache`);
    } else {
      // Nova imagem ou modificada — analisar com Vision
      try {
        console.log(`   🔍 ${img.nome} — analisando com IA...`);
        const base64Url = imagemParaBase64(img.caminho);
        const analise = await analisarFn(base64Url);

        // Salvar no cache
        cache[img.nome] = {
          hash,
          analise,
          analisadaEm: new Date().toISOString(),
        };

        analisesTexto.push(`--- 📎 ${img.nome} (nova análise) ---\n${analise}`);
        novas++;
      } catch (err) {
        console.error(`   ❌ Erro ao analisar ${img.nome}:`, err.message);
        analisesTexto.push(`--- 📎 ${img.nome} (erro) ---\nNão foi possível analisar: ${err.message}`);
      }
    }
  }

  // Limpar cache de imagens que foram removidas
  const nomesAtuais = imagens.map(i => i.nome);
  for (const nomeCache of Object.keys(cache)) {
    if (!nomesAtuais.includes(nomeCache)) {
      delete cache[nomeCache];
    }
  }

  salvarCache(cache);

  const analiseCompleta = analisesTexto.join('\n\n');

  return {
    total: imagens.length,
    novas,
    cacheadas,
    analiseCompleta,
  };
}

/**
 * Retorna resumo rápido das referências sem analisar
 */
function resumoReferencias() {
  const imagens = listarImagens();
  const cache = carregarCache();
  const analisadas = imagens.filter(i => cache[i.nome]).length;

  return {
    total: imagens.length,
    analisadas,
    pendentes: imagens.length - analisadas,
    nomes: imagens.map(i => i.nome),
  };
}

module.exports = {
  analisarReferenciasLocais,
  resumoReferencias,
  listarImagens,
  PASTA_REFERENCIAS,
};
