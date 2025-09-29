/**
 * AnalyticsPareceresJuridicos.js
 * 
 * Objetivo:
 *  - Construir a subseção 3.3 Pareceres Jurídicos na Análise Situacional
 *  - Identificar quais projetos possuem (ou não) parecer jurídico emitido
 *  - Para projetos de tipo 🔄 Renovação considerar apenas pareceres emitidos no ano selecionado
 *  - Reutilizar caches já carregados (window._processoPorNumeroCache) e documentos em cache
 *  - Estrutura de tabela compatível com a usada em 3.2 (Processos por Setor) / demais tabelas analíticas
 * 
 * Estratégia:
 *  1. Coletar todos os números de processo presentes em analyticData (exceto cancelados já filtrados a montante)
 *  2. Aguardar que o prefetch de processos (AnalyticsProcessoAPI.js) tenha populado o cache
 *  3. Extrair dos documentos (documentos[].tipoAtoDocumento.descricao) aqueles que contenham 'PARECER JURIDICO'
 *  4. Para cada processo marcar se tem parecer e a(s) data(s) de finalização
 *  5. Para tipo 🔄 Renovação, manter flag true somente se existir ao menos um parecer no ano corrente (selectedYear)
 *  6. Montar duas listas: comParecer / semParecer
 *  7. Renderizar cards com contagens e duas tabelas (expand/collapse)
 *  8. Reutilizar renderProcessCell para coluna do processo e formatações existentes
 */
(function(){
  const SUBSECTION_ID = 'pareceres-juridicos-subsection';
  const CONTAINER_ID = 'pareceres-juridicos-container';
  const WAIT_CACHE_TIMEOUT = 15000; // ms
  const POLL_INTERVAL = 300;
  const DEBUG_PARECERES = false;

  // Controle de reprocessamento (debounce) quando novos processos entram no cache
  let _reprocessTimeout = null;
  let _ultimaAssinaturaExecucao = 0; // timestamp
  let _resultadoAnteriorHash = '';

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

  function coletarProjetosDoAnalytics(){
    // Preferir lista completa criada em analyticData.todosProjetos
    if (!analyticData || !Array.isArray(analyticData.todosProjetos)) return [];
    return analyticData.todosProjetos
      .filter(p => p && p.numProcesso) // já filtrados cancelados no pipeline
      .map(p => ({
        id: p.idPca || p.id || '',
        area: p.area || '',
        objeto: p.projeto || p.objeto || '',
        valor: p.valor || 0,
        contratar_ate: p.dataProcesso || p.contratar_ate || '',
        numeroProcesso: normalizarNumero(p.numProcesso),
        tipo: p.tipo || inferirTipoPeloStatus(p.status) || '🛒 Aquisição',
        status: p.status || ''
      }))
      .filter(p => p.numeroProcesso);
  }

  function ehStr(v){ return typeof v === 'string'; }
  function inferirTipoPeloStatus(status){
    if (!ehStr(status)) return null;
    if (status.includes('RENOVA')) return '🔄 Renovação';
    return '🛒 Aquisição';
  }

  async function waitForAnyProcessCache(numeros){
    const start = Date.now();
    const cache = getSharedProcessCache();
    while(Date.now() - start < WAIT_CACHE_TIMEOUT){
      // Critério: pelo menos 30% dos números já presentes OU todos presentes
      let presentes = 0;
      numeros.forEach(n => { if (cache.has(n)) presentes++; });
      if (presentes > 0 && (presentes / numeros.length >= 0.3 || presentes === numeros.length)) return true;
      await new Promise(r=>setTimeout(r, POLL_INTERVAL));
    }
    return false; // prossegue mesmo assim
  }

  function extrairPareceresDoEntry(cacheEntry){
    // Estrutura conforme AnalyticsProcessoAPI / DocumentosDoProcessso
    if (!cacheEntry || !Array.isArray(cacheEntry.documentos)) return [];
    const out = [];
    cacheEntry.documentos.forEach(doc => {
      try {
        // Tentar múltiplos campos potenciais que podem conter a natureza do documento
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
        // Critérios de identificação: conter 'PARECER' e 'JURID' (abrange juridico/jurídico)
        if (norm.includes('PARECER') && norm.includes('JURID')) {
          out.push({
            id: doc.id,
            numero: doc.numero,
            ano: doc.ano,
            dataFinalizacao: doc.dataFinalizacao || '',
            descricao: combinado
          });
        } else if (norm.includes('PARECER')) {
          // Guarda separadamente caso se queira audit trail (não jurídico explícito)
          if (DEBUG_PARECERES) console.debug('[PareceresJuridicos] Documento com PARECER mas sem JURID encontrado (ignorado p/ contagem):', combinado);
        }
      } catch(_){}
    });
    return out;
  }

  function anoDaData(str){
    if (!str) return null;
    // Tentar padrões dd/mm/yyyy ou yyyy-mm-dd etc.
    const m = str.match(/(\d{4})/);
    return m ? m[1] : null;
  }

  function construirListas(projetos){
    const year = getSelectedYear();
    const cache = getSharedProcessCache();
    const comParecer = [];
    const semParecer = [];

    projetos.forEach(p => {
      const entry = cache.get(p.numeroProcesso);
      const pareceres = extrairPareceresDoEntry(entry);
      if (!pareceres.length){
        semParecer.push({...p});
        return;
      }
      // Filtro rigoroso: para RENOVAÇÃO só contam pareceres com ano == selecionado
      // Para Aquisição: não filtra (qualquer ano vale, mas ainda assim registramos anos para auditoria futura)
      let pareceresValidos;
      if (p.tipo === '🔄 Renovação') {
        pareceresValidos = pareceres.filter(pc => {
          const yearDoc = pc.ano ? String(pc.ano) : anoDaData(pc.dataFinalizacao);
          return yearDoc === year; // somente ano corrente selecionado
        });
      } else {
        pareceresValidos = pareceres.slice();
      }
      if (pareceresValidos.length) {
        comParecer.push({ ...p, pareceres: pareceresValidos });
      } else {
        semParecer.push({ ...p });
      }
    });

    return { comParecer, semParecer };
  }

  function renderTabela(lista, titulo){
    if (!lista.length) {
      return `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Nenhum projeto ${titulo.toLowerCase()}.</div>`;
    }
    return `
      <div class="table-responsive">
        <table class="table table-striped table-hover project-details-table">
          <thead class="table-dark">
            <tr>
              <th>ID PCA</th>
              <th>Área</th>
              <th>Tipo</th>
              <th>Projeto</th>
              <th>Status</th>
              <th>Contratar Até</th>
              <th>Valor PCA</th>
              <th>Processo</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map(p => renderLinhaProjeto(p)).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderLinhaProjeto(p){
    let contratoAttrs = '';
    // (Se futuramente quisermos atrelar contrato/registro, basta adicionar no pipeline de coleta)
    const statusFmt = (typeof formatStatusWithClasses === 'function') ? formatStatusWithClasses(p.status) : p.status;
    const areaFmt = (typeof formatAreaWithClasses === 'function') ? formatAreaWithClasses(p.area) : p.area;
    const procCell = (typeof window.renderProcessCell === 'function') ? window.renderProcessCell(p.numeroProcesso) : (p.numeroProcesso || '-');
    return `
      <tr>
        <td>${p.id || ''}</td>
        <td>${areaFmt}</td>
        <td><span class="tipo-badge">${p.tipo}</span></td>
        <td style="font-weight:600;"${contratoAttrs}>${escapeHtml(p.objeto)}</td>
        <td>${statusFmt}</td>
        <td>${p.contratar_ate || ''}</td>
        <td>R$ ${formatCurrency(p.valor || 0)}</td>
        <td>${procCell}</td>
      </tr>`;
  }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[s]));
  }

  function renderResumoCards(meta){
    // Botões foram movidos para dentro dos cards, logo abaixo dos indicadores
    return `
      <div class="row g-3 mb-3 pareceres-cards">
        <div class="col-12 col-md-6">
          <div class="card h-100 border-success">
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h5 class="card-title text-success mb-2">Com Parecer Jurídico</h5>
                <p class="display-6 mb-3">${meta.com}</p>
              </div>
              <div>
                <button class="btn btn-outline-success btn-sm w-100" data-toggle="pareceres-com">Mostrar Projetos COM Parecer</button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="card h-100 border-danger">
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h5 class="card-title text-danger mb-2">Sem Parecer Jurídico</h5>
                <p class="display-6 mb-3">${meta.sem}</p>
              </div>
              <div>
                <button class="btn btn-outline-danger btn-sm w-100" data-toggle="pareceres-sem">Mostrar Projetos SEM Parecer</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderSectionContent(listas){
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const html = `
      ${renderResumoCards({ com: listas.comParecer.length, sem: listas.semParecer.length })}
      <div class="pareceres-tabelas">
        <div class="mb-4">
          <div id="pareceres-com" style="display:none;">${renderTabela(listas.comParecer, 'Com Parecer')}</div>
        </div>
        <div class="mb-4">
          <div id="pareceres-sem" style="display:none;">${renderTabela(listas.semParecer, 'Sem Parecer')}</div>
        </div>
      </div>`;

    container.innerHTML = html;

    // Listeners toggle
    container.querySelectorAll('button[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const el = container.querySelector('#'+id);
        if (!el) return;
        const visible = el.style.display !== 'none';
        el.style.display = visible ? 'none' : 'block';
        // Atualiza texto do botão de forma contextual
        const base = id==='pareceres-com' ? 'Projetos COM Parecer' : 'Projetos SEM Parecer';
        const agoraVisivel = !visible;
        btn.innerHTML = (agoraVisivel ? 'Ocultar ' : 'Mostrar ') + base;
        // Alterna classe de estado ativo (gradiente verde)
        if (agoraVisivel) {
          btn.classList.add('pareceres-btn-ativo');
          btn.setAttribute('aria-pressed','true');
        } else {
          btn.classList.remove('pareceres-btn-ativo');
          btn.setAttribute('aria-pressed','false');
        }
      });
    });

    // Habilitar sorter se disponível
    if (typeof window.enableTableSorting === 'function') {
      window.enableTableSorting(container);
    }

    // Tooltips de contrato se existirem
    if (typeof window.setupAnalyticsTooltips === 'function') {
      setTimeout(()=>window.setupAnalyticsTooltips(), 50);
    }

    // Salvar hash para detectar mudanças em reprocessamentos
    try {
      const hashBase = listas.comParecer.map(p=>p.numeroProcesso).sort().join('|') + '//' + listas.semParecer.map(p=>p.numeroProcesso).sort().join('|');
      _resultadoAnteriorHash = hashBase;
    } catch(_){}
  }

  async function initPareceresJuridicos(){
    try {
      if (typeof analyticData === 'undefined') {
        console.warn('[PareceresJuridicos] analyticData indisponível no momento');
        return;
      }
      const projetos = coletarProjetosDoAnalytics();
      if (!projetos.length){
        const c = document.getElementById(CONTAINER_ID);
        if (c) c.innerHTML = '<div class="alert alert-warning">Nenhum projeto elegível encontrado para análise de pareceres.</div>';
        return;
      }
      const numeros = projetos.map(p=>p.numeroProcesso);
      await waitForAnyProcessCache(numeros);
      const listas = construirListas(projetos);
      renderSectionContent(listas);
      _ultimaAssinaturaExecucao = Date.now();
      if (DEBUG_PARECERES) console.debug('[PareceresJuridicos] Execução concluída. Com parecer:', listas.comParecer.length, 'Sem parecer:', listas.semParecer.length);
    } catch(e){
      console.error('[PareceresJuridicos] Erro geral:', e);
      const c = document.getElementById(CONTAINER_ID);
      if (c) c.innerHTML = '<div class="alert alert-danger">Erro ao carregar pareceres jurídicos.</div>';
    }
  }

  // Disparar após DOM e após renderização base (AnalyticsRender adiciona placeholder antes)
  document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que renderSituacionalSection já injetou a subseção
    setTimeout(initPareceresJuridicos, 1200);
  });
  // Reexecutar ao trocar de ano
  window.addEventListener('analytics-reload-finished', () => {
    setTimeout(initPareceresJuridicos, 1200);
  });

  // Reprocessar quando o cache de processos receber novos dados (prefetch finalizado ou expansões)
  document.addEventListener('processo-cache-atualizado', () => {
    // Debounce para evitar múltiplas execuções em rajada
    clearTimeout(_reprocessTimeout);
    _reprocessTimeout = setTimeout(() => {
      try {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return; // seção não montada ainda
        const projetos = coletarProjetosDoAnalytics();
        if (!projetos.length) return;
        const cache = getSharedProcessCache();
        // Se muitos processos ainda não estão no cache, aguardar próximas iterações
        const total = projetos.length;
        const presentes = projetos.filter(p=>cache.has(p.numeroProcesso)).length;
        if (presentes/total < 0.5) { // esperar mais cobertura
          if (DEBUG_PARECERES) console.debug('[PareceresJuridicos] Reprocess adiado: cobertura cache', presentes,'/',total);
          return;
        }
        const listas = construirListas(projetos);
        // Calcular hash atual e comparar para evitar re-render inútil
        const hashNovo = (()=>{
          try { return listas.comParecer.map(p=>p.numeroProcesso).sort().join('|') + '//' + listas.semParecer.map(p=>p.numeroProcesso).sort().join('|'); } catch(_){ return ''; }
        })();
        if (hashNovo === _resultadoAnteriorHash) {
          if (DEBUG_PARECERES) console.debug('[PareceresJuridicos] Reprocess ignorado: sem mudanças.');
          return;
        }
        if (DEBUG_PARECERES) console.debug('[PareceresJuridicos] Reprocess executado.');
        renderSectionContent(listas);
      } catch(e){ if (DEBUG_PARECERES) console.warn('[PareceresJuridicos] Falha reprocess cache:', e); }
    }, 500);
  });

  // Expor para debug manual
  window.initPareceresJuridicos = initPareceresJuridicos;
})();
