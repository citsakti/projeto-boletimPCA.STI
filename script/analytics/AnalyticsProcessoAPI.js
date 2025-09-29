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

  function normalizarNumero(raw){
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
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
    `;
    document.head.appendChild(style);
  }

  // Busca compatível, reaproveitando cache do DocumentosDoProcessso se existir
  async function fetchProcessoPorNumeroCompat(numero){
    const num = normalizarNumero(numero);
    if (!num) return null;
    const shared = getSharedProcessCache();
    if (shared.has(num)) return shared.get(num);
    try {
      const resp = await fetch(API_POR_NUMERO, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero: num })
      });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();
      const item = data && data.data && Array.isArray(data.data.lista) ? data.data.lista[0] : null;
      const documentosSessao = item && item.documentos ? item.documentos : null;
      const sigiloso = !documentosSessao;
      const grupos = documentosSessao ? [
        documentosSessao.documentosPrincipal,
        documentosSessao.documentosApensados,
        documentosSessao.documentosJuntados,
        documentosSessao.documentosProtocolosJuntados,
        documentosSessao.documentoAgrupados
      ].filter(Array.isArray) : [];
      const documentos = grupos.flat();
      const result = { raw: item || null, documentos, sigiloso };
      shared.set(num, result);
      return result;
    } catch(e){
      return null;
    }
  }

  function coletarNumerosDasTabelas(){
    const set = new Set();
    document.querySelectorAll('.project-details-table tbody tr, .project-details tbody tr').forEach(tr=>{
      try{
        const td = Array.from(tr.children).slice(-1)[0];
        if (!td) return;
        // Novo HTML já contém a tag com data-proc
        const tag = td.querySelector('.processo-tag');
        let numero = tag ? tag.getAttribute('data-proc') : '';
        if (!numero) {
          const text = (td.textContent||'').replace(/[🔗🛍️]/g,'');
          numero = normalizarNumero(text);
        }
        if (numero) set.add(numero);
      } catch(_){}
    });
    return Array.from(set);
  }

  async function prefetchProcessos(){
    const numeros = coletarNumerosDasTabelas();
    if (!numeros.length) return;
    const shared = getSharedProcessCache();
    const faltantes = numeros.filter(n=>!shared.has(n));
    const conc = 5; let i = 0; const workers = [];
    async function worker(){
      while(i < faltantes.length){
        const idx = i++; const n = faltantes[idx];
        await fetchProcessoPorNumeroCompat(n);
      }
    }
    for(let k=0;k<Math.min(conc,faltantes.length);k++) workers.push(worker());
    await Promise.all(workers);
    try { updateDocButtonsState(); } catch(_) {}
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
      if (!entry) entry = await fetchProcessoPorNumeroCompat(numero);
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
      if (!entry) entry = await fetchProcessoPorNumeroCompat(numero);
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
    // Prefetch leve para deixar ícones responsivos
    setTimeout(()=>{ prefetchProcessos().catch(()=>{}); }, 200);
  }

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
    setTimeout(afterRenderHook, 1000);
  });
  // Caso o DOM já tenha carregado
  if (document.readyState !== 'loading'){
    ensureStyles();
    attachListeners();
    setTimeout(afterRenderHook, 600);
  }
})();
