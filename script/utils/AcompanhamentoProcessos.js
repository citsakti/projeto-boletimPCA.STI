/**
 * AcompanhamentoProcessos.js
 *
 * Objetivo: Substituir o conteúdo da coluna "Acompanhamento" (antiga "Status Início")
 * exibindo: "<SETOR> - há <X> dia(s)" a partir dos dados da API de processos.
 *
 * Fluxo:
 *  1. Escuta o evento 'tabela-carregada' (disparado após montar a tabela)
 *  2. Coleta todos os números de processo da coluna "Processo" (última coluna)
 *  3. Faz requisições POR NÚMERO (POST) à API https://api-processos.tce.ce.gov.br/processos/porNumero
 *  4. Calcula diferença em dias entre hoje e dtUltimoEncaminhamento
 *  5. Atualiza a 5ª coluna (índice 4) de cada linha com o texto: "SETOR - há X dias"
 *
 * Observações:
 *  - Mantém valor original em data-original-acompanhamento (caso precise fallback)
 *  - Usa cache simples em memória para evitar requisições repetidas quando a tabela é recarregada
 *  - Disponibiliza window.atualizarAcompanhamentoProcessos() para chamadas manuais
 */

(function(){
  // Nova API por número (mesma do módulo DocumentosDoProcessso.js)
  const API_POR_NUMERO = 'https://api-processos.tce.ce.gov.br/processos/porNumero';
  const cacheProcessos = new Map(); // numero -> objeto retornado bruto (item.raw do módulo de documentos)
  let ultimaExecucaoHash = null;

  // Cache global compartilhado entre módulos (Acompanhamento e Documentos)
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) {
      window._processoPorNumeroCache = new Map();
    }
    return window._processoPorNumeroCache;
  }

  // Acessa o módulo de documentos se carregado, para reutilizar o cache e o fetch
  function getDocsModule() {
    return (window && window.debugDocumentosProcesso) ? window.debugDocumentosProcesso : null;
  }
  function getDocsCache() {
    const mod = getDocsModule();
    return mod && mod.cache ? mod.cache : null; // Map numero -> { raw, documentos, sigiloso }
  }
  function processarRespostaLocal(numero, data) {
    // Replica a lógica do módulo DocumentosDoProcessso.js
    let item = null;
    try {
      item = data && data.data && Array.isArray(data.data.lista) ? data.data.lista[0] : null;
    } catch(_) {}
    const documentosSessao = item && item.documentos ? item.documentos : null;
    const sigiloso = !documentosSessao;
    let documentos = [];
    if (documentosSessao) {
      const grupos = [
        documentosSessao.documentosPrincipal,
        documentosSessao.documentosApensados,
        documentosSessao.documentosJuntados,
        documentosSessao.documentosProtocolosJuntados,
        documentosSessao.documentoAgrupados
      ].filter(Array.isArray);
      documentos = grupos.flat();
    }
    return { raw: item || null, documentos, sigiloso };
  }
  async function fetchProcessoPorNumeroCompat(numero, { timeoutMs = 12000 } = {}) {
    const docsCache = getDocsCache();
    const num = normalizarNumero(numero);
    if (!num) return null;
    // 1) Tenta apenas CACHE do módulo de documentos, não o fetch dele
    if (docsCache && docsCache.has(num)) return docsCache.get(num);

    // Fallback local: realiza a mesma chamada e, se possível, sincroniza com o cache do módulo
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // A API requer JSON; usar application/json evita 415
      const resp = await fetch(API_POR_NUMERO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: num }),
        signal: controller.signal
      });
      if (!resp.ok) {
        if (resp.status === 400 || resp.status === 415 || resp.status === 500) {
          try {
            const resp2 = await fetch(API_POR_NUMERO, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nrProcesso: num }),
              signal: controller.signal
            });
            if (resp2.ok) {
              const data2 = await resp2.json();
              const result2 = processarRespostaLocal(num, data2);
              if (docsCache) docsCache.set(num, result2);
              return result2;
            }
          } catch(_) { /* ignore */ }
        }
        const t = await resp.text().catch(()=> '');
        const err = new Error(`HTTP ${resp.status} ${t || resp.statusText}`);
        err.httpStatus = resp.status;
        throw err;
      }
      const data = await resp.json();
      const result = processarRespostaLocal(num, data);
      if (docsCache) docsCache.set(num, result);
      return result;
    } finally {
      clearTimeout(to);
    }
  }

  async function buscarProcessos(numeros, opts={}) {
    // Evitar refetch: usa cache local e o cache do módulo de documentos
    const docsCache = getDocsCache();
    const shared = getSharedProcessCache();
    const faltantes = numeros.filter(n => {
      const num = normalizarNumero(n);
      if (!num) return false;
      if (cacheProcessos.has(num)) return false;
      if (docsCache && docsCache.has(num)) return false; // já disponível para reaproveitar
      if (shared && shared.has(num)) return false; // já baixado globalmente
      return true;
    });

    const errosLotes = [];

    // Busca concorrente por número (rápido e mais leve na API)
    const maxConc = 5;
    let idx = 0;
  async function worker() {
      while (idx < faltantes.length) {
        const i = idx++;
        const numero = normalizarNumero(faltantes[i]);
        if (!numero) continue;
        try {
          const res = await fetchProcessoPorNumeroCompat(numero, opts);
      // Preenche cache local imediatamente
      const raw = res && res.raw ? res.raw : null;
          if (raw) {
            cacheProcessos.set(numero, raw);
            try { getSharedProcessCache().set(numero, res); } catch(_) {}
          }
        } catch (err) {
          // Registrar erro no formato compatível com aplicarErrosNaTabela
          errosLotes.push({ lote: [numero], erro: err, httpStatus: err && err.httpStatus ? err.httpStatus : null });
        }
      }
    }
    const workers = Array.from({ length: Math.min(maxConc, faltantes.length || 0) }, () => worker());
    await Promise.all(workers);

    // Popular o cache local a partir do cache compartilhado (ou reaproveitar se já estiver lá)
  const origem = getDocsCache() || getSharedProcessCache();
    numeros.forEach(num => {
      const n = normalizarNumero(num);
      if (!n) return;
      if (cacheProcessos.has(n)) return;
      let raw = null;
      if (origem && origem.has(n)) {
        const entry = origem.get(n);
        raw = entry && entry.raw ? entry.raw : null;
      }
      if (raw) {
        cacheProcessos.set(n, raw);
      }
    });

    if (window._acompanhamentoDebug) {
      console.log(`[Acompanhamento] Cache local preenchido: ${cacheProcessos.size} processos`);
    }

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

  // Retorna a data de hoje no formato dd/mm/aaaa
  function getHojeBR() {
    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, '0');
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const aaaa = hoje.getFullYear();
    return `${dd}/${mm}/${aaaa}`;
  }

  // Conta quantos trâmites ocorreram hoje (baseado no array dado.tramites)
  function contarTramitesHoje(dadoRaw) {
    try {
      const tramites = Array.isArray(dadoRaw?.tramites) ? dadoRaw.tramites : [];
      if (!tramites.length) return 0;
      const hoje = getHojeBR();
      return tramites.reduce((acc, t) => acc + (String(t?.data).trim() === hoje ? 1 : 0), 0);
    } catch (_) {
      return 0;
    }
  }

  function formatar(setorDesc, dias, repeticoesHoje = 0) {
    if (!setorDesc) return '';
    if (dias == null) return setorDesc;
    
    // Usar tag estilizada para os dias
  const tagDias = renderTempoAcompanhamentoTag(dias, repeticoesHoje);
  // Exibir a tag em uma linha abaixo do texto do setor
  return `${setorDesc}<div class="tempo-acompanhamento-wrapper">${tagDias}</div>`;
  }

  /**
   * Renderiza tag de tempo com classificação por cor (baseado em AnalyticsTempoSetor.js)
   * @param {number} dias - Número de dias
   * @returns {string} - HTML da tag formatada com classificação
   */
  function renderTempoAcompanhamentoTag(dias, repeticoesHoje = 0) {
    if (dias === null || dias === undefined || dias < 0) {
      return '';
    }
    
  // Mostrar "Hoje" quando dias === 0
  const isHoje = dias === 0;
  const plural = dias === 1 ? 'dia' : 'dias';
  const textoHoje = repeticoesHoje > 1 ? `Hoje - ${repeticoesHoje}x` : 'Hoje';
  const textoTag = isHoje ? textoHoje : `${dias} ${plural}`;
  const tooltip = isHoje ? `${textoHoje} no setor atual` : `Há ${textoTag} no setor atual`;
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
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
      margin-left: 0;
            border: 1px solid #90caf9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: default;
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
      // Conta tramitações de hoje, se aplicável
      const repeticoesHoje = dias === 0 ? contarTramitesHoje(dado) : 0;
      
      // Preservar valor original
      if (!acompCell.dataset.originalAcompanhamento) {
        acompCell.dataset.originalAcompanhamento = acompCell.textContent.trim();
      }
      
      // Se o status for RENOVADO ✅ ou CONTRATADO ✅, exibir apenas o setor sem a tag de tempo
      const texto = isStatusCompleto ? 
        (setorDesc || null) : 
        (formatar(setorDesc, dias, repeticoesHoje) || (setorDesc ? setorDesc : null));
      
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
    console.log('🧪 TESTANDO REQUISIÇÃO POR NÚMERO (porNumero)');
    console.log('Números a testar:', numerosProcesso);
    const resultados = new Map();
    for (const n of numerosProcesso) {
      try {
        const res = await fetchProcessoPorNumeroCompat(n);
        resultados.set(n, res);
        console.log(`✅ ${n}:`, res);
      } catch (error) {
        resultados.set(n, { erro: String(error) });
        console.error(`❌ ${n}:`, error);
      }
    }
    return resultados;
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
    console.log('🔍 ANALISANDO ESTRUTURA COMPLETA DA RESPOSTA (porNumero)');
    try {
      const res = await fetchProcessoPorNumeroCompat(numerosProcesso[0]);
      console.log('📊 Estrutura do objeto retornado:', {
        chaves: res ? Object.keys(res) : null,
        temRaw: !!(res && res.raw),
        temDocumentos: !!(res && Array.isArray(res.documentos)),
        sigiloso: !!(res && res.sigiloso)
      });
      if (res && res.raw) {
        console.log('🔎 Estrutura de raw:', {
          chaves: Object.keys(res.raw || {}),
          setor: res.raw?.setor,
          dtUltimoEncaminhamento: res.raw?.dtUltimoEncaminhamento,
          exemplo: res.raw
        });
      }
      return res;
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      return null;
    }
  };
})();
