/**
 * AnalyticsProcessoAPI.js
 *
 * Objetivo: Substituir o conteúdo atual das colunas "Processo"/"Número do Processo" nos detalhes analíticos
 * para usar a mesma experiência da tabela principal:
 *  - Tag clicável do número do processo que abre o ProcessoModal (iframe do TCE)
 *  - Ícone de Documentos (📚) usando DocumentosDoProcessso.js
 *  - Ícone de Histórico (🕘) usando HistoricoTramitacoesModal.js
 *  - Ícone 🛍️ de Comprasgov quando X/Y presentes
 *
 * Regras:
 *  - A API por número utiliza o mesmo padrão do AcompanhamentoProcessos.js (POST porNumero)
 *  - Os dados devem ser pré-buscados em lote e armazenados em window._processoPorNumeroCache
 *  - Reage após o render das tabelas analíticas
 */
(function(){
  const API_POR_NUMERO = 'https://api-processos.tce.ce.gov.br/processos/porNumero';

  // Cache compartilhado (mesmo objeto usado pelos outros módulos)
  function getSharedProcessCache(){
    if (!window._processoPorNumeroCache) window._processoPorNumeroCache = new Map();
    return window._processoPorNumeroCache;
  }

  // Acessa o módulo de documentos se carregado, para reutilizar o cache e manter consistência
  function getDocsModule(){
    return (window && window.debugDocumentosProcesso) ? window.debugDocumentosProcesso : null;
  }
  function getDocsCache(){
    const mod = getDocsModule();
    return mod && mod.cache ? mod.cache : null; // Map numero -> { raw, documentos, sigiloso }
  }

  function normalizarNumero(raw){
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  // Gerenciador de pré-carregamento em lote
  function getPrefetchManager(){
    if (!window._analyticsProcPrefetch) {
      window._analyticsProcPrefetch = {
        running: false,
        lastRunAt: 0,
        promise: null,
        // números cobertos no último prefetch
        covered: new Set(),
        // controle de erros
        errors: new Map(), // numero -> erro
        successCount: 0,
        totalCount: 0,
      };
    }
    return window._analyticsProcPrefetch;
  }

  async function waitForNumeroInCache(numero, { timeoutMs = 10000 } = {}){
    const num = normalizarNumero(numero);
    if (!num) return null;
    const shared = getSharedProcessCache();
    if (shared.has(num)) return shared.get(num);
    // aguarda prefetch ativo/concluindo
    const mgr = getPrefetchManager();
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (shared.has(num)) return shared.get(num);
      // se houver uma promessa de prefetch, aguarda-a uma vez
      if (mgr.promise) {
        try { await mgr.promise; } catch(_) { /* ignore */ }
      }
      if (shared.has(num)) return shared.get(num);
      await new Promise(r=>setTimeout(r, 150));
    }
    return null;
  }

  function ensureStyles(){
    if (document.getElementById('analytics-proc-styles')) return;
    const style = document.createElement('style');
    style.id = 'analytics-proc-styles';
    style.textContent = `
      .analytics-proc-cell { display:block; }
      .processo-tag-wrapper{ display:flex; align-items:center; justify-content:center; margin-top:2px; }
      .processo-tag{ display:inline-block; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.3px; line-height:1.2; cursor:pointer; transition:all .2s ease; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; background:linear-gradient(135deg,#f5f5f5 0%, #e0e0e0 100%); color:#424242; border:1px solid #bdbdbd; }
      .processo-tag:hover{ transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); background:linear-gradient(135deg,#e0e0e0 0%, #bdbdbd 100%); }
      .analytics-proc-actions .doc-icon-btn{ display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:4px; background:#eef3f8; color:#1a73e8; border:1px solid #d2e3fc; cursor:pointer; }
      .analytics-proc-actions .doc-icon-btn:hover{ background:#e2ecf7; }
      .acomp-historico-btn{ display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:4px; background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; cursor:pointer; }
      .acomp-historico-btn:hover{ background:#e0e7ff; }
      #analytics-fetch-status{ margin-top:1rem; padding:.75rem; border-radius:6px; font-size:.85rem; background:#f8f9fa; border:1px solid #dee2e6; }
      #analytics-fetch-status.loading{ background:#e7f3ff; border-color:#b3d9ff; color:#004085; }
      #analytics-fetch-status.success{ background:#d4edda; border-color:#c3e6cb; color:#155724; }
      #analytics-fetch-status.error{ background:#f8d7da; border-color:#f5c6cb; color:#721c24; }
      #analytics-fetch-status .status-icon{ display:inline-block; margin-right:.5rem; font-size:1rem; }
      #analytics-fetch-status .status-message{ display:inline-block; }
      #analytics-fetch-status .retry-btn{ margin-top:.5rem; padding:.25rem .75rem; font-size:.8rem; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer; transition:background .2s; }
      #analytics-fetch-status .retry-btn:hover{ background:#0056b3; }
      #analytics-fetch-status .error-details{ margin-top:.5rem; font-size:.75rem; opacity:.8; max-height:120px; overflow-y:auto; }
    `;
    document.head.appendChild(style);
  }

  // Processamento compatível com DocumentosDoProcessso.js
  function processarRespostaLocal(numero, data){
    let item = null;
    try { item = data && data.data && Array.isArray(data.data.lista) ? data.data.lista[0] : null; } catch(_) {}
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

  // Busca robusta (timeout + fallback para {nrProcesso}), sincronizando ambos caches
  async function fetchProcessoPorNumeroCompat(numero, { timeoutMs = 15000 } = {}){
    const num = normalizarNumero(numero);
    if (!num) return null;
    const shared = getSharedProcessCache();
    const docsCache = getDocsCache();
    if (shared.has(num)) return shared.get(num);
    if (docsCache && docsCache.has(num)) {
      const v = docsCache.get(num);
      try { shared.set(num, v); } catch(_) {}
      return v;
    }
    const controller = new AbortController();
    const to = setTimeout(()=>controller.abort(), timeoutMs);
    try {
      let resp = await fetch(API_POR_NUMERO, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero: num }), signal: controller.signal
      });
      if (!resp.ok) {
        if ([400,415,500].includes(resp.status)){
          try {
            const resp2 = await fetch(API_POR_NUMERO, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrProcesso: num }), signal: controller.signal
            });
            if (resp2.ok) resp = resp2; else throw new Error('HTTP '+resp.status);
          } catch(e){ throw e; }
        } else {
          const t = await resp.text().catch(()=> '');
          const err = new Error(`HTTP ${resp.status} ${t || resp.statusText}`);
          err.httpStatus = resp.status; throw err;
        }
      }
      const data = await resp.json();
      const result = processarRespostaLocal(num, data);
      try { shared.set(num, result); } catch(_) {}
      try { if (docsCache) docsCache.set(num, result); } catch(_) {}
      return result;
    } finally {
      clearTimeout(to);
    }
  }

  function coletarNumerosDasTabelas(){
    const set = new Set();
    try {
      // Elementos com data-proc nas células renderizadas
      document.querySelectorAll('.analytics-proc-cell [data-proc], .project-details-table [data-proc], .project-details [data-proc]').forEach(el=>{
        const n = normalizarNumero(el.getAttribute('data-proc'));
        if (n) set.add(n);
      });
      // Botões de ação com data-proc
      document.querySelectorAll('.analytics-docs-btn[data-proc], .acomp-historico-btn[data-proc]').forEach(btn=>{
        const n = normalizarNumero(btn.getAttribute('data-proc'));
        if (n) set.add(n);
      });
      // Fallback: última coluna das linhas
      document.querySelectorAll('.project-details-table tbody tr, .project-details tbody tr').forEach(tr=>{
        const td = Array.from(tr.children).slice(-1)[0];
        if (!td) return;
        const text = (td.textContent||'').replace(/[🔗🛍️]/g,'');
        const n = normalizarNumero(text);
        if (n) set.add(n);
      });
    } catch(_) {}
    return Array.from(set);
  }

  async function prefetchProcessos(){
    const mgr = getPrefetchManager();
    const numeros = coletarNumerosDasTabelas();
    if (!numeros.length) return;
    const shared = getSharedProcessCache();
    // Não refaça desnecessariamente: cobre novos números ainda não em cache
    const faltantes = numeros.filter(n=>!shared.has(n));
    if (!faltantes.length) { 
      mgr.covered = new Set(numeros); 
      updateFetchStatus('success', 0, 0);
      return; 
    }
    // Evita múltiplos prefetch concorrentes
    if (mgr.running && mgr.promise) {
      try { await mgr.promise; } catch(_) {}
      return;
    }
    mgr.running = true;
    mgr.lastRunAt = Date.now();
    mgr.errors.clear();
    mgr.successCount = 0;
    mgr.totalCount = faltantes.length;
    
    updateFetchStatus('loading', 0, faltantes.length);
    
    const conc = 10; let i = 0; const workers = [];
    async function worker(){
      while(i < faltantes.length){
        const idx = i++; const n = faltantes[idx];
        try {
          await fetchProcessoPorNumeroCompat(n);
          mgr.successCount++;
        } catch(err) {
          mgr.errors.set(n, err.message || 'Erro desconhecido');
        }
        updateFetchStatus('loading', mgr.successCount, mgr.totalCount, mgr.errors.size);
      }
    }
    mgr.promise = (async ()=>{
      for(let k=0;k<Math.min(conc,faltantes.length);k++) workers.push(worker());
      await Promise.all(workers);
      mgr.covered = new Set(numeros);
      mgr.running = false;
      mgr.promise = null;
      
      // Atualizar status final
      if (mgr.errors.size === 0) {
        updateFetchStatus('success', mgr.successCount, mgr.totalCount);
      } else {
        updateFetchStatus('error', mgr.successCount, mgr.totalCount, mgr.errors.size);
      }
      
      try { updateDocButtonsState(); } catch(_) {}
      try {
        // Notificar que o cache foi atualizado (compatível com EspecieProcessoTag.js)
        document.dispatchEvent(new CustomEvent('processo-cache-atualizado', { detail: { numeros: faltantes } }));
        // Reusar evento já escutado por outros módulos
        document.dispatchEvent(new Event('acompanhamento-atualizado'));
      } catch(_){}
    })();
    await mgr.promise;
  }

  function sanitizeMeta(raw){
    return String(raw||'').replace(/[🔗🛍️]/g,' ').replace(/\s+/g,' ').trim();
  }

  function extrairMetaDoTR(tr){
    let projectName = ''; let idPca = '';
    try{
      const tds = Array.from(tr.children);
      // Heurística: colunas conhecidas nas tabelas analytics
      const tdProjeto = tds.find((td,idx)=> idx===2 || /projeto/i.test(td.dataset?.label||''));
      const tdId = tds.find((td,idx)=> idx===0 || /id\s*pca/i.test(td.dataset?.label||''));
      if (tdProjeto) projectName = sanitizeMeta(window.extractCellTextWithSeparator? window.extractCellTextWithSeparator(tdProjeto) : tdProjeto.textContent);
      if (tdId) idPca = sanitizeMeta(window.extractCellTextWithSeparator? window.extractCellTextWithSeparator(tdId) : tdId.textContent);
    }catch(_){ }
    return { projectName, idPca };
  }

  function attachListeners(){
    // Clique na tag do processo -> ProcessoModal
    document.addEventListener('click', (ev)=>{
      let el = ev.target.closest('.processo-tag');
      if (!el){
        const wrapper = ev.target.closest('.processo-tag-wrapper');
        if (wrapper) el = wrapper.querySelector('.processo-tag');
      }
      if (!el) return;
      const numero = el.getAttribute('data-proc');
      const tr = el.closest('tr');
      const meta = tr ? extrairMetaDoTR(tr) : {};
      try{
        if (window.processoModalInstance && typeof window.processoModalInstance.openModal === 'function'){
          window.processoModalInstance.openModal(numero, meta.projectName||'');
        } else {
          const BASE = 'https://www.tce.ce.gov.br/contexto/#/processo';
          window.open(`${BASE}?search=${encodeURIComponent(numero)}`, '_blank');
        }
      }catch(_){ }
    });

    // Clique em Documentos
    document.addEventListener('click', async (ev)=>{
      const btn = ev.target.closest('.analytics-docs-btn');
      if (!btn) return;
      ev.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      const numero = btn.getAttribute('data-proc');
      const tr = btn.closest('tr');
      const meta = tr ? extrairMetaDoTR(tr) : {};
      const shared = getSharedProcessCache();
      let entry = shared.get(normalizarNumero(numero));
      if (!entry) {
        // não buscar por clique; aguardar cache do prefetch
        btn.setAttribute('aria-disabled','true');
        btn.title = 'Aguardando carregar do cache...';
        try { await waitForNumeroInCache(numero, { timeoutMs: 12000 }); } catch(_) {}
        btn.removeAttribute('aria-disabled');
        btn.removeAttribute('title');
        entry = shared.get(normalizarNumero(numero));
        if (!entry) {
          // ainda indisponível: feedback discreto
          try { console.warn('[AnalyticsProcessoAPI] Dados do processo ainda não disponíveis no cache.', numero); } catch(_){ }
          return;
        }
      }
      const docs = entry && Array.isArray(entry.documentos) ? entry.documentos : [];
      if (window.debugDocumentosProcesso && typeof window.debugDocumentosProcesso.abrir === 'function'){
        window.debugDocumentosProcesso.abrir(numero, docs, meta);
      } else if (typeof window.openDocumentosModal === 'function'){
        window.openDocumentosModal(numero, docs, meta);
      }
    });

    // Clique em Histórico
    document.addEventListener('click', async (ev)=>{
      const btn = ev.target.closest('.acomp-historico-btn');
      if (!btn) return;
      ev.preventDefault();
      const numero = btn.getAttribute('data-proc');
      const tr = btn.closest('tr');
      const meta = tr ? extrairMetaDoTR(tr) : {};
      const shared = getSharedProcessCache();
      let entry = shared.get(normalizarNumero(numero));
      if (!entry) {
        // aguarda prefetch; não faz fetch aqui
        btn.setAttribute('disabled','true');
        try { await waitForNumeroInCache(numero, { timeoutMs: 12000 }); } catch(_) {}
        btn.removeAttribute('disabled');
        entry = shared.get(normalizarNumero(numero));
      }
      const raw = entry ? entry.raw : null;
      if (window.historicoTramitacoes && typeof window.historicoTramitacoes.open === 'function'){
        await window.historicoTramitacoes.open(numero);
      } else if (typeof window.openHistoricoModal === 'function'){
        await window.openHistoricoModal(numero, raw||{}, meta);
      }
    });
  }

  function afterRenderHook(){
    ensureStyles();
    injectStatusContainer();
    // Prefetch leve para deixar ícones responsivos
    setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 100);
  }

  function injectStatusContainer(){
    const toc = document.getElementById('toc-container');
    if (!toc) return;
    if (document.getElementById('analytics-fetch-status')) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'analytics-fetch-status';
    statusDiv.style.display = 'none';
    toc.appendChild(statusDiv);
  }

  function updateFetchStatus(status, success, total, errorCount = 0){
    const statusDiv = document.getElementById('analytics-fetch-status');
    if (!statusDiv) return;
    
    statusDiv.style.display = 'block';
    statusDiv.className = status;
    
    const mgr = getPrefetchManager();
    
    if (status === 'loading') {
      statusDiv.innerHTML = `
        <div class="status-icon">⏳</div>
        <div class="status-message">
          <strong>Carregando processos...</strong><br>
          ${success} de ${total} carregados${errorCount > 0 ? ` (${errorCount} erros)` : ''}
        </div>
      `;
    } else if (status === 'success') {
      statusDiv.innerHTML = `
        <div class="status-icon">✅</div>
        <div class="status-message">
          <strong>Todas as informações carregadas!</strong>
        </div>
      `;
      // Ocultar após 5 segundos
      setTimeout(() => {
        if (statusDiv.className === 'success') {
          statusDiv.style.display = 'none';
        }
      }, 5000);
    } else if (status === 'error') {
      const errorDetails = Array.from(mgr.errors.entries())
        .slice(0, 5)
        .map(([num, err]) => `• ${num}: ${err}`)
        .join('<br>');
      
      const moreErrors = mgr.errors.size > 5 ? `<br>... e mais ${mgr.errors.size - 5} erros` : '';
      
      statusDiv.innerHTML = `
        <div class="status-icon">⚠️</div>
        <div class="status-message">
          <strong>Carregamento parcial</strong><br>
          ${success} de ${total} processos carregados com sucesso<br>
          ${errorCount} processo(s) com erro
        </div>
        <button class="retry-btn" onclick="window._retryFailedProcessos()">
          🔄 Recarregar processos com erro
        </button>
        ${mgr.errors.size > 0 ? `<div class="error-details">${errorDetails}${moreErrors}</div>` : ''}
      `;
    }
  }

  // Função global para retry apenas dos processos com erro
  window._retryFailedProcessos = async function(){
    const mgr = getPrefetchManager();
    const shared = getSharedProcessCache();
    const numerosComErro = Array.from(mgr.errors.keys());
    
    if (!numerosComErro.length) return;
    
    updateFetchStatus('loading', 0, numerosComErro.length);
    
    mgr.errors.clear();
    mgr.successCount = 0;
    mgr.totalCount = numerosComErro.length;
    
    const conc = 5;
    let i = 0;
    const workers = [];
    
    async function worker(){
      while(i < numerosComErro.length){
        const idx = i++;
        const n = numerosComErro[idx];
        try {
          await fetchProcessoPorNumeroCompat(n, { timeoutMs: 20000 });
          mgr.successCount++;
        } catch(err) {
          mgr.errors.set(n, err.message || 'Erro desconhecido');
        }
        updateFetchStatus('loading', mgr.successCount, mgr.totalCount, mgr.errors.size);
      }
    }
    
    for(let k=0; k<Math.min(conc, numerosComErro.length); k++) {
      workers.push(worker());
    }
    
    await Promise.all(workers);
    
    // Atualizar status final
    if (mgr.errors.size === 0) {
      updateFetchStatus('success', mgr.successCount, mgr.totalCount);
    } else {
      updateFetchStatus('error', mgr.successCount, mgr.totalCount, mgr.errors.size);
    }
    
    try { updateDocButtonsState(); } catch(_) {}
    try {
      document.dispatchEvent(new CustomEvent('processo-cache-atualizado', { detail: { numeros: numerosComErro } }));
      document.dispatchEvent(new Event('acompanhamento-atualizado'));
    } catch(_){}
  };

  function updateDocButtonsState(){
    const shared = getSharedProcessCache();
    document.querySelectorAll('.analytics-docs-btn[data-proc]').forEach(btn => {
      const numero = normalizarNumero(btn.getAttribute('data-proc'));
      if (!numero) return;
      const entry = shared.get(numero);
      if (!entry) return;
      if (entry.sigiloso){
        btn.setAttribute('aria-disabled','true');
        btn.classList.add('doc-icon-tooltip');
        btn.setAttribute('data-title','Processo Sigiloso');
        btn.innerHTML = '🔒';
      } else {
        btn.removeAttribute('aria-disabled');
        btn.removeAttribute('data-title');
        // garantir que o ícone continue o mesmo (Bootstrap journals)
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journals" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2"/>
            <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V9h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 2.5v.5H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H2v-.5a.5.5 0 0 0-1 0"/>
          </svg>`;
      }
    });
  }

  // Integração: assim que Analytics.js finalizar render e listeners, aplicar
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureStyles();
    attachListeners();
    // Sinal de render concluída: o próprio Analytics.js chama add...Listeners na sequência; aguardar um pouco
    setTimeout(afterRenderHook, 400);
    try { observeAnalyticsDashboard(); } catch(_) {}
  });
  // Caso o DOM já tenha carregado
  if (document.readyState !== 'loading'){
    ensureStyles();
    attachListeners();
    setTimeout(afterRenderHook, 200);
    try { observeAnalyticsDashboard(); } catch(_) {}
  }

  // Reagir a eventos do ciclo de renderização da tabela para manter o cache fresco
  document.addEventListener('tabela-carregada', ()=>{ setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 50); });
  document.addEventListener('acompanhamento-atualizado', ()=>{ setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 50); });

  // Observa o container do dashboard para prefetch quando se expande/contrai
  function observeAnalyticsDashboard(){
    const container = document.getElementById('analytics-dashboard');
    if (!container || container._analyticsObsInit) return;
    container._analyticsObsInit = true;
    const obs = new MutationObserver((muts)=>{
      if (muts.some(m=>m.type==='childList' || m.type==='attributes')){
        setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 80);
      }
    });
    obs.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style','class'] });

    document.addEventListener('click', (e)=>{
      const sel = '.expand-btn, .area-valor-expand-btn, .status-expand-btn, .tipo-expand-btn, .situacional-expand-btn, .area-expand-btn';
      if (e.target.closest(sel)) {
        setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 120);
      }
    });
  }
})();
