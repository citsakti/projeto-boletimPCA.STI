/**
 * AcompanhamentoProcessos.js
 *
 * Objetivo: Substituir o conteúdo da coluna "Acompanhamento" (antiga "Status Início")
 * exibindo: "<SETOR> - há <X> dia(s)" a partir dos dados da API de processos.
 *
 * Fluxo:
 *  1. Escuta o evento 'tabela-carregada' (disparado após montar a tabela)
 *  2. Coleta todos os números de processo da coluna "Processo" (última coluna)
 *  3. Faz requisições em lote (POST) à API https://api-processos.tce.ce.gov.br/processos/porLista
 *  4. Calcula diferença em dias entre hoje e dtUltimoEncaminhamento
 *  5. Atualiza a 5ª coluna (índice 4) de cada linha com o texto: "SETOR - há X dias"
 *
 * Observações:
 *  - Mantém valor original em data-original-acompanhamento (caso precise fallback)
 *  - Usa cache simples em memória para evitar requisições repetidas quando a tabela é recarregada
 *  - Disponibiliza window.atualizarAcompanhamentoProcessos() para chamadas manuais
 */

(function(){
  const API_URL = "https://api-processos.tce.ce.gov.br/processos/porLista";
  const MAX_POR_LOTE = 10; // API limita a 10 processos por requisição
  const cacheProcessos = new Map(); // numero -> objeto retornado bruto
  let ultimaExecucaoHash = null;

  async function buscarProcessosLote(numeros, { timeoutMs = 10000 } = {}) {
    if (!numeros.length) return [];
    const payload = {
      numeros,
      filtros: {},
      pagina: 0,
      qtd: Math.min(numeros.length, 10) // Limitado a 10 processos por requisição
    };
    
    if (window._acompanhamentoDebug) {
      console.log('[API] Enviando requisição:', {
        url: API_URL,
        payload: payload,
        numerosEnviados: numeros
      });
    }
    
    const controller = new AbortController();
    const to = setTimeout(()=>controller.abort(), timeoutMs);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      if (window._acompanhamentoDebug) {
        console.log('[API] Resposta recebida:', {
          status: resp.status,
          statusText: resp.statusText,
          headers: Object.fromEntries(resp.headers.entries())
        });
      }
      
      if (!resp.ok) {
        const t = await resp.text().catch(()=>"");
        const errorInfo = { status: resp.status, message: t || resp.statusText };
        throw new Error(`HTTP ${resp.status} ${t||resp.statusText}`, { cause: errorInfo });
      }
      
      const data = await resp.json();
      
      if (window._acompanhamentoDebug) {
        console.log('[API] Dados JSON recebidos:', {
          tipoResposta: typeof data,
          ehArray: Array.isArray(data),
          chaves: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
          tamanho: Array.isArray(data) ? data.length : 'N/A',
          primeiroItem: data && Array.isArray(data) && data[0] ? data[0] : 
                       data && typeof data === 'object' ? Object.values(data)[0] : 'N/A'
        });
      }
      
      return data;
    } catch (error) {
      if (window._acompanhamentoDebug) {
        console.error('[API] Erro na requisição:', error);
      }
      // Preservar informações do erro HTTP para exibição posterior
      if (error.message.includes('HTTP ')) {
        const statusMatch = error.message.match(/HTTP (\d+)/);
        if (statusMatch) {
          error.httpStatus = parseInt(statusMatch[1]);
        }
      }
      throw error;
    } finally { 
      clearTimeout(to); 
    }
  }

  async function buscarProcessos(numeros, opts={}) {
    // Remove já cacheados
    const faltantes = numeros.filter(n => !cacheProcessos.has(n));
    const lotes = [];
    for (let i=0;i<faltantes.length;i+=MAX_POR_LOTE) {
      lotes.push(faltantes.slice(i, i+MAX_POR_LOTE));
    }
    
    const errosLotes = []; // Array para coletar erros de cada lote
    
    // Processar lotes sequencialmente com pequeno delay entre requisições
    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      try {
        if (window._acompanhamentoDebug) console.log(`[Acompanhamento] Processando lote ${i+1}/${lotes.length} (${lote.length} processos):`, lote);
        
        const dados = await buscarProcessosLote(lote, opts);
        
        // DEBUG: Log da estrutura da resposta
        if (window._acompanhamentoDebug && i === 0) {
          console.log('[Acompanhamento] Estrutura da resposta da API:', {
            tipoDados: typeof dados,
            ehArray: Array.isArray(dados),
            chaves: dados && typeof dados === 'object' ? Object.keys(dados) : 'N/A',
            primeiroItem: dados && Array.isArray(dados) && dados[0] ? dados[0] : 'N/A'
          });
        }
        
        let lista = [];
        if (Array.isArray(dados)) {
          lista = dados;
        } else if (dados && typeof dados === 'object') {
          // Primeiro, verificar se há uma propriedade 'data' (estrutura da API do TCE)
          if (dados.data) {
            if (Array.isArray(dados.data)) {
              lista = dados.data;
              if (window._acompanhamentoDebug) console.log(`[Acompanhamento] Dados encontrados em: data (array direto)`);
            } else if (typeof dados.data === 'object') {
              // Se data é um objeto, procurar dentro dele (incluindo 'lista')
              const subChaves = ['lista', 'content', 'items', 'result', 'processos', 'registros'];
              for (const k of subChaves) {
                if (Array.isArray(dados.data[k])) {
                  lista = dados.data[k];
                  if (window._acompanhamentoDebug) console.log(`[Acompanhamento] Dados encontrados em: data.${k}`);
                  break;
                }
              }
              // Se não encontrou em subchaves, talvez data seja uma lista de propriedades
              if (!lista.length) {
                Object.values(dados.data).forEach(v => {
                  if (v && typeof v === 'object' && (v.nrProcesso || v.numero)) lista.push(v);
                });
                if (lista.length && window._acompanhamentoDebug) {
                  console.log('[Acompanhamento] Dados coletados de propriedades de data');
                }
              }
            }
          } else {
            // Fallback: buscar nas chaves originais
            const chavesPossiveis = ['conteudo','content','items','result','processos','lista','registros'];
            for (const k of chavesPossiveis) {
              if (Array.isArray(dados[k])) { 
                lista = dados[k]; 
                if (window._acompanhamentoDebug) console.log(`[Acompanhamento] Dados encontrados na chave: ${k}`);
                break; 
              }
            }
            if (!lista.length) {
              // tentativa final: coletar subobjetos com campo numero ou nrProcesso
              Object.values(dados).forEach(v => { 
                if (v && typeof v === 'object' && (v.nrProcesso || v.numero)) lista.push(v); 
              });
              if (lista.length && window._acompanhamentoDebug) {
                console.log('[Acompanhamento] Dados coletados de subobjetos');
              }
            }
          }
        }
        
        if (window._acompanhamentoDebug) {
          console.log(`[Acompanhamento] Lote ${i+1}/${lotes.length} processado: ${lista.length} processos encontrados`);
          if (lista.length > 0) {
            console.log('[Acompanhamento] Exemplo de processo:', lista[0]);
          }
        }
        
        lista.forEach(item => { 
          // A API retorna 'nrProcesso' ao invés de 'numero'
          const numeroProcesso = item.nrProcesso || item.numero;
          if (item && numeroProcesso) {
            const numeroNormalizado = normalizarNumero(numeroProcesso);
            cacheProcessos.set(numeroNormalizado, item);
            if (window._acompanhamentoDebug && cacheProcessos.size <= 5) {
              console.log(`[Cache] Armazenado: ${numeroNormalizado}`, {
                numeroOriginal: numeroProcesso,
                setor: item?.setor?.descricao,
                dtUltimoEncaminhamento: item?.dtUltimoEncaminhamento,
                objetoCompleto: item
              });
            }
          } else {
            if (window._acompanhamentoDebug) {
              console.warn('[Cache] Item inválido encontrado:', item);
            }
          }
        });
        
        if (window._acompanhamentoDebug) {
          console.log(`[Cache] Estado atual: ${cacheProcessos.size} processos armazenados`);
        }
        
        // Pequeno delay entre requisições para não sobrecarregar a API
        if (i < lotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch(err) {
        console.error(`AcompanhamentoProcessos: erro ao buscar lote ${i+1}/${lotes.length}`, lote, err);
        // Armazenar erro para posterior exibição nas células afetadas
        errosLotes.push({
          lote: lote,
          erro: err,
          httpStatus: err.httpStatus || null
        });
      }
    }
    
    // Retornar informações sobre erros para uso posterior
    return { errosLotes };
  }

  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  function diffDiasBrasil(dataStr) {
    // dataStr formato dd/mm/aaaa
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) return null;
    const [d,m,a] = dataStr.split('/').map(Number);
    const dt = new Date(a, m-1, d, 0,0,0,0);
    if (isNaN(dt.getTime())) return null;
    const hoje = new Date();
    const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const ms = base - dt;
    return Math.max(0, Math.floor(ms / 86400000));
  }

  function formatar(setorDesc, dias) {
    if (!setorDesc) return '';
    if (dias == null) return setorDesc;
    
    // Usar tag estilizada para os dias
  const tagDias = renderTempoAcompanhamentoTag(dias);
  // Exibir a tag em uma linha abaixo do texto do setor
  return `${setorDesc}<div class="tempo-acompanhamento-wrapper">${tagDias}</div>`;
  }

  /**
   * Renderiza tag de tempo com classificação por cor (baseado em AnalyticsTempoSetor.js)
   * @param {number} dias - Número de dias
   * @returns {string} - HTML da tag formatada com classificação
   */
  function renderTempoAcompanhamentoTag(dias) {
    if (dias === null || dias === undefined || dias < 0) {
      return '';
    }
    
  // Mostrar "Hoje" quando dias === 0
  const isHoje = dias === 0;
  const plural = dias === 1 ? 'dia' : 'dias';
  const textoTag = isHoje ? 'Hoje' : `${dias} ${plural}`;
  const tooltip = isHoje ? 'Hoje no setor atual' : `Há ${textoTag} no setor atual`;
  const classeAdicional = getClassePorTempo(dias);
    
  return `<span class="tempo-acompanhamento-tag${classeAdicional}" title="${tooltip}">${textoTag}</span>`;
  }

  /**
   * Determina a classe CSS baseada no número de dias (padronizada com cor única)
   * @param {number} dias - Número de dias no setor
   * @returns {string} - Classe CSS adicional (sempre a mesma cor)
   */
  function getClassePorTempo(dias) {
    if (dias === null || dias === undefined) return '';
    // Quando for hoje (0 dias), usar variação verde; caso contrário, padrão azul
    if (dias === 0) return ' tempo-hoje';
    return ' tempo-padrao';
  }

  /**
   * Aplica estilização CSS para as tags de tempo de acompanhamento (baseado em AnalyticsTempoSetor.js)
   */
  function applyTempoAcompanhamentoStyles() {
    // Verificar se o estilo já existe
    const existingStyle = document.getElementById('tempo-acompanhamento-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'tempo-acompanhamento-styles';
    style.textContent = `
    /* Wrapper para forçar a tag a ficar abaixo do texto principal */
    .tempo-acompanhamento-wrapper {
      display: block;
      margin-top: 4px;
      line-height: 1;
    }
        
        .tempo-acompanhamento-tag {
            display: inline-block;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            color: #1565c0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
      margin-left: 0;
            border: 1px solid #90caf9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: help;
        }
        
        .tempo-acompanhamento-tag:hover {
            background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        /* Classe padronizada para todos os tempos */
        .tempo-acompanhamento-tag.tempo-padrao {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-color: #90caf9;
            color: #1565c0;
        }
        
    /* Variação verde pastel para Hoje (0 dias) */
    .tempo-acompanhamento-tag.tempo-hoje {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-color: #a5d6a7;
      color: #2e7d32;
    }
    .tempo-acompanhamento-tag.tempo-hoje:hover {
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
    }
        
        @media (max-width: 768px) {
      .tempo-acompanhamento-wrapper {
        margin-top: 2px;
      }
            .tempo-acompanhamento-tag {
                font-size: 10px;
                padding: 2px 6px;
        margin-left: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
  }

  function exibirLoading(cell) {
    // Verificar se Font Awesome está disponível, senão usar alternativas
    const spinnerIcon = document.querySelector('i.fa') || document.querySelector('i.fas') ? 
      '<i class="fas fa-spinner fa-spin"></i>' : 
      '<div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>';
    
    cell.innerHTML = `<span class="text-muted">Carregando ${spinnerIcon}</span>`;
    cell.dataset.statusCarregamento = 'loading';
  }

  function exibirErro(cell, codigoErro = null, mensagem = '') {
    const textoErro = codigoErro ? 
      `<span class="text-danger">Erro ${codigoErro}</span>` : 
      `<span class="text-danger">Erro ${mensagem || 'desconhecido'}</span>`;
    cell.innerHTML = textoErro;
    cell.dataset.statusCarregamento = 'erro';
    cell.dataset.codigoErro = codigoErro || 'desconhecido';
  }

  function limparStatusCarregamento(cell) {
    delete cell.dataset.statusCarregamento;
    delete cell.dataset.codigoErro;
  }

  function coletarNumerosDaTabela() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return [];
    const numeros = new Set();
    tbody.querySelectorAll('tr').forEach(tr => {
      const processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9];
      if (!processoCell) return;
      let numero = processoCell.dataset.processoNumero || processoCell.textContent.replace('🔗','').trim();
      numero = normalizarNumero(numero);
      if (numero) numeros.add(numero);
    });
    return Array.from(numeros);
  }

  function hashLista(arr) {
    return arr.slice().sort().join('|');
  }

  // Função de debug detalhada para investigar problemas de renderização
  function debugDetalhado() {
    console.log('=== DEBUG DETALHADO ACOMPANHAMENTO ===');
    
    // 1. Verificar estrutura da tabela
    const tbody = document.querySelector('#detalhes table tbody');
    console.log('1. Tbody encontrado:', !!tbody);
    
    if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      console.log('2. Total de linhas:', rows.length);
      
      if (rows.length > 0) {
        const primeiraLinha = rows[0];
        console.log('3. Primeira linha:', primeiraLinha);
        console.log('4. Células da primeira linha:', primeiraLinha.children.length);
        
        // Verificar como encontrar a célula de processo
        const processoCell1 = primeiraLinha.querySelector('td[data-label="Processo"]');
        const processoCell2 = primeiraLinha.children[9];
        console.log('5. Processo por data-label:', processoCell1?.textContent);
        console.log('6. Processo por índice [9]:', processoCell2?.textContent);
        
        // Verificar como encontrar a célula de acompanhamento
        const acompCell1 = primeiraLinha.querySelector('td[data-label="Acompanhamento"]');
        const acompCell2 = primeiraLinha.children[4];
        console.log('7. Acompanhamento por data-label:', acompCell1?.textContent);
        console.log('8. Acompanhamento por índice [4]:', acompCell2?.textContent);
      }
    }
    
    // 2. Verificar cache de processos
    console.log('9. Cache de processos:', cacheProcessos.size, 'itens');
    console.log('10. Primeiros 3 itens do cache:');
    let count = 0;
    for (const [numero, dados] of cacheProcessos.entries()) {
      if (count++ >= 3) break;
      console.log(`   ${numero}:`, {
        setor: dados?.setor?.descricao,
        dtUltimoEncaminhamento: dados?.dtUltimoEncaminhamento,
        dadosCompletos: dados
      });
    }
    
    // 3. Testar normalização de números
    const numerosColetados = coletarNumerosDaTabela();
    console.log('11. Números coletados da tabela:', numerosColetados.slice(0, 5));
    
    // 4. Verificar correspondência
    let correspondencias = 0;
    numerosColetados.slice(0, 5).forEach(numero => {
      const temCache = cacheProcessos.has(numero);
      console.log(`12. Número ${numero} tem cache:`, temCache);
      if (temCache) correspondencias++;
    });
    console.log('13. Total de correspondências encontradas:', correspondencias);
  }

  function aplicarDadosNaTabela() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) {
      console.warn('[Acompanhamento] Tbody não encontrado');
      return;
    }
    
    let atualizadas = 0;
    let tentativas = 0;
    let erros = [];
    
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tentativas++;
      
      // Tentar múltiplas formas de encontrar as células
      let processoCell = tr.querySelector('td[data-label="Processo"]');
      if (!processoCell) processoCell = tr.children[9];
      if (!processoCell) processoCell = tr.querySelector('td:last-child'); // última coluna
      
      let acompCell = tr.querySelector('td[data-label="Acompanhamento"]');
      if (!acompCell) acompCell = tr.children[4];
      if (!acompCell) {
        // Tentar encontrar por texto do cabeçalho
        const headers = document.querySelectorAll('thead th');
        let acompIndex = -1;
        headers.forEach((th, i) => {
          if (th.textContent.toLowerCase().includes('acompanhamento')) {
            acompIndex = i;
          }
        });
        if (acompIndex >= 0) acompCell = tr.children[acompIndex];
      }
      
      if (!processoCell || !acompCell) {
        if (window._acompanhamentoDebug && index < 3) {
          erros.push(`Linha ${index}: processoCell=${!!processoCell}, acompCell=${!!acompCell}`);
        }
        return;
      }
      
      // Extrair número do processo
      let textoProcesso = processoCell.dataset.processoNumero || processoCell.textContent;
      textoProcesso = textoProcesso.replace('🔗', '').trim();
      const numero = normalizarNumero(textoProcesso);
      
      if (!numero) {
        // Sem número válido - exibir "*" e pular processamento
        if (acompCell.dataset.statusCarregamento === 'loading') {
          acompCell.innerHTML = '<span class="text-muted">*</span>';
          acompCell.dataset.statusCarregamento = 'sem-processo';
        }
        if (window._acompanhamentoDebug && index < 3) {
          erros.push(`Linha ${index}: número vazio, exibindo "*". Texto original: "${textoProcesso}"`);
        }
        return;
      }
      
      const dado = cacheProcessos.get(numero);
      if (!dado) {
        if (window._acompanhamentoDebug && index < 3) {
          erros.push(`Linha ${index}: sem dados no cache para "${numero}"`);
        }
        return;
      }
      
      // Verificar status do processo (coluna 5 - "Status do Processo")
      let statusCell = tr.querySelector('td[data-label="Status do Processo"]');
      if (!statusCell) statusCell = tr.children[5]; // índice 5 = 6ª coluna
      
      const statusTexto = statusCell ? statusCell.textContent.trim() : '';
      const isStatusCompleto = statusTexto === 'RENOVADO ✅' || statusTexto === 'CONTRATADO ✅';
      
      const setorDesc = dado?.setor?.descricao || '';
      const dtUltimoEnc = dado?.dtUltimoEncaminhamento;
      const dias = diffDiasBrasil(dtUltimoEnc);
      
      // Preservar valor original
      if (!acompCell.dataset.originalAcompanhamento) {
        acompCell.dataset.originalAcompanhamento = acompCell.textContent.trim();
      }
      
      // Se o status for RENOVADO ✅ ou CONTRATADO ✅, exibir apenas o setor sem a tag de tempo
      const texto = isStatusCompleto ? 
        (setorDesc || null) : 
        (formatar(setorDesc, dias) || (setorDesc ? setorDesc : null));
      
      if (texto) {
        acompCell.innerHTML = texto;
        acompCell.dataset.setorAtual = setorDesc;
        if (dias != null) acompCell.dataset.diasSetor = dias;
        acompCell.dataset.fonteDados = 'api';
        limparStatusCarregamento(acompCell);
        atualizadas++;
        
        if (window._acompanhamentoDebug && index < 3) {
          console.log(`[Acompanhamento] Linha ${index} atualizada:`, {
            numero,
            setor: setorDesc,
            dias,
            dtUltimoEnc,
            textoFinal: texto
          });
        }
      } else {
        if (window._acompanhamentoDebug && index < 3) {
          erros.push(`Linha ${index}: texto vazio. Setor: "${setorDesc}", Dias: ${dias}`);
        }
      }
    });
    
    if (window._acompanhamentoDebug) {
      console.log(`[Acompanhamento] Resultado: ${atualizadas}/${tentativas} células atualizadas`);
      if (erros.length) {
        console.log('[Acompanhamento] Erros encontrados:', erros);
      }
    }
    
    document.dispatchEvent(new CustomEvent('acompanhamento-atualizado', { 
      detail: { atualizadas, tentativas, ts: Date.now() }
    }));
  }

  function aplicarErrosNaTabela(errosLotes) {
    if (!errosLotes || !errosLotes.length) return;
    
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    
    // Criar um Set com todos os números que falharam
    const numerosFalharam = new Set();
    errosLotes.forEach(errorInfo => {
      errorInfo.lote.forEach(numero => {
        numerosFalharam.add(normalizarNumero(numero));
      });
    });
    
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      let processoCell = tr.querySelector('td[data-label="Processo"]');
      if (!processoCell) processoCell = tr.children[9];
      if (!processoCell) processoCell = tr.querySelector('td:last-child');
      
      let acompCell = tr.querySelector('td[data-label="Acompanhamento"]');
      if (!acompCell) acompCell = tr.children[4];
      if (!acompCell) {
        const headers = document.querySelectorAll('thead th');
        let acompIndex = -1;
        headers.forEach((th, i) => {
          if (th.textContent.toLowerCase().includes('acompanhamento')) {
            acompIndex = i;
          }
        });
        if (acompIndex >= 0) acompCell = tr.children[acompIndex];
      }
      
      if (!processoCell || !acompCell) return;
      
      let textoProcesso = processoCell.dataset.processoNumero || processoCell.textContent;
      textoProcesso = textoProcesso.replace('🔗', '').trim();
      const numero = normalizarNumero(textoProcesso);
      
      if (numero && numerosFalharam.has(numero)) {
        // Encontrar o erro específico para este lote
        const errorInfo = errosLotes.find(e => 
          e.lote.some(n => normalizarNumero(n) === numero)
        );
        
        if (errorInfo) {
          const codigoErro = errorInfo.httpStatus || (errorInfo.erro.message.match(/\d+/) || ['500'])[0];
          exibirErro(acompCell, codigoErro, errorInfo.erro.message);
        }
      }
    });
  }

  function exibirLoadingTodasCelulas() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    
    tbody.querySelectorAll('tr').forEach(tr => {
      let acompCell = tr.querySelector('td[data-label="Acompanhamento"]');
      if (!acompCell) acompCell = tr.children[4];
      if (!acompCell) {
        const headers = document.querySelectorAll('thead th');
        let acompIndex = -1;
        headers.forEach((th, i) => {
          if (th.textContent.toLowerCase().includes('acompanhamento')) {
            acompIndex = i;
          }
        });
        if (acompIndex >= 0) acompCell = tr.children[acompIndex];
      }
      
      if (acompCell) {
        // Verificar se há número de processo válido para esta linha
        let processoCell = tr.querySelector('td[data-label="Processo"]');
        if (!processoCell) processoCell = tr.children[9];
        if (!processoCell) processoCell = tr.querySelector('td:last-child');
        
        let temProcessoValido = false;
        if (processoCell) {
          let textoProcesso = processoCell.dataset.processoNumero || processoCell.textContent;
          textoProcesso = textoProcesso.replace('🔗', '').trim();
          const numero = normalizarNumero(textoProcesso);
          temProcessoValido = !!numero;
        }
        
        // Não sobrescrever células que já têm dados ou estão em erro
        if (!acompCell.dataset.fonteDados && !acompCell.dataset.statusCarregamento) {
          if (temProcessoValido) {
            exibirLoading(acompCell);
          } else {
            // Sem número de processo válido - exibir "*"
            acompCell.innerHTML = '<span class="text-muted">*</span>';
            acompCell.dataset.statusCarregamento = 'sem-processo';
          }
        }
      }
    });
  }

  async function atualizarAcompanhamento() {
    const numeros = coletarNumerosDaTabela();
    if (window._acompanhamentoDebug) console.log('[Acompanhamento] numeros coletados', numeros);
    const hash = hashLista(numeros);
    if (hash && hash === ultimaExecucaoHash) {
      // Apenas re-aplica (ex: tabela reordenada ou filtros) sem refetch
      aplicarDadosNaTabela();
      return;
    }
    ultimaExecucaoHash = hash;
    if (!numeros.length) {
      if (window._acompanhamentoDebug) console.warn('[Acompanhamento] Nenhum número coletado.');
      return;
    }
    
    // Exibir loading em todas as células de acompanhamento
    exibirLoadingTodasCelulas();
    
    try {
      const resultado = await buscarProcessos(numeros, { timeoutMs: 15000 });
      if (window._acompanhamentoDebug) console.log(`[Acompanhamento] Cache final: ${cacheProcessos.size} processos de ${numeros.length} solicitados`);
      
      // Aplicar dados nas células
      aplicarDadosNaTabela();
      
      // Aplicar erros nas células que falharam
      if (resultado && resultado.errosLotes && resultado.errosLotes.length > 0) {
        aplicarErrosNaTabela(resultado.errosLotes);
      }
      
      const algumPreenchido = Array.from(document.querySelectorAll('td[data-label="Acompanhamento"]'))
        .some(td => td.dataset.fonteDados === 'api' || td.dataset.statusCarregamento === 'erro');
      
      if (!algumPreenchido) {
        if (window._acompanhamentoDebug) console.warn('[Acompanhamento] Nenhuma célula preenchida. Nova tentativa em 3s.');
        scheduleUpdate(3000);
      }
    } catch (error) {
      console.error('[Acompanhamento] Erro geral na atualização:', error);
      
      // Em caso de erro geral, exibir erro em todas as células de loading
      const tbody = document.querySelector('#detalhes table tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
          let acompCell = tr.querySelector('td[data-label="Acompanhamento"]');
          if (!acompCell) acompCell = tr.children[4];
          if (!acompCell) {
            const headers = document.querySelectorAll('thead th');
            let acompIndex = -1;
            headers.forEach((th, i) => {
              if (th.textContent.toLowerCase().includes('acompanhamento')) {
                acompIndex = i;
              }
            });
            if (acompIndex >= 0) acompCell = tr.children[acompIndex];
          }
          
          if (acompCell && acompCell.dataset.statusCarregamento === 'loading') {
            exibirErro(acompCell, 'REDE', 'Falha de conexão');
          }
        });
      }
    }
  }

  // Debounce para evitar múltiplas chamadas seguidas quando a tabela é recarregada rapidamente
  let debounceId = null;
  function scheduleUpdate(delay=300) {
    clearTimeout(debounceId);
    debounceId = setTimeout(()=>{
      atualizarAcompanhamento().catch(e=>console.error('AcompanhamentoProcessos: falha atualização', e));
    }, delay);
  }

  // Inicializar estilos quando o DOM estiver carregado
  document.addEventListener('DOMContentLoaded', function() {
    applyTempoAcompanhamentoStyles();
  });

  // Aplicar também quando a página for carregada (caso DOMContentLoaded já tenha passado)
  if (document.readyState !== 'loading') {
    applyTempoAcompanhamentoStyles();
  }

  document.addEventListener('tabela-carregada', () => scheduleUpdate(400));
  if (document.readyState !== 'loading') {
    if (document.querySelector('#detalhes table tbody tr')) scheduleUpdate(800);
  }
  // Caso haja atualizações de filtros que apenas ocultem/mostrem linhas, podemos observar mutações.
  const observer = new MutationObserver(muts => {
    if (muts.some(m=>m.type==='childList')) scheduleUpdate(800);
  });
  document.addEventListener('DOMContentLoaded', ()=>{
    const tbody = document.querySelector('#detalhes table tbody');
    if (tbody) observer.observe(tbody, { childList: true });
  });

  // Expor função manual
  window.atualizarAcompanhamentoProcessos = atualizarAcompanhamento;
  
  // Expor função de debug
  window.debugAcompanhamentoDetalhado = debugDetalhado;
  
  // Função para testar loading e erros
  window.testarLoadingEErros = function() {
    console.log('🧪 TESTANDO LOADING E TRATAMENTO DE ERROS');
    
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) {
      console.log('❌ Tbody não encontrado');
      return;
    }
    
    const celulasAcompanhamento = tbody.querySelectorAll('tr').slice(0, 4);
    
    celulasAcompanhamento.forEach((tr, index) => {
      let acompCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
      if (acompCell) {
        switch(index) {
          case 0:
            console.log('✨ Testando loading na primeira célula');
            exibirLoading(acompCell);
            break;
          case 1:
            console.log('⚠️ Testando erro 500 na segunda célula');
            exibirErro(acompCell, '500', 'Erro interno do servidor');
            break;
          case 2:
            console.log('🔌 Testando erro de rede na terceira célula');
            exibirErro(acompCell, 'REDE', 'Falha de conexão');
            break;
          case 3:
            console.log('⭐ Testando células sem processo (asterisco) na quarta célula');
            acompCell.innerHTML = '<span class="text-muted">*</span>';
            acompCell.dataset.statusCarregamento = 'sem-processo';
            break;
        }
      }
    });
    
    console.log('🔄 Aguarde 3 segundos para limpar os testes...');
    setTimeout(() => {
      celulasAcompanhamento.forEach(tr => {
        let acompCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
        if (acompCell) {
          limparStatusCarregamento(acompCell);
          acompCell.innerHTML = acompCell.dataset.originalAcompanhamento || '';
        }
      });
      console.log('✅ Testes finalizados');
    }, 3000);
  };
  
  // Função para testar requisição individual
  window.testarAPIIndividual = async function(numerosProcesso = ['06763/2025-0']) {
    console.log('🧪 TESTANDO REQUISIÇÃO INDIVIDUAL À API');
    console.log('Números a testar:', numerosProcesso);
    
    try {
      const resultado = await buscarProcessosLote(numerosProcesso);
      console.log('✅ Requisição bem-sucedida:', resultado);
      return resultado;
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      return null;
    }
  };
  
  // Função para testar as tags de tempo coloridas
  window.testarTagsTempoAcompanhamento = function() {
    console.log('🧪 TESTANDO TAGS DE TEMPO COLORIDAS');
    
    // Aplicar estilos (caso ainda não tenham sido aplicados)
    applyTempoAcompanhamentoStyles();
    
    // Criar container de teste
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:10px;right:10px;background:white;border:2px solid blue;padding:15px;z-index:9999;max-width:300px;';
    container.innerHTML = `
      <h4>Teste Tags Tempo</h4>
      <p>3 dias: ${renderTempoAcompanhamentoTag(3)}</p>
      <p>10 dias: ${renderTempoAcompanhamentoTag(10)}</p>
      <p>20 dias: ${renderTempoAcompanhamentoTag(20)}</p>
      <p>45 dias: ${renderTempoAcompanhamentoTag(45)}</p>
      <p>Setor + Tag: ${formatar('Setor de Teste', 25)}</p>
      <button onclick="this.parentElement.remove()">Fechar</button>
    `;
    
    document.body.appendChild(container);
    
    console.log('✅ Container de teste adicionado à página');
    console.log('🔄 Testando função formatar():');
    console.log('- formatar("Setor A", 5):', formatar("Setor A", 5));
    console.log('- formatar("Setor B", 12):', formatar("Setor B", 12));
    console.log('- formatar("Setor C", 22):', formatar("Setor C", 22));
    console.log('- formatar("Setor D", 35):', formatar("Setor D", 35));
  };
  
  // Função para analisar estrutura completa da resposta
  window.analisarEstruturaAPI = async function(numerosProcesso = ['06763/2025-0']) {
    console.log('🔍 ANALISANDO ESTRUTURA COMPLETA DA API');
    
    try {
      const resultado = await buscarProcessosLote(numerosProcesso);
      console.log('📊 ESTRUTURA COMPLETA DA RESPOSTA:');
      console.log('Tipo do resultado:', typeof resultado);
      console.log('Chaves do resultado:', Object.keys(resultado));
      console.log('Conteúdo de data:', resultado.data);
      console.log('Tipo de data:', typeof resultado.data);
      
      if (resultado.data) {
        console.log('Chaves de data:', Object.keys(resultado.data));
        console.log('Conteúdo completo de data:', resultado.data);
        
        // Verificar se é array ou objeto
        if (Array.isArray(resultado.data)) {
          console.log('✅ data é um array com', resultado.data.length, 'itens');
          if (resultado.data.length > 0) {
            console.log('Primeiro item de data:', resultado.data[0]);
          }
        } else if (typeof resultado.data === 'object') {
          console.log('⚠️ data é um objeto, não um array');
          console.log('Propriedades de data:', Object.keys(resultado.data));
          
          // Procurar arrays dentro de data
          Object.keys(resultado.data).forEach(key => {
            const value = resultado.data[key];
            if (Array.isArray(value)) {
              console.log(`🎯 Encontrou array em data.${key} com ${value.length} itens`);
              if (value.length > 0) {
                console.log(`Primeiro item de data.${key}:`, value[0]);
              }
            }
          });
        }
      }
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      return null;
    }
  };
})();
