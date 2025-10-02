/**
 * AnalyticsPareceresAnalista.js
 * 
 * Objetivo:
 *  - Construir a subseção 3.4 Pareceres por Analista na Análise Situacional
 *  - Agrupar pareceres jurídicos por analista que assinou
 *  - Quando um parecer tem múltiplos assinantes, conta para todos
 *  - Renderizar sob demanda (botão) pois requer buscar assinaturas via API
 *  - Reutilizar estrutura visual do AnalyticsProcessosPorSetor.js
 * 
 * Estratégia:
 *  1. Aproveitar dados já processados pelo AnalyticsPareceresJuridicos.js
 *  2. Buscar assinaturas de cada parecer via API
 *  3. Agrupar por analista (um parecer conta para todos os assinantes)
 *  4. Renderizar em formato de boxes expansíveis (igual 3.2 Processos por Setor)
 */
(function(){
  const SUBSECTION_ID = 'pareceres-analista-subsection';
  const CONTAINER_ID = 'pareceres-analista-container';
  // API correta de assinaturas (igual ao AnalyticsPareceresJuridicosTag.js)
  const API_ASSINATURAS = 'https://api-processos.tce.ce.gov.br/documento/assinaturas?documento_id=';
  const DEBUG_ANALISTA = true;
  
  // Configurações de retry
  const MAX_RETRIES = 3; // Número máximo de tentativas
  const RETRY_DELAY = 2000; // Delay entre tentativas em ms (2 segundos)

  // Cache para assinaturas e estado de carregamento
  const assinaturasCache = new Map(); // numeroProcesso-idDocumento -> assinaturas[]
  const analistas = new Map(); // nomeAnalista -> projetos[]
  const documentosFalhados = new Map(); // idDocumento -> { numeroProcesso, projeto, parecer, tentativas }
  
  let estadoCarregamento = {
    carregado: false,
    carregando: false,
    erro: false,
    mensagemErro: ''
  };

  function getSelectedYear(){
    if (window.getSelectedYear) return window.getSelectedYear();
    try { const y = localStorage.getItem('selectedYear'); if (y) return y; } catch(_){}
    return new Date().getFullYear().toString();
  }

  function getSharedProcessCache(){
    if (!window._processoPorNumeroCache) window._processoPorNumeroCache = new Map();
    return window._processoPorNumeroCache;
  }

  function normalizarNumero(raw){
    return String(raw||'').replace(/[^0-9./-]/g,'').trim();
  }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[s]));
  }

  /**
   * Coleta projetos com parecer do cache já processado
   */
  function coletarProjetosComParecer(){
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Coletando projetos com parecer...');
    
    const cache = getSharedProcessCache();
    const year = getSelectedYear();
    const projetos = [];
    
    // Buscar todos os projetos do analyticData
    if (!analyticData || !Array.isArray(analyticData.todosProjetos)) {
      console.warn('[PareceresAnalista] analyticData.todosProjetos não disponível');
      return [];
    }
    
    analyticData.todosProjetos.forEach(p => {
      if (!p.numProcesso) return;
      
      const numeroProcesso = normalizarNumero(p.numProcesso);
      const entry = cache.get(numeroProcesso);
      
      if (!entry || !Array.isArray(entry.documentos)) return;
      
      // Extrair pareceres jurídicos
      const pareceres = [];
      entry.documentos.forEach(doc => {
        try {
          const camposPossiveis = [
            doc?.tipoAtoDocumento?.descricao,
            doc?.tipoAtoDocumento?.sigla,
            doc?.tipoAto?.descricao,
            doc?.tipo,
            doc?.descricao,
            doc?.titulo,
            doc?.nome
          ].filter(Boolean);
          const combinado = camposPossiveis.join(' | ');
          const norm = combinado.normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase();
          
          if (norm.includes('PARECER') && norm.includes('JURID')) {
            const ano = doc.ano ? String(doc.ano) : extrairAnoDaData(doc.dataFinalizacao);
            
            // Filtro por ano para renovações
            const tipo = p.tipo || inferirTipoPeloStatus(p.status) || '🛒 Aquisição';
            if (tipo === '🔄 Renovação' && ano !== year) {
              return; // Skip este parecer
            }
            
            pareceres.push({
              idDocumento: doc.id || doc.idDocumento,
              descricao: combinado,
              dataFinalizacao: doc.dataFinalizacao || '',
              ano: ano
            });
          }
        } catch(e) {
          if (DEBUG_ANALISTA) console.warn('[PareceresAnalista] Erro ao processar documento:', e);
        }
      });
      
      if (pareceres.length > 0) {
        projetos.push({
          id: p.idPca || p.id || '',
          area: p.area || '',
          objeto: p.projeto || p.objeto || '',
          valor: p.valor || 0,
          contratar_ate: p.dataProcesso || p.contratar_ate || '',
          numeroProcesso: numeroProcesso,
          tipo: p.tipo || inferirTipoPeloStatus(p.status) || '🛒 Aquisição',
          status: p.status || '',
          orcamento: p.orcamento || '',
          modalidadeX: p.modalidadeX || '',
          numeroY: p.numeroY || '',
          numeroContrato: p.numeroContrato || '',
          numeroRegistro: p.numeroRegistro || '',
          pareceres: pareceres
        });
      }
    });
    
    if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] ${projetos.length} projetos com parecer encontrados`);
    return projetos;
  }

  function ehStr(v){ return typeof v === 'string'; }
  
  function inferirTipoPeloStatus(status){
    if (!ehStr(status)) return null;
    if (status.includes('RENOVA')) return '🔄 Renovação';
    return '🛒 Aquisição';
  }
  
  function extrairAnoDaData(str){
    if (!str) return null;
    const m = str.match(/(\d{4})/);
    return m ? m[1] : null;
  }

  /**
   * Busca assinaturas de um parecer específico com retry automático
   * Usa a mesma API e estrutura do AnalyticsPareceresJuridicosTag.js
   */
  async function buscarAssinaturas(numeroProcesso, idDocumento, tentativa = 1){
    if (!idDocumento) {
      if (DEBUG_ANALISTA) console.warn('[PareceresAnalista] ID do documento não fornecido');
      return [];
    }
    
    const cacheKey = `${numeroProcesso}-${idDocumento}`;
    if (assinaturasCache.has(cacheKey)) {
      if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Retornando assinaturas do cache para documento', idDocumento);
      return assinaturasCache.get(cacheKey);
    }
    
    try {
      // URL correta: API_ASSINATURAS + idDocumento
      const url = API_ASSINATURAS + encodeURIComponent(idDocumento);
      
      if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Tentativa ${tentativa}/${MAX_RETRIES} - Buscando assinaturas:`, url);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const resp = await fetch(url, { 
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal 
      });
      
      clearTimeout(timeout);
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} para documento ${idDocumento}`);
      }
      
      const data = await resp.json();
      
      if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Resposta da API:', data);
      
      // Estrutura de resposta (seguindo AnalyticsPareceresJuridicosTag.js):
      // Pode ser { assinaturas: [...] } ou array direto
      let assinaturas = [];
      if (data && Array.isArray(data.assinaturas)) {
        assinaturas = data.assinaturas;
      } else if (Array.isArray(data)) {
        assinaturas = data;
      }
      
      // Processar assinaturas para extrair nome, cargo e data
      const assinaturasProcessadas = assinaturas.map(ass => ({
        nome: ass?.nome || ass?.pessoa?.nome || 'Desconhecido',
        cargo: ass?.cargo || ass?.pessoa?.cargo || '',
        dataAssinatura: ass?.dataAssinatura || ''
      }));
      
      if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] ✅ ${assinaturasProcessadas.length} assinaturas encontradas para documento ${idDocumento}`);
      
      assinaturasCache.set(cacheKey, assinaturasProcessadas);
      return assinaturasProcessadas;
      
    } catch(e) {
      const isTimeout = e.name === 'AbortError';
      const errorMsg = isTimeout ? 'Timeout' : e.message;
      
      console.warn(`[PareceresAnalista] ⚠️ Tentativa ${tentativa}/${MAX_RETRIES} falhou para documento ${idDocumento}: ${errorMsg}`);
      
      // Se ainda há tentativas restantes, tentar novamente
      if (tentativa < MAX_RETRIES) {
        console.log(`[PareceresAnalista] 🔄 Aguardando ${RETRY_DELAY}ms antes de tentar novamente...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        return buscarAssinaturas(numeroProcesso, idDocumento, tentativa + 1);
      }
      
      // Esgotadas todas as tentativas
      console.error(`[PareceresAnalista] ❌ Todas as ${MAX_RETRIES} tentativas falharam para documento ${idDocumento}`);
      
      // Registrar documento falhado para retry posterior
      documentosFalhados.set(idDocumento, {
        numeroProcesso,
        idDocumento,
        tentativas: MAX_RETRIES,
        ultimoErro: errorMsg,
        timestamp: Date.now()
      });
      
      return [];
    }
  }

  /**
   * Função principal para iniciar carregamento (chamada pelo botão)
   */
  async function iniciarCarregamentoAnalistas() {
    const button = document.getElementById('btn-gerar-pareceres-analista');
    const container = document.getElementById(CONTAINER_ID);
    
    if (!button || !container) {
      console.error('[PareceresAnalista] Elementos não encontrados');
      return;
    }
    
    if (estadoCarregamento.carregando) {
      console.log('[PareceresAnalista] Carregamento já em andamento...');
      return;
    }
    
    // Atualizar estado
    estadoCarregamento.carregando = true;
    estadoCarregamento.erro = false;
    estadoCarregamento.mensagemErro = '';
    
    // Limpar dados anteriores
    if (estadoCarregamento.carregado) {
      console.log('[PareceresAnalista] Limpando dados anteriores...');
      assinaturasCache.clear();
      analistas.clear();
      documentosFalhados.clear();
    }
    
    // Atualizar UI
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Carregando...';
    
    container.innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm me-3" role="status">
            <span class="visually-hidden">Carregando...</span>
          </div>
          <div>
            <strong>Buscando assinaturas dos pareceres jurídicos...</strong>
            <br>
            <small id="status-progresso">Iniciando processamento...</small>
          </div>
        </div>
      </div>
    `;
    
    try {
      console.log('🚀 [PareceresAnalista] Iniciando processamento...');
      
      // Executar processamento
      await processarPareceresAnalistas();
      
      // Sucesso
      estadoCarregamento.carregado = true;
      estadoCarregamento.carregando = false;
      
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Atualizar Informação';
      button.className = 'btn btn-success';
      
      console.log('✅ [PareceresAnalista] Dados carregados com sucesso');
      
    } catch (error) {
      console.error('❌ [PareceresAnalista] Erro ao carregar dados:', error);
      
      estadoCarregamento.carregando = false;
      estadoCarregamento.erro = true;
      estadoCarregamento.mensagemErro = error.message || 'Erro desconhecido';
      
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Regerar Informação';
      button.className = 'btn btn-warning';
      
      container.innerHTML = `
        <div class="alert alert-danger">
          <div class="d-flex align-items-start">
            <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <strong>Erro ao carregar dados</strong>
              <p class="mb-2 mt-1">${estadoCarregamento.mensagemErro}</p>
              <small class="text-muted">
                Clique no botão "Regerar Informação" acima para tentar novamente.
              </small>
            </div>
          </div>
        </div>
      `;
    }
  }


  /**
   * Processa pareceres e agrupa por analista
   */
  async function processarPareceresAnalistas() {
    console.log('[PareceresAnalista] Processando pareceres e agrupando por analista...');
    
    // Limpar dados anteriores
    analistas.clear();
    
    // Coletar projetos com parecer
    const projetos = coletarProjetosComParecer();
    
    if (!projetos.length) {
      throw new Error('Nenhum projeto com parecer jurídico encontrado');
    }
    
    console.log(`[PareceresAnalista] Processando ${projetos.length} projetos com parecer...`);
    
    let totalPareceresProcessados = 0;
    let pareceresComAssinatura = 0;
    let pareceresSemAssinatura = 0;
    
    // Processar cada projeto
    for (let i = 0; i < projetos.length; i++) {
      const projeto = projetos[i];
      
      // Atualizar status a cada 5 projetos
      if ((i + 1) % 5 === 0 || i === projetos.length - 1) {
        const statusEl = document.getElementById('status-progresso');
        if (statusEl) {
          statusEl.textContent = `Processando projeto ${i + 1}/${projetos.length}... (${totalPareceresProcessados} pareceres, ${pareceresComAssinatura} com assinatura)`;
        }
      }
      
      if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Processando projeto ${projeto.id} - ${projeto.objeto.substring(0, 50)}...`);
      
      // Processar cada parecer do projeto
      for (const parecer of projeto.pareceres) {
        if (!parecer.idDocumento) {
          console.warn(`[PareceresAnalista] Parecer sem ID no processo ${projeto.numeroProcesso}:`, parecer);
          continue;
        }
        
        if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Buscando assinaturas do parecer ${parecer.idDocumento} do processo ${projeto.numeroProcesso}`);
        
        // Buscar assinaturas
        const assinaturas = await buscarAssinaturas(projeto.numeroProcesso, parecer.idDocumento);
        totalPareceresProcessados++;
        
        if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Assinaturas encontradas:`, assinaturas);
        
        if (!assinaturas.length) {
          pareceresSemAssinatura++;
          if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Parecer ${parecer.idDocumento} sem assinatura - agrupando em "Sem Assinante Identificado"`);
          
          // Agrupar em "Sem Assinante Identificado"
          const nomeAnalista = 'Sem Assinante Identificado';
          if (!analistas.has(nomeAnalista)) {
            analistas.set(nomeAnalista, []);
          }
          analistas.get(nomeAnalista).push({
            ...projeto,
            parecerInfo: parecer
          });
          continue;
        }
        
        pareceresComAssinatura++;
        
        if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Adicionando parecer para ${assinaturas.length} analistas:`, assinaturas.map(a => a.nome));
        
        // Adicionar para cada assinante (um parecer conta para todos)
        for (const assinante of assinaturas) {
          const nomeAnalista = assinante.nome || 'Desconhecido';
          if (!analistas.has(nomeAnalista)) {
            analistas.set(nomeAnalista, []);
          }
          
          // Verificar se já não foi adicionado (evitar duplicatas do mesmo projeto/parecer)
          const lista = analistas.get(nomeAnalista);
          const jaExiste = lista.some(p => 
            p.numeroProcesso === projeto.numeroProcesso && 
            p.parecerInfo?.idDocumento === parecer.idDocumento
          );
          
          if (!jaExiste) {
            lista.push({
              ...projeto,
              parecerInfo: parecer,
              assinantes: assinaturas
            });
            if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Parecer adicionado para analista: ${nomeAnalista}`);
          } else {
            if (DEBUG_ANALISTA) console.log(`[PareceresAnalista] Parecer já existe para analista: ${nomeAnalista}, pulando duplicata`);
          }
        }
      }
      
      // Delay pequeno para não sobrecarregar a API
      if (i < projetos.length - 1) {
        await new Promise(r => setTimeout(r, 150)); // Aumentei de 100ms para 150ms
      }
    }
    
    console.log(`[PareceresAnalista] Processamento concluído:`);
    console.log(`  - Total de pareceres: ${totalPareceresProcessados}`);
    console.log(`  - Com assinatura: ${pareceresComAssinatura}`);
    console.log(`  - Sem assinatura: ${pareceresSemAssinatura}`);
    console.log(`  - Analistas identificados: ${analistas.size}`);
    
    // Log detalhado dos analistas
    if (DEBUG_ANALISTA) {
      console.log('[PareceresAnalista] Detalhamento por analista:');
      analistas.forEach((projetos, nomeAnalista) => {
        console.log(`  - ${nomeAnalista}: ${projetos.length} parecer(es)`);
      });
    }
    
    // Renderizar seção
    renderAnalistasSection();
  }

  /**
   * Função para tentar novamente buscar assinaturas dos documentos que falharam
   */
  async function retryDocumentosFalhados() {
    if (documentosFalhados.size === 0) {
      console.log('[PareceresAnalista] Nenhum documento falhado para tentar novamente');
      return;
    }
    
    const button = document.getElementById('btn-retry-falhados');
    const statusDiv = document.getElementById('retry-status');
    
    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Reprocessando...';
    }
    
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="alert alert-info mt-2">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Tentando recuperar ${documentosFalhados.size} documento(s) que falharam...
        </div>
      `;
    }
    
    console.log(`[PareceresAnalista] 🔄 Iniciando retry de ${documentosFalhados.size} documentos falhados`);
    
    const documentosParaRetentar = Array.from(documentosFalhados.values());
    let sucessos = 0;
    let falhas = 0;
    
    for (const doc of documentosParaRetentar) {
      console.log(`[PareceresAnalista] Retentando documento ${doc.idDocumento}...`);
      
      // Tentar buscar novamente (começa da tentativa 1 novamente)
      const assinaturas = await buscarAssinaturas(doc.numeroProcesso, doc.idDocumento, 1);
      
      if (assinaturas && assinaturas.length > 0) {
        // Sucesso! Remover da lista de falhados
        documentosFalhados.delete(doc.idDocumento);
        sucessos++;
        console.log(`[PareceresAnalista] ✅ Documento ${doc.idDocumento} recuperado com sucesso`);
      } else {
        falhas++;
        console.log(`[PareceresAnalista] ❌ Documento ${doc.idDocumento} ainda falhou`);
      }
      
      // Delay entre requisições
      if (documentosParaRetentar.indexOf(doc) < documentosParaRetentar.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
    console.log(`[PareceresAnalista] Retry concluído: ${sucessos} sucessos, ${falhas} falhas`);
    
    // Reprocessar e renderizar novamente se houve sucessos
    if (sucessos > 0) {
      console.log('[PareceresAnalista] Reprocessando dados com novas assinaturas...');
      
      // Limpar analistas e reprocessar
      analistas.clear();
      const projetos = coletarProjetosComParecer();
      
      for (const projeto of projetos) {
        for (const parecer of projeto.pareceres) {
          if (!parecer.idDocumento) continue;
          
          const cacheKey = `${projeto.numeroProcesso}-${parecer.idDocumento}`;
          const assinaturas = assinaturasCache.get(cacheKey);
          
          if (!assinaturas || assinaturas.length === 0) {
            // Sem assinatura
            const nomeAnalista = 'Sem Assinante Identificado';
            if (!analistas.has(nomeAnalista)) {
              analistas.set(nomeAnalista, []);
            }
            analistas.get(nomeAnalista).push({
              ...projeto,
              parecerInfo: parecer
            });
          } else {
            // Com assinaturas
            for (const assinante of assinaturas) {
              const nomeAnalista = assinante.nome || 'Desconhecido';
              if (!analistas.has(nomeAnalista)) {
                analistas.set(nomeAnalista, []);
              }
              
              const lista = analistas.get(nomeAnalista);
              const jaExiste = lista.some(p => 
                p.numeroProcesso === projeto.numeroProcesso && 
                p.parecerInfo?.idDocumento === parecer.idDocumento
              );
              
              if (!jaExiste) {
                lista.push({
                  ...projeto,
                  parecerInfo: parecer,
                  assinantes: assinaturas
                });
              }
            }
          }
        }
      }
      
      renderAnalistasSection();
    }
    
    // Atualizar UI do botão
    if (documentosFalhados.size > 0) {
      if (button) {
        button.disabled = false;
        button.innerHTML = `<i class="bi bi-arrow-clockwise me-2"></i>Tentar Novamente (${documentosFalhados.size})`;
      }
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="alert alert-warning mt-2">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Resultado:</strong> ${sucessos} recuperado(s), ${falhas} ainda com erro.
            <br><small>Ainda restam ${documentosFalhados.size} documento(s) com problemas.</small>
          </div>
        `;
      }
    } else {
      // Todos recuperados!
      if (button) {
        button.remove();
      }
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="alert alert-success mt-2">
            <i class="bi bi-check-circle me-2"></i>
            Todos os documentos foram recuperados com sucesso!
          </div>
        `;
        setTimeout(() => statusDiv.remove(), 5000);
      }
    }
  }


  /**
   * Renderiza a seção de analistas (estilo 3.2 Processos por Setor)
   */
  function renderAnalistasSection() {
    console.log('[PareceresAnalista] Renderizando seção...');
    
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.error('[PareceresAnalista] Container não encontrado');
      return;
    }
    
    // Limpar e adicionar conteúdo
    container.innerHTML = renderAnalistasHtml();
    
    // Adicionar botão de retry se houver documentos falhados
    if (documentosFalhados.size > 0) {
      const retrySection = document.createElement('div');
      retrySection.className = 'retry-section mb-4';
      retrySection.innerHTML = `
        <div class="alert alert-warning">
          <div class="d-flex align-items-start">
            <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div class="flex-grow-1">
              <strong>Atenção: ${documentosFalhados.size} documento(s) não puderam ser baixados</strong>
              <p class="mb-2 mt-1">Algumas assinaturas não foram recuperadas devido a falhas na API.</p>
              <button class="btn btn-warning btn-sm" id="btn-retry-falhados">
                <i class="bi bi-arrow-clockwise me-2"></i>Tentar Novamente (${documentosFalhados.size})
              </button>
              <div id="retry-status"></div>
            </div>
          </div>
        </div>
      `;
      container.insertBefore(retrySection, container.firstChild);
      
      // Adicionar event listener ao botão de retry
      const btnRetry = document.getElementById('btn-retry-falhados');
      if (btnRetry) {
        btnRetry.addEventListener('click', retryDocumentosFalhados);
      }
    }
    
    // Configurar event listeners
    addAnalistasExpandListeners();
    
    // Habilitar TableSorter
    if (typeof window.enableTableSorting === 'function') {
      window.enableTableSorting(container);
    }
    
    // Configurar tooltips
    if (typeof window.setupAnalyticsTooltips === 'function') {
      setTimeout(() => window.setupAnalyticsTooltips(), 50);
    }
    
    // Inicializar tags de parecer
    if (typeof window.initPareceresJuridicosTag === 'function') {
      setTimeout(() => window.initPareceresJuridicosTag(), 100);
    }
    
    console.log('[PareceresAnalista] Seção renderizada com sucesso');
  }

  /**
   * Gera HTML para os analistas (estilo boxes expansíveis)
   */
  function renderAnalistasHtml() {
    if (analistas.size === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Nenhum dado de analista disponível. Clique no botão acima para gerar.
        </div>
      `;
    }
    
    // Ordenar analistas por quantidade (decrescente)
    const analistasOrdenados = Array.from(analistas.entries())
      .sort((a, b) => b[1].length - a[1].length);
    
    return analistasOrdenados.map(([nomeAnalista, projetos], index) => {
      const analistaSafe = nomeAnalista.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const quantidade = projetos.length;
      
      return `
        <div class="setor-box mb-4" data-analista="${analistaSafe}">
          <div class="setor-header">
            <div class="setor-info">
              <div class="setor-nome">
                <i class="bi bi-person-badge me-2"></i>${escapeHtml(nomeAnalista)}
              </div>
              <div class="setor-count">${quantidade} Parecer${quantidade !== 1 ? 'es' : ''}</div>
            </div>
            <button class="btn btn-outline-primary btn-sm setor-expand-btn" 
                    data-analista="${analistaSafe}"
                    data-analista-nome="${escapeHtml(nomeAnalista)}">
              <i class="bi bi-chevron-down"></i> Expandir
            </button>
          </div>
          <div class="setor-details" id="analista-details-${analistaSafe}" style="display: none;">
            <div class="card mt-2">
              <div class="card-body">
                <div class="table-responsive setores-table">
                  ${renderAnalistaProjetosTable(projetos)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Gera tabela de projetos para um analista específico
   */
  function renderAnalistaProjetosTable(projetos) {
    if (projetos.length === 0) {
      return '<div class="alert alert-warning">Nenhum projeto encontrado para este analista.</div>';
    }
    
    return `
      <table class="table table-striped table-hover project-details-table">
        <thead class="table-dark">
          <tr>
            <th>ID PCA</th>
            <th style="width: 1%; white-space: nowrap;">Área</th>
            <th style="width: 1%; white-space: nowrap;">Tipo</th>
            <th>Projeto</th>
            <th style="width: 1%; white-space: nowrap;">Status do Processo</th>
            <th style="width: 1%; white-space: nowrap;">Contratar Até</th>
            <th style="width: 1%; white-space: nowrap;">Valor PCA</th>
            <th style="width: 1%; white-space: nowrap;">Orçamento</th>
            <th style="width: 1%; white-space: nowrap;">Processo</th>
          </tr>
        </thead>
        <tbody>
          ${projetos.map(projeto => renderAnalistaProjetoRow(projeto)).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Renderiza uma linha da tabela de projetos do analista
   */
  function renderAnalistaProjetoRow(projeto) {
    // Preparar atributos de contrato para a célula do projeto
    let contratoAttrs = '';
    if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
      contratoAttrs += ` data-contrato="${escapeHtml(String(projeto.numeroContrato).trim())}"`;
    }
    if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
      contratoAttrs += ` data-registro="${escapeHtml(String(projeto.numeroRegistro).trim())}"`;
    }
    
    // Preparar dados para célula de processo no padrão global (renderProcessCell)
    let htmlProcessoCell;
    let htmlProjetoCell;
    try {
      const numeroProc = projeto.numeroProcesso || '';
      const numeroNormalizado = normalizarNumero(numeroProc);
      const cache = getSharedProcessCache();
      const dadosAPI = cache.get(numeroNormalizado);
      const modalidadeX = (dadosAPI?.modalidade || projeto.modalidadeX || projeto.modalidade || projeto.tipo || '').toString();
      const numeroY = (dadosAPI?.numeroComprasgov || projeto.numeroY || projeto.numeroComprasgov || '').toString();
      
      // Renderizar célula de processo
      if (typeof window.renderProcessCell === 'function') {
        htmlProcessoCell = window.renderProcessCell(numeroProc, modalidadeX, numeroY);
      } else {
        // Fallback simples
        htmlProcessoCell = numeroProc || '-';
      }
      
      // Renderizar célula de projeto COM ícone Comprasgov (seguindo padrão do 3.3)
      if (typeof window.renderProjectCellWithCompras === 'function') {
        htmlProjetoCell = window.renderProjectCellWithCompras(escapeHtml(projeto.objeto), modalidadeX, numeroY);
      } else {
        htmlProjetoCell = escapeHtml(projeto.objeto || '');
      }
    } catch (e) {
      console.warn('[PareceresAnalista] Falha ao renderizar células:', e);
      htmlProcessoCell = projeto.numeroProcesso || '-';
      htmlProjetoCell = escapeHtml(projeto.objeto || '');
    }
    
    // Container de tags de parecer (seguindo padrão do AnalyticsPareceresJuridicosTag.js)
    // As tags serão inseridas dinamicamente pelo módulo AnalyticsPareceresJuridicosTag.js
    const parecerContainer = projeto.parecerInfo && projeto.parecerInfo.idDocumento 
      ? `<div class="parecer-tags-container" data-processo="${escapeHtml(projeto.numeroProcesso)}" data-pareceres='["${projeto.parecerInfo.idDocumento}"]'></div>`
      : '';
    
    return `
      <tr data-processo-numero="${escapeHtml(projeto.numeroProcesso || '')}" ${projeto.id ? `data-id-pca="${escapeHtml(projeto.id)}"` : ''}>
        <td style="white-space: nowrap;">${projeto.id || ''}</td>
        <td style="white-space: nowrap;">${formatAreaWithClasses(projeto.area || '')}</td>
        <td data-label="Tipo" style="white-space: nowrap;"><span class="tipo-badge">${getTipoFromProject(projeto) || ''}</span></td>
        <td class="projeto-cell" data-label="Projeto de Aquisição"${contratoAttrs} style="font-weight: bold;">
          ${htmlProjetoCell}
          ${parecerContainer}
        </td>
        <td style="white-space: nowrap;">${formatStatusWithClasses(projeto.status || '')}</td>
        <td style="white-space: nowrap;">${formatDateCell(projeto.contratar_ate)}</td>
        <td style="white-space: nowrap;">R$ ${formatCurrency(projeto.valor || 0)}</td>
        <td style="white-space: nowrap;">${formatOrcamentoWithClasses(getOrcamentoFromProject(projeto) || '')}</td>
        <td data-label="Processo" style="white-space: nowrap;" ${projeto.numeroProcesso ? `data-processo-numero="${escapeHtml(projeto.numeroProcesso)}"` : ''}>${htmlProcessoCell}</td>
      </tr>
    `;
  }

  /**
   * Formata valor monetário
   */
  function formatCurrency(value) {
    if (typeof value !== 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) return '0,00';
      value = num;
    }
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  }

  /**
   * Funções auxiliares para formatação (seguindo padrão de AnalyticsProcessosPorSetor.js)
   */
  
  /**
   * Função para aplicar estilo de área seguindo padrão das outras seções
   */
  function formatAreaWithClasses(area) {
    const areaClass = getAreaClass(area);
    if (areaClass && areaClass !== 'area-geral') {
      return `<span class="${areaClass}-highlight">${area}</span>`;
    }
    return area;
  }

  /**
   * Função para aplicar estilo de status seguindo padrão das outras seções
   */
  function formatStatusWithClasses(status) {
    const statusClass = getStatusClass(status);
    if (statusClass && statusClass !== 'status-secondary') {
      return `<span class="${statusClass}-highlight">${status}</span>`;
    }
    return status;
  }

  /**
   * Função para aplicar estilo de orçamento seguindo padrão das outras seções
   */
  function formatOrcamentoWithClasses(orcamento) {
    const orcamentoLower = (orcamento || '').toLowerCase();
    if (orcamentoLower.includes('investimento')) {
      return `<span class="orcamento-investimento-highlight">${orcamento}</span>`;
    }
    if (orcamentoLower.includes('custeio')) {
      return `<span class="orcamento-custeio-highlight">${orcamento}</span>`;
    }
    return orcamento;
  }

  /**
   * Funções auxiliares para obter tipo e orçamento do projeto
   */
  function getTipoFromProject(projeto) {
    return projeto.tipo || 'Não identificado';
  }

  function getOrcamentoFromProject(projeto) {
    return projeto.orcamento || 'A definir';
  }

  /**
   * Obtém classe CSS para área
   */
  function getAreaClass(area) {
    const areaMap = {
      'STI 👩‍💼': 'area-sti',
      'OPERAÇÕES 🗄️': 'area-operacoes',
      'DEV 👨‍💻': 'area-dev',
      'ANALYTICS 📊': 'area-analytics',
      'GOVERNANÇA 🌐': 'area-governanca',
    };

    if (areaMap[area]) {
      return areaMap[area];
    }
    
    const areaLower = (area || '').toLowerCase();
    if (areaLower.includes('sti')) return 'area-sti';
    if (areaLower.includes('operações') || areaLower.includes('operacoes')) return 'area-operacoes';
    if (areaLower.includes('dev')) return 'area-dev';
    if (areaLower.includes('analytics')) return 'area-analytics';
    if (areaLower.includes('governança') || areaLower.includes('governanca')) return 'area-governanca';
    
    return 'area-geral';
  }

  /**
   * Obtém classe CSS para status
   */
  function getStatusClass(status) {
    const statusMap = {
      'AUTUAÇÃO ATRASADA 💣': 'status-autuacao-atrasada',
      'EM RENOVAÇÃO 🔄': 'status-em-renovacao',
      'CANCELADO ❌': 'status-cancelado',
      'EM CONTRATAÇÃO 🤝': 'status-em-contratacao',
      'AGUARDANDO ETP ⏳': 'status-aguardando-etp',
      'AGUARDANDO DFD ⏳': 'status-aguardando-dfd',
      'A INICIAR ⏰': 'status-a-iniciar',
      'RENOVADO ✅': 'status-renovado',
      'CONTRATADO ✅': 'status-contratado',
      'AGUR. DEFIN. DO GESTOR ⏳': 'status-aguardando-definicao',
      'ETP ATRASADO❗': 'status-etp-atrasado',
      'DFD ATRASADO❗': 'status-dfd-atrasado',
      'CONTRATAÇÃO ATRASADA ⚠️': 'status-contratacao-atrasada',
      'ELABORANDO TR📝': 'status-elaborando-tr',
      'ANÁLISE DE VIABILIDADE 📝': 'status-analise-viabilidade',
      'REVISÃO PCA 🚧': 'status-revisao-pca'
    };

    if (statusMap[status]) {
      return statusMap[status];
    }
    
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('atrasad')) return 'status-danger';
    if (statusLower.includes('contratado') || statusLower.includes('renovado')) return 'status-success';
    if (statusLower.includes('aguardando')) return 'status-warning';
    if (statusLower.includes('em ')) return 'status-info';
    
    return 'status-secondary';
  }

  /**
   * Formata célula de data
   */
  function formatDateCell(date) {
    if (!date) return '';
    try {
      const dataObj = new Date(date);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString('pt-BR');
      }
      return String(date);
    } catch {
      return String(date);
    }
  }

  /**
   * Configura event listeners para expansão/contração
   */
  function addAnalistasExpandListeners() {
    document.querySelectorAll('.setor-expand-btn').forEach(button => {
      button.addEventListener('click', function() {
        const analistaSafe = this.dataset.analista;
        const analistaNome = this.dataset.analistaNome;
        const detailsDiv = document.getElementById(`analista-details-${analistaSafe}`);
        const icon = this.querySelector('i');
        
        if (detailsDiv.style.display === 'none') {
          // Expandir
          detailsDiv.style.display = 'block';
          icon.classList.remove('bi-chevron-down');
          icon.classList.add('bi-chevron-up');
          this.innerHTML = '<i class="bi bi-chevron-up"></i> Recolher';
          this.classList.add('active');
          
          console.log(`[PareceresAnalista] Expandido: ${analistaNome}`);
          
          // Notificar outros módulos após expansão
          setTimeout(() => {
            // Comprasgov
            if (window.comprasgovInstance && typeof window.comprasgovInstance.reinitialize === 'function') {
              window.comprasgovInstance.reinitialize();
            }
            
            // Espécie Processo
            if (window.debugEspecieProcesso && typeof window.debugEspecieProcesso.scheduleUpdate === 'function') {
              window.debugEspecieProcesso.scheduleUpdate(200);
            }
            
            // Processo Tag
            if (window.debugProcessoTag && typeof window.debugProcessoTag.processarTabela === 'function') {
              window.debugProcessoTag.processarTabela();
            }
            
            // Contratos
            if (window.debugAnalyticsContratoTag && typeof window.debugAnalyticsContratoTag.reprocess === 'function') {
              window.debugAnalyticsContratoTag.reprocess();
            }
            
            // Tags de parecer jurídico (AnalyticsPareceresJuridicosTag.js)
            if (window.debugPareceresJuridicosTag && typeof window.debugPareceresJuridicosTag.processarTabela === 'function') {
              window.debugPareceresJuridicosTag.processarTabela();
            }
            
            // Evento customizado
            document.dispatchEvent(new CustomEvent('pareceres-analista-expandido', {
              detail: { analista: analistaNome }
            }));
          }, 150);
          
        } else {
          // Recolher
          detailsDiv.style.display = 'none';
          icon.classList.remove('bi-chevron-up');
          icon.classList.add('bi-chevron-down');
          this.innerHTML = '<i class="bi bi-chevron-down"></i> Expandir';
          this.classList.remove('active');
          
          console.log(`[PareceresAnalista] Recolhido: ${analistaNome}`);
        }
      });
    });
  }


  /**
   * Inicialização: cria o botão de geração
   */
  function initPareceresAnalista(){
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Tentando inicializar...');
    
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.warn('[PareceresAnalista] Container não encontrado:', CONTAINER_ID);
      // Tentar novamente
      setTimeout(initPareceresAnalista, 500);
      return;
    }
    
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Container encontrado, criando botão...');
    
    // Criar botão de geração (igual ao 3.2)
    container.innerHTML = `
      <div class="mb-3">
        <button class="btn btn-primary" id="btn-gerar-pareceres-analista" onclick="iniciarCarregamentoAnalistas()">
          <i class="bi bi-play-circle me-2"></i>Gerar Informação
        </button>
      </div>
      <div class="alert alert-secondary">
        <i class="bi bi-info-circle me-2"></i>
        Clique no botão acima para carregar os dados de pareceres agrupados por analista.
      </div>
    `;
    
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Botão criado com sucesso');
  }

  // Observar quando o dashboard for populado
  const observeDashboard = () => {
    const dashboard = document.getElementById('analytics-dashboard');
    if (!dashboard) {
      if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Dashboard não encontrado ainda');
      setTimeout(observeDashboard, 500);
      return;
    }
    
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Dashboard encontrado, observando mudanças...');
    
    const observer = new MutationObserver((mutations) => {
      const container = document.getElementById(CONTAINER_ID);
      if (container && !container.querySelector('#btn-gerar-pareceres-analista')) {
        if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Container detectado via MutationObserver');
        observer.disconnect();
        setTimeout(initPareceresAnalista, 100);
      }
    });
    
    observer.observe(dashboard, { childList: true, subtree: true });
    
    // Também tentar imediatamente
    setTimeout(initPareceresAnalista, 200);
  };
  
  // Iniciar observação
  observeDashboard();
  
  // Também tentar quando DOM carregar
  document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] DOMContentLoaded disparado');
    setTimeout(initPareceresAnalista, 1400);
  });
  
  // Se DOM já estiver carregado
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] DOM já carregado');
    setTimeout(initPareceresAnalista, 1600);
  }
  
  // Reexecutar ao trocar de ano
  window.addEventListener('analytics-reload-finished', () => {
    if (DEBUG_ANALISTA) console.log('[PareceresAnalista] Evento analytics-reload-finished');
    estadoCarregamento.carregado = false;
    estadoCarregamento.carregando = false;
    assinaturasCache.clear();
    analistas.clear();
    documentosFalhados.clear();
    setTimeout(initPareceresAnalista, 1400);
  });

  // Exportar funções globalmente
  window.iniciarCarregamentoAnalistas = iniciarCarregamentoAnalistas;
  window.initPareceresAnalista = initPareceresAnalista;
  window.retryDocumentosFalhados = retryDocumentosFalhados;
  
  console.log('✅ [PareceresAnalista] Módulo carregado completamente');
  console.log('🔗 [PareceresAnalista] Função iniciarCarregamentoAnalistas() disponível globalmente');
})();
