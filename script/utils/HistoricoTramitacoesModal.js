(function(){
  // HistoricoTramitacoesModal.js
  // Botão por linha que abre um modal com a linha do tempo de tramitações
  // e um sumário de quantos dias o processo permaneceu em cada setor.

  // ================= Helpers / Infra =================
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) {
      window._processoPorNumeroCache = new Map();
    }
    return window._processoPorNumeroCache; // Map numero -> { raw, documentos, sigiloso }
  }

  // ===== Viewer de documento embutido =====
  function canInlineViewer(){ return window.innerWidth >= 1100; }
  function openDocViewer(docId){
    if (!docId) return;
    const url = API_DOC_ARQUIVO + encodeURIComponent(docId);
    if (!canInlineViewer()) { try { window.open(url, '_blank'); } catch(_) {} return; }
    const overlay = document.getElementById('historico-tramitacoes-overlay');
    const modalContent = overlay && overlay.querySelector('.modal-content');
    const layout = document.getElementById('historico-tramitacoes-layout');
    const viewer = document.getElementById('historico-tramitacoes-viewer');
    const resizer = document.getElementById('historico-tramitacoes-resizer');
    const iframe = document.getElementById('historico-tramitacoes-iframe');
    if (!overlay || !modalContent || !layout || !viewer || !iframe) { window.open(url, '_blank'); return; }
    modalContent.classList.add('expanded');
    layout.classList.add('expanded');
    viewer.classList.remove('d-none');
    viewer.setAttribute('aria-hidden','false');
    if (resizer) { resizer.classList.remove('d-none'); resizer.setAttribute('aria-hidden','false'); }
    // Definição inicial (55% timeline / 45% viewer) só se ainda não ajustado
    if (!layout.dataset.splitApplied) {
      applySplitWidths(55); // percent da timeline
      layout.dataset.splitApplied = '1';
    }
    iframe.src = url;
  }
  function closeDocViewer(){
    const overlay = document.getElementById('historico-tramitacoes-overlay');
    if (!overlay) return;
    const modalContent = overlay.querySelector('.modal-content');
    const layout = document.getElementById('historico-tramitacoes-layout');
    const viewer = document.getElementById('historico-tramitacoes-viewer');
    const resizer = document.getElementById('historico-tramitacoes-resizer');
    const iframe = document.getElementById('historico-tramitacoes-iframe');
    if (iframe) iframe.removeAttribute('src');
    if (viewer) { viewer.classList.add('d-none'); viewer.setAttribute('aria-hidden','true'); }
    if (resizer) { resizer.classList.add('d-none'); resizer.setAttribute('aria-hidden','true'); }
    if (modalContent) modalContent.classList.remove('expanded');
    if (layout) layout.classList.remove('expanded');
  }

  // Restaura layout padrão (sem viewer e sem ajustes de largura)
  function resetHistoricoLayout(){
    try {
      const layout = document.getElementById('historico-tramitacoes-layout');
      const body = document.getElementById('historico-tramitacoes-body');
      const viewer = document.getElementById('historico-tramitacoes-viewer');
      const resizer = document.getElementById('historico-tramitacoes-resizer');
      const overlay = document.getElementById('historico-tramitacoes-overlay');
      // Limpa flex customizado
      if (body) body.style.flex = '';
      if (viewer) viewer.style.flex = '';
      if (layout && layout.dataset && layout.dataset.splitApplied) delete layout.dataset.splitApplied;
      // Fecha viewer e remove classes
      if (viewer) { viewer.classList.add('d-none'); viewer.setAttribute('aria-hidden','true'); }
      if (resizer) { resizer.classList.add('d-none'); resizer.setAttribute('aria-hidden','true'); }
      if (overlay) {
        const modalContent = overlay.querySelector('.modal-content');
        if (modalContent) modalContent.classList.remove('expanded');
      }
      if (layout) layout.classList.remove('expanded');
      // Remove src do iframe
      const iframe = document.getElementById('historico-tramitacoes-iframe');
      if (iframe) iframe.removeAttribute('src');
    } catch(_) {}
  }

  // ===== Split drag =====
  function applySplitWidths(timelinePercent){
    const layout = document.getElementById('historico-tramitacoes-layout');
    const body = document.getElementById('historico-tramitacoes-body');
    const viewer = document.getElementById('historico-tramitacoes-viewer');
    const resizer = document.getElementById('historico-tramitacoes-resizer');
    if (!layout || !body || !viewer || !resizer) return;
    const minP = 20; const maxP = 80;
    const p = Math.min(maxP, Math.max(minP, timelinePercent));
    body.style.flex = `0 0 ${p}%`;
    viewer.style.flex = `0 0 ${100 - p}%`;
    resizer.style.cursor = 'col-resize';
  }

  function initResizerDrag(){
    const resizer = document.getElementById('historico-tramitacoes-resizer');
    const layout = document.getElementById('historico-tramitacoes-layout');
    if (!resizer || !layout || resizer._dragInit) return;
    resizer._dragInit = true;
    let dragging = false;
    let startX = 0;
    let startWidthTimeline = 0;
    resizer.addEventListener('mousedown', (e)=>{
      if (resizer.classList.contains('d-none')) return;
      dragging = true;
      startX = e.clientX;
      const body = document.getElementById('historico-tramitacoes-body');
      if (body) {
        startWidthTimeline = body.getBoundingClientRect().width;
      }
      layout.classList.add('dragging');
      resizer.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
    function onMove(e){
      if (!dragging) return;
      const layoutRect = layout.getBoundingClientRect();
      const delta = e.clientX - startX;
      const newWidth = startWidthTimeline + delta;
      const percent = (newWidth / layoutRect.width) * 100;
      applySplitWidths(percent);
    }
    function endDrag(){
      if (!dragging) return;
      dragging = false;
      layout.classList.remove('dragging');
      resizer.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', endDrag);
      document.removeEventListener('mouseleave', endDrag);
    }
    function onUp(){ endDrag(); }
    document.addEventListener('mouseleave', endDrag);
    window.addEventListener('blur', endDrag);
    document.addEventListener('mouseup', onUp);
  }

  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  function parseDateBR(dstr) {
    // Aceita "dd/mm/aaaa" e "dd/mm/aaaa HH:MM[:SS]"
    if (!dstr || !/\d{2}\/\d{2}\/\d{4}/.test(dstr)) return null;
    try {
      const [datePart, timePart] = String(dstr).trim().split(/\s+/);
      const [d,m,a] = datePart.split('/').map(Number);
      let hh = 0, mm = 0, ss = 0;
      if (timePart && /\d{2}:\d{2}(?::\d{2})?/.test(timePart)) {
        const t = timePart.split(':').map(Number);
        hh = t[0] || 0; mm = t[1] || 0; ss = t[2] || 0;
      }
      const dt = new Date(a, m-1, d, hh, mm, ss, 0);
      return isNaN(dt.getTime()) ? null : dt;
    } catch(_) { return null; }
  }

  function diffDias(a, b) {
    // diferença inteira em dias entre duas datas (b - a), arredondando para baixo
    if (!(a instanceof Date) || !(b instanceof Date)) return null;
    const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    const ms = b0 - a0;
    return Math.max(0, Math.floor(ms / 86400000));
  }

  function diffHoras(a, b) {
    // diferença inteira em horas (b - a), arredondando para baixo
    if (!(a instanceof Date) || !(b instanceof Date)) return null;
    const ms = b - a;
    return Math.max(0, Math.floor(ms / 3600000));
  }

  function hojeBRDate() {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), h.getDate(), 0,0,0,0);
  }

  function obterNumeroDoTR(tr) {
    if (!tr) return '';
    const cell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    if (!cell) return '';
    let texto = (cell.dataset && cell.dataset.processoNumero) ? cell.dataset.processoNumero : (cell.textContent || '');
    texto = texto.replace('🔗','').trim();
    return normalizarNumero(texto);
  }

  // ================= Estilos =================
  function ensureTagStyles() {
    // Usa um bloco de estilos próprio para evitar colisão/curto-circuito com outros utilitários
    if (document.getElementById('historico-tramitacoes-styles')) return;
    const style = document.createElement('style');
    style.id = 'historico-tramitacoes-styles';
    style.textContent = `
      .tempo-acompanhamento-tag {
        display: inline-block;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        color: #1565c0;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        border: 1px solid #90caf9;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: default;
      }
      .tempo-acompanhamento-tag.tempo-padrao {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-color: #90caf9;
        color: #1565c0;
      }
      .tempo-acompanhamento-tag.tempo-hoje {
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border-color: #a5d6a7;
        color: #2e7d32;
      }

      /* Botão de histórico ao estilo do botão de refresh */
      .acomp-historico-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-left: 6px;
        border-radius: 4px;
        background: #eef2ff; /* azul arroxeado claro */
        color: #4338ca; /* indigo-700 */
        border: 1px solid #c7d2fe; /* indigo-200 */
        cursor: pointer;
      }
      .acomp-historico-btn:hover { background: #e0e7ff; }
      .acomp-historico-btn[disabled] { opacity: .6; cursor: not-allowed; }
      .acomp-historico-btn svg { width: 18px; height: 18px; display: block; }

  /* Contenção e rolagem dentro do modal */
  #historico-tramitacoes-overlay .modal-content { overflow: hidden; display: flex; flex-direction: column; }
  #historico-tramitacoes-overlay .modal-header { flex: 0 0 auto; }
  #historico-tramitacoes-overlay .flex-fill { flex: 1 1 auto; min-height: 0; }
  #historico-tramitacoes-overlay .historico-body { height: 100%; min-height: 0; overflow: auto; }

  /* Conteúdo do histórico */
  .historico-body { padding: 12px 16px; }
  .historico-section { margin-bottom: 14px; }
  /* Linha azul de destaque usando a cor padrão do projeto */
  .historico-group { border: 1px solid #e5e7eb; border-left: 4px solid var(--brand-primary); border-radius: 8px; padding: 12px; background: #ffffff; margin-bottom: 16px; }
  .historico-group .historico-title { margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
      .historico-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; background: #fafafa; }
      .historico-title { font-weight: 700; color: #111827; margin-bottom: 6px; }
  .historico-sub { color: #374151; }
      .setor-pill { display:flex; align-items:center; justify-content: space-between; gap: 8px; }
      .setor-nome { font-weight: 600; color: #1f2937; }
      .timeline-dates { color: #4b5563; font-size: 12px; margin-top: 2px; }
  /* Ações na linha do tempo */
  .timeline-dates .acao-verde { color: #2e7d32; }
  .acao-tag { display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 700; border: 1px solid transparent; }
  .acao-tag.acao-verde { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-color: #a5d6a7; color: #2e7d32; }
  /* Peças produzidas */
  .pecas-produzidas { margin-top:10px; padding-top:8px; border-top:1px dashed #d1d5db; }
  .pecas-produzidas .pecas-title { font-size:11px; letter-spacing:.5px; font-weight:700; color:#374151; margin-bottom:4px; }
  .pecas-produzidas ul.lista-pecas { list-style: disc; padding-left:18px; margin:0; display:block; }
  .pecas-produzidas ul.lista-pecas li { font-size:12px; margin-bottom:2px; color:#1f2937; }
  .pecas-produzidas ul.lista-pecas li span.doc-data { color:#4b5563; }
  .pecas-produzidas ul.lista-pecas li { display:flex; align-items:center; gap:6px; }
  .peca-doc-btn { border:1px solid #d2e3fc; background:#eef3f8; color:#1a73e8; width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; cursor:pointer; flex:0 0 auto; }
  .peca-doc-btn:hover { background:#e2ecf7; }
  .peca-doc-btn svg { width:16px; height:16px; display:block; }
  .pecas-produzidas ul.lista-pecas li.disabled-doc { opacity:.6; cursor:not-allowed; }
  .peca-doc-btn.disabled { opacity:.6; cursor:not-allowed; pointer-events:none; }
  /* Viewer embutido */
  #historico-tramitacoes-overlay .modal-content.expanded { width:98vw !important; max-width:98vw !important; }
  .historico-layout { width:100%; height:100%; display:flex; }
  .historico-layout.expanded .historico-body { flex:1 1 55%; }
  .historico-layout .historico-body { flex:1 1 auto; min-width:0; }
  .historico-viewer { flex:0 0 45%; display:flex; flex-direction:column; border-left:1px solid #e5e7eb; background:#f8f9fa; height:100%; }
  .historico-viewer.d-none { display:none; }
  .historico-viewer-header { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:6px 8px; background:#ffffff; border-bottom:1px solid #e5e7eb; }
  .viewer-close-btn { border:1px solid #cbd5e1; background:#ffffff; color:#1f2937; padding:4px 8px; font-size:12px; border-radius:4px; cursor:pointer; }
  .viewer-close-btn:hover { background:#f1f5f9; }
  #historico-tramitacoes-iframe { flex:1 1 auto; width:100%; border:0; background:#f1f5f9; }
  @media (max-width:1100px) { #historico-tramitacoes-overlay .modal-content.expanded { width:100vw !important; } }
  /* Resizer */
  .historico-resizer { width:6px; cursor:col-resize; background:linear-gradient(180deg,#e2e8f0 0%, #cbd5e1 100%); position:relative; flex:0 0 6px; }
  .historico-resizer:hover { background:linear-gradient(180deg,#cbd5e1 0%, #94a3b8 100%); }
  .historico-resizer::after { content:''; position:absolute; inset:0; box-shadow:inset 0 0 0 1px #94a3b8; opacity:.3; }
  .historico-layout.dragging, .historico-resizer.dragging { user-select:none; }
  .historico-layout.dragging #historico-tramitacoes-iframe { pointer-events:none !important; }
  /* Destaque da autuação (independente da posição de data) */
  .historico-item.autuacao-highlight { border-left:4px solid var(--brand-primary); background:linear-gradient(135deg,#f0f7ff 0%, #ffffff 70%); }
  .historico-item.autuacao-highlight .setor-nome::after { content:' (Início)'; font-weight:400; color:#2563eb; }
  /* Destaque de PARECER EMITIDO */
  .historico-item.parecer-highlight { border-left:4px solid #2e7d32; background:linear-gradient(135deg,#e8f5e9 0%, #ffffff 70%); }
  /* Estilo para a seção de informações do processo */
  .processo-info .historico-item { background: #f8f9fa; border-color: #dee2e6; }
  .processo-info .setor-nome { color: #495057; font-weight: 600; }
  .processo-info .historico-sub { margin-top: 4px; font-size: 14px; line-height: 1.4; }
    `;
    document.head.appendChild(style);
  }

  // Ícone (Bootstrap Icons - clock-history)
  const SVG_HISTORY = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8.515 1.019A7 7 0 0 0 8 1a7 7 0 1 0 6.48 9.271.5.5 0 1 0-.936-.352A6 6 0 1 1 8 2a.5.5 0 0 0 .515-.981z"/>
      <path d="M7.5 3a.5.5 0 0 1 .5.5v4.21l3.248 1.856a.5.5 0 1 1-.496.868l-3.5-2A.5.5 0 0 1 7 8V3.5a.5.5 0 0 1 .5-.5z"/>
    </svg>`;
  // Ícone de documento reutilizado
  const SVG_JOURNALS = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journals" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2"/>
    <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V9h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 2.5v.5H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H2v-.5a.5.5 0 0 0-1 0"/>
  </svg>`;
  const API_DOC_ARQUIVO = 'https://api-add.tce.ce.gov.br/arquivos/documento?documento_id=';

  // ================= Cálculo de históricos =================
  function buildTimeline(raw) {
    const tram = Array.isArray(raw && raw.tramites) ? raw.tramites.slice() : [];
    // Normalizar eventos com data e destino
    const eventos = tram
      .map(t => ({
        id: t && t.id,
        dataStr: t && t.data,
        data: parseDateBR(t && t.data),
        hasTime: !!(t && t.data && /\d{2}:\d{2}/.test(String(t.data))) ,
        origem: t && t.setorOrigem ? (t.setorOrigem.descricao || '') : '',
        origemId: t && t.setorOrigem ? (t.setorOrigem.id ?? null) : null,
        destino: t && t.setorDestino ? (t.setorDestino.descricao || '') : '',
        destinoId: t && t.setorDestino ? (t.setorDestino.id ?? null) : null,
        acao: t && t.acao ? (t.acao.descricao || '') : ''
      }))
      .filter(e => e.data instanceof Date)
      .sort((a,b)=> a.data - b.data || (a.id||0) - (b.id||0));

    // Inserir um "pré-evento" usando a data de autuação para contabilizar o período
    // em que o processo permaneceu no setor de ORIGEM do primeiro trâmite, até o
    // próprio primeiro trâmite. Isso garante que o início (incluindo ANDAMENTO INICIAL)
    // seja sempre considerado na linha do tempo e nos totais.
    try {
      const dtAut = parseDateBR(raw && raw.dtAutuacao);
      if (dtAut instanceof Date && eventos.length > 0) {
        const primeiro = eventos[0];
        // Apenas se a autuação não for posterior ao primeiro registro
        if (primeiro.data && dtAut <= primeiro.data) {
          eventos.unshift({
            id: 'autuacao',
            dataStr: raw.dtAutuacao,
            data: dtAut,
            hasTime: /\d{2}:\d{2}/.test(String(raw.dtAutuacao || '')),
            // Antes do primeiro trâmite, o processo está no setor de ORIGEM desse primeiro trâmite
            origem: '',
            origemId: null,
            destino: primeiro.origem || (raw.setor && raw.setor.descricao) || '(setor inicial)',
            destinoId: primeiro.origemId ?? (raw.setor && raw.setor.id) ?? null,
            acao: 'AUTUAÇÃO',
            _synthetic: 'autuacao'
          });
        }
      }
    } catch(_) { /* noop */ }

    // ================= Ajuste de ordenação inicial =================
    // Mantemos SEMPRE o evento de AUTUAÇÃO sintético (quando criado) como primeiro, pois ele
    // representa o período inicial antes do primeiro trâmite. A regra de "forçar" RECEBIMENTO
    // NO PROTOCOLO ou ANDAMENTO INICIAL como primeiro estava causando a remoção/pulo da autuação.
    // Agora só aplicamos a priorização se NÃO houver evento sintético de autuação na posição 0.
    try {
      const temAutuacaoInicial = !!(eventos[0] && eventos[0]._synthetic === 'autuacao');
      if (!temAutuacaoInicial) {
        const norm = v => (v||'').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().trim();
        let idxReceb = eventos.findIndex(e => norm(e.acao) === 'RECEBIMENTO NO PROTOCOLO');
        let idxAnd   = eventos.findIndex(e => norm(e.acao) === 'ANDAMENTO INICIAL');
        let moved = false;
        if (idxReceb > 0) {
          const ev = eventos.splice(idxReceb,1)[0];
          // Não remover eventos de autuação (não existem aqui se !temAutuacaoInicial)
          eventos.unshift(ev);
          moved = true;
        } else if (idxReceb === -1 && idxAnd > 0) {
          const ev = eventos.splice(idxAnd,1)[0];
          eventos.unshift(ev);
          moved = true;
        }
        if (moved && eventos.length > 1) {
          const head = eventos[0];
          const tail = eventos.slice(1).sort((a,b)=> a.data - b.data || (a.id||0) - (b.id||0));
          eventos.length = 0; eventos.push(head, ...tail);
        }
      }
    } catch(_) { /* ignore reorder issues */ }

    const hoje = hojeBRDate();
    const stints = [];
    for (let i=0; i<eventos.length; i++) {
      const ev = eventos[i];
      const prox = eventos[i+1];
      const inicio = ev.data; // com hora quando disponível
      // Para o último trecho, usar "agora" para permitir cálculo em horas (mas não considerar como info oficial de hora)
      const fim = prox ? prox.data : new Date();
      const dias = diffDias(inicio, fim);
      const horas = (dias === 0) ? diffHoras(inicio, fim) : null;
      const hasTimeStart = !!ev.hasTime;
      const hasTimeEnd = !!(prox && prox.hasTime); // último trecho usa "agora" e não conta como info de hora vinda da API
      stints.push({
        // "setor" representa SEMPRE o DESTINO do evento (onde o processo permanecerá até o próximo evento)
        setorId: ev.destinoId,
        setor: ev.destino || '(sem setor)',
        origem: ev.origem || '',
        origemId: ev.origemId ?? null,
        destino: ev.destino || '',
        destinoId: ev.destinoId ?? null,
        inicio,
        fim,
        dias: (dias==null?0:dias),
        horas: horas,
        hasTimeStart,
        hasTimeEnd,
  acao: ev.acao || '', // mantido por retrocompatibilidade
  acaoOriginal: ev.acao || '',
  nextAcao: prox && prox.acao ? (prox.acao || '') : '', // mantido para retrocompatibilidade, mas não usado na exibição principal
    ateAgora: !prox,
        _synthetic: ev._synthetic || null,
        docs: [] // será preenchido posteriormente
      });
    }
    // ================= Cálculo de acaoSaida =================
    // Para cada período (stint) queremos mostrar a ação que ENCERROU a permanência naquele setor,
    // exceto para o período de AUTUAÇÃO (que mostra sua própria ação) e para o último período em andamento.
    try {
      for (let i=0;i<stints.length;i++) {
        const s = stints[i];
        const prox = stints[i+1];
        if (prox && s._synthetic !== 'autuacao') {
          s.acaoSaida = prox.acaoOriginal || '';
        } else {
          s.acaoSaida = null; // último ou autuação
        }
      }
    } catch(_) { /* silencioso */ }

    // Agregado por setor (somar dias de múltiplas passagens)
    const totalsMap = new Map(); // key -> { setor, totalDias, passagens }
    stints.forEach(s => {
      const key = (s.setorId != null) ? `id:${s.setorId}` : `nm:${s.setor}`;
      const cur = totalsMap.get(key) || { setor: s.setor, totalDias: 0, passagens: 0 };
      cur.totalDias += (s.dias||0);
      cur.passagens += 1;
      totalsMap.set(key, cur);
    });

    // ================= Vincular documentos aos períodos =================
    try {
      const docsRaw = (raw && raw.documentos && Array.isArray(raw.documentos.documentosPrincipal)) ? raw.documentos.documentosPrincipal : [];
      const docsNorm = docsRaw.map(d => ({
        raw: d,
  id: (d && (d.id || d.id === 0)) ? d.id : null,
        tipo: d && d.tipoAtoDocumento ? (d.tipoAtoDocumento.descricao || '') : '',
        numero: (d && (d.numero || d.numero === 0)) ? d.numero : null,
        ano: (d && (d.ano || d.ano === 0)) ? d.ano : null,
        dataStr: d && d.dataFinalizacao,
        data: parseDateBR(d && d.dataFinalizacao),
        setorId: d && d.setor ? (d.setor.id ?? null) : null,
  setor: d && d.setor ? (d.setor.descricao || '') : '',
  exibir: d && d.exibirDocumento !== false
      })).filter(d => d.data instanceof Date);
      docsNorm.sort((a,b)=> a.data - b.data);
      stints.forEach((s, idx) => {
        const inicio = s.inicio;
        const fim = s.fim; // data do próximo evento (ou agora)
        const prox = stints[idx+1] || null;
        s.docs = docsNorm.filter(d => {
          if (!(d.data instanceof Date)) return false;
          // Identificadores de data simples (ignorando hora, pois não recebemos hora na maior parte dos casos)
          const dY = d.data.getFullYear(), dM = d.data.getMonth(), dD = d.data.getDate();
          const iY = inicio.getFullYear(), iM = inicio.getMonth(), iD = inicio.getDate();
          const fY = fim.getFullYear(), fM = fim.getMonth(), fD = fim.getDate();
          const mesmaDataInicio = (dY===iY && dM===iM && dD===iD);
          const mesmaDataFim = (dY===fY && dM===fM && dD===fD);

          let matchIntervalo;
          if (s.ateAgora) {
            // Último: inclusivo no início e na "data atual" (fim artificial)
            matchIntervalo = d.data >= inicio && d.data <= fim;
          } else if (s.dias === 0) {
            // Permanência de "No mesmo dia": se documento no mesmo dia da permanência
            // e (quando possível) setor compatível
            matchIntervalo = mesmaDataInicio; // mesmaDataInicio == mesmaDataFim nesse caso
          } else {
            // Permanência com mais de um dia: início inclusivo, fim exclusivo
            matchIntervalo = (d.data >= inicio && d.data < fim);
            // EXCEÇÃO: documento exatamente no dia da saída (mesmaDataFim) mas setor ainda é o do stint e
            // o próximo setor é diferente -> atribuir ao período atual (documento produzido na transição)
            if (!matchIntervalo && mesmaDataFim) {
              const proximoSetorId = prox ? prox.setorId : null;
              if (s.setorId != null && d.setorId === s.setorId && s.setorId !== proximoSetorId) {
                matchIntervalo = true;
              }
            }
          }
          if (!matchIntervalo) return false;
          if (s.setorId != null && d.setorId != null) return s.setorId === d.setorId; // restringe por setor quando IDs disponíveis
          return true; // fallback se algum id ausente
        });
      });
      // Reatribuição especial: documentos do setor 'EXTERNO AO TCE'
      // agora devem ser vinculados SEMPRE à stint de AUTUAÇÃO (primeiro período),
      // pois representam peças associadas ao ato inicial de formação do processo.
      try {
        const norm = (v) => (v||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().replace(/\s+/g,' ').trim();
        const externos = docsNorm.filter(d => d && (d.setorId === 81 || (d.setor && norm(d.setor).includes('EXTERNO AO TCE'))));
        if (externos.length) {
          // Localiza stint de autuação (sintética ou real) – ela deve estar no início.
            const stintAutuacao = stints.find(s => s._synthetic === 'autuacao' || norm(s.acao) === 'AUTUACAO');
          if (stintAutuacao) {
            externos.forEach(doc => {
              // Remove o doc de quaisquer outras stints
              stints.forEach(s => { if (s !== stintAutuacao) { const iDoc = s.docs.indexOf(doc); if (iDoc >= 0) s.docs.splice(iDoc,1); } });
              if (!stintAutuacao.docs.includes(doc)) stintAutuacao.docs.push(doc);
            });
          }
        }
      } catch(_) { /* silencioso */ }
    } catch(_) { /* silencioso */ }

    const totals = Array.from(totalsMap.values()).sort((a,b)=> b.totalDias - a.totalDias || a.setor.localeCompare(b.setor));
    return { stints, totals };
  }

  function renderTempoTag(dias) {
    // Versão para agregados (Sumário): sem horas disponíveis
    if (dias === null || dias === undefined || dias < 0) return '<span class="tempo-acompanhamento-tag tempo-padrao">-</span>';
    const isMesmoDia = dias === 0;
    const plural = dias === 1 ? 'dia' : 'dias';
    const texto = isMesmoDia ? 'No mesmo dia' : `${dias} ${plural}`;
    const cls = isMesmoDia ? 'tempo-hoje' : 'tempo-padrao';
    return `<span class="tempo-acompanhamento-tag ${cls}" title="${isMesmoDia ? 'Permanência no mesmo dia' : `Permaneceu ${texto}`}">${texto}</span>`;
  }

  function renderTempoTagComHoras(dias, horas) {
    // Usada na linha do tempo: se < 1 dia, exibe horas quando disponíveis
    if (dias === null || dias === undefined || dias < 0) return '<span class="tempo-acompanhamento-tag tempo-padrao">-</span>';
    if (dias > 0) return renderTempoTag(dias);
    // dias === 0
    if (typeof horas === 'number' && horas >= 0) {
      const pluralH = horas === 1 ? 'hora' : 'horas';
      return `<span class="tempo-acompanhamento-tag tempo-hoje" title="Permanência inferior a 1 dia">${horas} ${pluralH}</span>`;
    }
    return `<span class="tempo-acompanhamento-tag tempo-hoje" title="Permanência no mesmo dia">No mesmo dia</span>`;
  }

  // ================= Modal =================
  function ensureModal() {
    if (document.getElementById('historico-tramitacoes-overlay')) return;
    ensureTagStyles();
    const overlay = document.createElement('div');
    overlay.id = 'historico-tramitacoes-overlay';
    overlay.className = 'modal-overlay d-none position-fixed top-0 start-0 w-100 h-100';
    overlay.style.cssText = 'display:none; background: rgba(0,0,0,0.5); align-items: center; justify-content: center;';
    overlay.innerHTML = `
      <div class="modal-content position-relative bg-white rounded d-flex flex-column" style="width: 50vw; height: 90vh; max-width: 1200px;">
        <div class="modal-header p-3 text-white rounded-top-2 d-flex justify-content-between align-items-center" style="background: var(--brand-primary);">
          <h5 id="historico-tramitacoes-title" class="mb-0 text-white">Histórico de Tramitações</h5>
          <button id="historico-tramitacoes-close" class="btn-close btn-close-white" type="button" aria-label="Close"></button>
        </div>
        <div class="flex-fill p-3 position-relative">
          <div id="historico-tramitacoes-layout" class="historico-layout">
            <div class="historico-body" id="historico-tramitacoes-body"></div>
            <div class="historico-resizer d-none" id="historico-tramitacoes-resizer" aria-hidden="true"></div>
            <div class="historico-viewer d-none" id="historico-tramitacoes-viewer" aria-hidden="true">
              <div class="historico-viewer-header">
                <strong style="font-size:12px;">Visualização do Documento</strong>
                <button type="button" class="viewer-close-btn" id="historico-tramitacoes-viewer-close" aria-label="Fechar PDF">Fechar</button>
              </div>
              <iframe id="historico-tramitacoes-iframe" title="Visualizador de documento PDF"></iframe>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Registro no ModalManager (mesmo padrão de DocumentosDoProcessso.js)
    const register = () => {
      if (window.modalManager && typeof window.modalManager.registerModal === 'function') {
        window.modalManager.registerModal('historico-tramitacoes-modal', {
          overlay: 'historico-tramitacoes-overlay',
          content: '.modal-content',
          closeButtons: ['historico-tramitacoes-close'],
          type: 'content'
        });
      } else {
        setTimeout(register, 150);
      }
    };
    register();

    // Fechar no X (fallback)
    overlay.querySelector('#historico-tramitacoes-close').addEventListener('click', (e)=>{
      e.preventDefault();
      resetHistoricoLayout();
      if (window.modalManager) window.modalManager.closeModal('historico-tramitacoes-modal');
      else overlay.style.display = 'none';
    });
    // Fechar clicando fora do conteúdo
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay) {
        e.preventDefault();
        resetHistoricoLayout();
        if (window.modalManager) window.modalManager.closeModal('historico-tramitacoes-modal');
        else overlay.style.display = 'none';
      }
    });
  }

  function openHistoricoModal(numero, dataRaw, meta = {}) {
    ensureModal();
    const overlay = document.getElementById('historico-tramitacoes-overlay');
    const title = document.getElementById('historico-tramitacoes-title');
    const body = document.getElementById('historico-tramitacoes-body');
  // Garante estado inicial sempre
  resetHistoricoLayout();
  // Sempre reset do viewer
  try { const iframe = document.getElementById('historico-tramitacoes-iframe'); if (iframe) iframe.removeAttribute('src'); } catch(_) {}
  try { const mc = overlay.querySelector('.modal-content'); mc && mc.classList.remove('expanded'); } catch(_) {}
  try { const layout = document.getElementById('historico-tramitacoes-layout'); layout && layout.classList.remove('expanded'); } catch(_) {}
  try { const viewer = document.getElementById('historico-tramitacoes-viewer'); if (viewer){ viewer.classList.add('d-none'); viewer.setAttribute('aria-hidden','true'); } } catch(_) {}
    if (!overlay || !title || !body) return;
    const idPca = (meta && meta.idPca) ? String(meta.idPca).trim() : '';
    const projectName = (meta && meta.projectName) ? String(meta.projectName).trim() : '';
    const parts = [];
    if (idPca) parts.push(idPca);
    if (projectName) parts.push(projectName);
    const left = parts.length ? parts.join(' - ') : 'Histórico de Tramitações';
    const right = numero ? ` — ${numero}` : '';
    title.textContent = `${left}${right}`;
    body.innerHTML = '';

    // Adicionar informações do processo (assunto e espécie) antes do histórico
    const processInfo = document.createElement('div');
    processInfo.className = 'historico-section historico-group processo-info';
    
    const assunto = (dataRaw && dataRaw.assunto) ? String(dataRaw.assunto).trim() : '';
    const especie = (dataRaw && dataRaw.especie && dataRaw.especie.descricao) ? String(dataRaw.especie.descricao).trim() : '';
    
    if (assunto || especie) {
      const infoTitle = document.createElement('div');
      infoTitle.className = 'historico-title';
      infoTitle.textContent = 'Informações do Processo';
      processInfo.appendChild(infoTitle);
      
      if (assunto) {
        const assuntoItem = document.createElement('div');
        assuntoItem.className = 'historico-item';
        assuntoItem.innerHTML = `
          <div class="setor-pill">
            <div>
              <div class="setor-nome">Assunto</div>
              <div class="historico-sub">${assunto}</div>
            </div>
          </div>`;
        processInfo.appendChild(assuntoItem);
      }
      
      if (especie) {
        const especieItem = document.createElement('div');
        especieItem.className = 'historico-item';
        especieItem.innerHTML = `
          <div class="setor-pill">
            <div>
              <div class="setor-nome">Espécie</div>
              <div class="historico-sub">${especie}</div>
            </div>
          </div>`;
        processInfo.appendChild(especieItem);
      }
      
      body.appendChild(processInfo);
    }

    const { stints, totals } = buildTimeline(dataRaw || {});

    if (!stints.length) {
      const div = document.createElement('div');
      div.className = 'historico-item';
      div.textContent = 'Nenhum trâmite encontrado para este processo.';
      body.appendChild(div);
    } else {
      // Linha do tempo (primeiro)
      const s2 = document.createElement('div');
      s2.className = 'historico-section historico-group';
      const h2 = document.createElement('div');
      h2.className = 'historico-title';
      h2.textContent = 'Linha do tempo';
      s2.appendChild(h2);
      // Exibir em ordem decrescente (mais recentes primeiro) forçando AUTUAÇÃO como último, independentemente da data
      const normAcao = v => (v||'').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase();
      // Regras de ordenação especial:
      // Último: AUTUAÇÃO
      // Penúltimo: RECEBIMENTO NO PROTOCOLO (se existir)
      // Antepenúltimo: ANDAMENTO INICIAL (se existir)
      // Restante: ordem decrescente por data (mais recentes primeiro) antes dos especiais.
      const stintsProcessed = stints.slice().sort((a,b) => {
        const aAc = normAcao(a.acao);
        const bAc = normAcao(b.acao);
        const aIsAut = (a._synthetic === 'autuacao') || ['AUTUACAO','AUTUAÇÃO'].includes(aAc);
        const bIsAut = (b._synthetic === 'autuacao') || ['AUTUACAO','AUTUAÇÃO'].includes(bAc);
        const aIsReceb = aAc === 'RECEBIMENTO NO PROTOCOLO';
        const bIsReceb = bAc === 'RECEBIMENTO NO PROTOCOLO';
        const aIsAnd = aAc === 'ANDAMENTO INICIAL';
        const bIsAnd = bAc === 'ANDAMENTO INICIAL';
        // Ranking: 0=normal, 1=ANDAMENTO INICIAL, 2=RECEBIMENTO NO PROTOCOLO, 3=AUTUAÇÃO
        const rankA = aIsAut ? 3 : (aIsReceb ? 2 : (aIsAnd ? 1 : 0));
        const rankB = bIsAut ? 3 : (bIsReceb ? 2 : (bIsAnd ? 1 : 0));
        if (rankA !== rankB) return rankA - rankB; // menor rank em cima
        // Dentro do mesmo rank (inclusive múltiplos ANDAMENTO ou RECEBIMENTO, se houver), ordenar por data desc
        const ai = a.inicio ? a.inicio.getTime() : 0;
        const bi = b.inicio ? b.inicio.getTime() : 0;
        if (bi !== ai) return bi - ai;
        const af = a.fim ? a.fim.getTime() : 0;
        const bf = b.fim ? b.fim.getTime() : 0;
        return bf - af;
      });
      stintsProcessed.forEach((s) => {
        const item = document.createElement('div');
        item.className = 'historico-item';
        const isAut = (s._synthetic === 'autuacao') || normAcao(s.acao) === 'AUTUACAO' || normAcao(s.acao) === 'AUTUAÇÃO';
        if (isAut) item.classList.add('autuacao-highlight');
        const dtIni = s.inicio ? s.inicio.toLocaleDateString('pt-BR') : '';
        const dtFim = s.ateAgora ? '—' : (s.fim ? s.fim.toLocaleDateString('pt-BR') : '');
  const setorTitulo = s.setor || s.destino || '(sem setor)';
  // Regra de exibição: se não for autuação e houver acaoSaida, mostrar acaoSaida; caso contrário mostrar acaoOriginal.
  let acaoMostrar = '';
  if (s._synthetic === 'autuacao') acaoMostrar = s.acaoOriginal || s.acao || '';
  else if (s.acaoSaida) acaoMostrar = s.acaoSaida;
  else acaoMostrar = s.acaoOriginal || s.acao || '';
  const acaoSaida = acaoMostrar;
  const isParecerEmitido = typeof acaoMostrar === 'string' && acaoMostrar.trim().toUpperCase() === 'PARECER EMITIDO';
  // Verificar se há peça produzida "parecer jurídico" neste stint
  const hasParecerJuridico = s.docs && s.docs.some(d => 
    d.tipo && d.tipo.toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().includes('PARECER JURIDICO')
  );
  if (isParecerEmitido || hasParecerJuridico) item.classList.add('parecer-highlight');
        // Quando o processo ainda está no setor (trecho em andamento) e com 0 dias, exibe "Hoje"
        const tempoTagHtml = (s.ateAgora && s.dias === 0)
          ? '<span class="tempo-acompanhamento-tag tempo-hoje" title="Hoje">Hoje</span>'
          : renderTempoTag(s.dias);
        // Bloco de peças produzidas
        const escapeHtml = (str) => String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] || c));
    const pecasHtml = (s.docs && s.docs.length) ? `<div class=\"pecas-produzidas\"><div class=\"pecas-title\">PEÇAS PRODUZIDAS</div><ul class=\"lista-pecas\">${s.docs.map(d=>{
          const numeroParte = (d.numero!=null && d.ano!=null) ? `${d.numero}/${d.ano}` : (d.numero!=null? d.numero : '');
          const dataParte = d.data ? d.data.toLocaleDateString('pt-BR') : (d.dataStr||'');
          const tipo = escapeHtml(d.tipo);
          const numero = numeroParte ? ` - ${escapeHtml(numeroParte)}` : '';
          const data = dataParte ? ` (<span class=\"doc-data\">${escapeHtml(dataParte)}</span>)` : '';
            const canOpen = (d.id!=null) && d.exibir !== false && d.exibir !== null && d.exibir !== undefined;
            const btn = (d.id!=null) ? `<button type=\"button\" class=\"peca-doc-btn${canOpen? '':' disabled'}\" ${canOpen? '' : 'aria-disabled=\"true\"'} data-doc-id=\"${escapeHtml(d.id)}\" title=\"${canOpen? 'Abrir PDF':'Documento indisponível'}\">${SVG_JOURNALS}</button>` : '';
            const liClass = canOpen ? '' : ' class=\"disabled-doc\"';
      // Texto primeiro, botão à direita (margin-left:auto)
      return `<li${liClass}><span>${tipo}${numero}${data}</span>${btn}</li>`;
        }).join('')}</ul></div>` : '';
        item.innerHTML = `
          <div class="setor-pill">
            <div>
              <div class="setor-nome">${setorTitulo}</div>
              <div class="timeline-dates">Entrada: ${dtIni}</div>
              <div class="timeline-dates">Saída: ${dtFim}</div>
              ${acaoSaida ? `<div class=\"timeline-dates\">${(isParecerEmitido || hasParecerJuridico) ? `<span class=\"acao-tag acao-verde\"><strong>${acaoSaida}</strong></span>` : `<strong>${acaoSaida}</strong>`}</div>` : ''}
            </div>
            <div>${tempoTagHtml}</div>
          </div>${pecasHtml}`;
        s2.appendChild(item);
      });
      body.appendChild(s2);

      // Sumário por setor (depois)
      const s1 = document.createElement('div');
      s1.className = 'historico-section historico-group';
      const h1 = document.createElement('div');
      h1.className = 'historico-title';
      h1.textContent = 'Sumário por setor';
      s1.appendChild(h1);
      totals.forEach(t => {
        const item = document.createElement('div');
        item.className = 'historico-item';
        item.innerHTML = `<div class="setor-pill">
          <div class="setor-nome">${t.setor}</div>
          <div>${renderTempoTag(t.totalDias)}</div>
        </div>
        <div class="historico-sub">Passagens: ${t.passagens}</div>`;
        s1.appendChild(item);
      });
      body.appendChild(s1);
      // Ativar botões de documento
      body.querySelectorAll('.peca-doc-btn').forEach(btn => {
  initResizerDrag();
        btn.addEventListener('click', (e)=>{
          if (btn.classList.contains('disabled')) return;
          e.preventDefault();
          const id = btn.getAttribute('data-doc-id');
          openDocViewer(id);
        });
      });
      const closeBtn = document.getElementById('historico-tramitacoes-viewer-close');
      if (closeBtn && !closeBtn._histBound) {
  closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); resetHistoricoLayout(); });
        closeBtn._histBound = true;
      }
    }

  if (window.modalManager) window.modalManager.openModal('historico-tramitacoes-modal');
  else overlay.style.display = 'flex';
  
  // Rolar para o topo do conteúdo do modal
  setTimeout(() => {
    try {
      const modalBody = document.getElementById('historico-tramitacoes-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    } catch(_) {}
  }, 50); // pequeno delay para garantir que o modal foi renderizado
  }

  // ================= Dados / Cache / Fetch =================
  async function ensureProcessData(numero) {
    const num = normalizarNumero(numero);
    const shared = getSharedProcessCache();
    if (shared && shared.has(num) && shared.get(num) && shared.get(num).raw) {
      return shared.get(num).raw;
    }
    // Tenta reaproveitar módulo de documentos, se existir
    try {
      const mod = (window && window.debugDocumentosProcesso) ? window.debugDocumentosProcesso : null;
      if (mod && typeof mod.buscarPorNumero === 'function') {
        const r = await mod.buscarPorNumero(num, { force: true });
        // esperar que o módulo preencha seu cache; procurar no compartilhado
        if (shared && shared.has(num) && shared.get(num).raw) return shared.get(num).raw;
        if (r && r.raw) return r.raw;
      }
    } catch(_) {}

    // Fallback: chamada direta à API por número (compatível com AcompanhamentoProcessos.js)
    try {
      const resp = await fetch('https://api-processos.tce.ce.gov.br/processos/porNumero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: num })
      });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();
      const item = data && data.data && Array.isArray(data.data.lista) ? data.data.lista[0] : null;
      // Sincroniza no cache compartilhado no formato esperado
      const entry = { raw: item || null, documentos: [], sigiloso: !!(item && item.sigiloso) };
      shared.set(num, entry);
      return item;
    } catch(err) {
      console.error('[HistoricoTramitacoes] Falha ao buscar processo', num, err);
      throw err;
    }
  }

  // ================= Botão nos TRs =================
  function ensureHistoryButtonForTR(tr) {
    if (!tr) return;
    const acompCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
    if (!acompCell) return;
    // Evitar botões em linhas sem número
    const numero = obterNumeroDoTR(tr);
    if (!numero) {
      const existing = acompCell.querySelector('.acomp-historico-btn');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }
    // Se já existir, garantir que esteja após o .doc-icon-btn
    const existingBtn = acompCell.querySelector('.acomp-historico-btn');
    const currentDocBtn = acompCell.querySelector('.doc-icon-btn');
    const docWrapper = acompCell.querySelector('.doc-icon-wrapper');
    if (existingBtn) {
      // Prefira posicionar após o wrapper de documentos (fora do wrapper)
      if (docWrapper && existingBtn.previousElementSibling !== docWrapper) {
        docWrapper.insertAdjacentElement('afterend', existingBtn);
      } else if (!docWrapper && currentDocBtn && existingBtn.previousElementSibling !== currentDocBtn) {
        currentDocBtn.insertAdjacentElement('afterend', existingBtn);
      }
      return; // nada a criar
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'acomp-historico-btn';
    btn.title = 'Histórico de tramitações';
    btn.innerHTML = SVG_HISTORY;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const numero = obterNumeroDoTR(tr);
      if (!numero) return;
      btn.disabled = true;
      try {
        const raw = await ensureProcessData(numero);
        // Extrai Projeto e ID PCA da mesma linha (similar ao ModalManager)
        let projectName = '';
        let idPca = '';
        try {
          const table = tr.closest('table');
          let idxProjeto = -1;
          let idxId = -1;
          if (table) {
            const ths = Array.from(table.querySelectorAll('thead th'));
            idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
            idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
            if (idxProjeto >= 0 && tr.children[idxProjeto]) {
              projectName = tr.children[idxProjeto].textContent.trim();
            }
            if (idxId >= 0 && tr.children[idxId]) {
              idPca = tr.children[idxId].textContent.trim();
            }
          }
          if (!projectName) {
            const cand = Array.from(tr.children).find(c => /projeto/i.test((c.dataset && c.dataset.label) || ''));
            if (cand) projectName = cand.textContent.trim();
          }
          if (!idPca) {
            const cand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset && c.dataset.label) || ''));
            if (cand) idPca = cand.textContent.trim();
          }
        } catch(_) { /* ignore */ }
        openHistoricoModal(numero, raw || {}, { idPca, projectName });
      } catch(err) {
        // Feedback simples em caso de erro
        try { alert('Não foi possível carregar o histórico deste processo.'); } catch(_) {}
      } finally {
        btn.disabled = false;
      }
    });

    // Inserir imediatamente após o botão de documentos, se existir
    const docWrapper2 = acompCell.querySelector('.doc-icon-wrapper');
    const docBtn = acompCell.querySelector('.doc-icon-btn');
    if (docWrapper2 && docWrapper2.parentNode) {
      // Inserir imediatamente após o wrapper (fora dele)
      docWrapper2.insertAdjacentElement('afterend', btn);
    } else if (docBtn && docBtn.parentNode) {
      // Se não houver wrapper por algum motivo, posicionar após o botão
      const parent = docBtn.parentNode;
      if (parent && parent.classList && parent.classList.contains('doc-icon-wrapper')) {
        parent.insertAdjacentElement('afterend', btn);
      } else {
        docBtn.insertAdjacentElement('afterend', btn);
      }
    } else {
      // Fallback final: após o conteúdo existente da célula
      const tempoWrapper = acompCell.querySelector('.tempo-acompanhamento-wrapper');
      if (tempoWrapper) tempoWrapper.appendChild(btn);
      else acompCell.appendChild(btn);
    }
  }

  function insertButtonsForAllRows() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(ensureHistoryButtonForTR);
  }

  // Reinserir apenas para o número informado (útil em atualizações parciais)
  function insertButtonsForNumero(numero) {
    const nAlvo = normalizarNumero(numero);
    if (!nAlvo) return;
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
  if (obterNumeroDoTR(tr) === nAlvo) ensureHistoryButtonForTR(tr);
    });
  }

  // Observa mudanças de linhas (ex.: filtros que mostram/ocultam)
  function observeTableBody() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    const obs = new MutationObserver((muts)=>{
      let need = false;
      for (const m of muts) {
        if (m.type === 'childList' && (m.addedNodes && m.addedNodes.length)) { need = true; break; }
      }
      if (need) insertButtonsForAllRows();
    });
    obs.observe(tbody, { childList: true, subtree: false });
  }

  // ================= Wiring =================
  document.addEventListener('DOMContentLoaded', () => {
    ensureTagStyles();
    insertButtonsForAllRows();
    observeTableBody();
  initResizerDrag();
  });
  // Em alguns cenários, DOMContentLoaded já passou
  if (document.readyState !== 'loading') {
    ensureTagStyles();
    insertButtonsForAllRows();
    observeTableBody();
  initResizerDrag();
  }
  // Ao terminar de montar a tabela
  document.addEventListener('tabela-carregada', () => {
    // aguarda o AcompanhamentoProcessos aplicar o conteúdo (ele usa ~400ms)
    setTimeout(insertButtonsForAllRows, 600);
  });

  // Quando iniciar o loading nas células, reponha os botões imediatamente
  document.addEventListener('acompanhamento-loading', () => {
    // pequeno delay para garantir que o loading sobrescreveu o HTML
    setTimeout(insertButtonsForAllRows, 0);
  });

  // Depois do acompanhamento renderizar, reintroduz os botões na posição correta
  document.addEventListener('acompanhamento-atualizado', () => {
    // pequeno atraso para garantir DOM finalizado
    setTimeout(insertButtonsForAllRows, 50);
  });

  // Atualizações parciais: reintroduz o botão apenas na(s) linha(s) do número alterado
  document.addEventListener('acompanhamento-atualizado-parcial', (ev) => {
    try {
      const numero = ev && ev.detail && ev.detail.numero ? ev.detail.numero : '';
      if (numero) insertButtonsForNumero(numero);
    } catch(_) {}
  });

  // Expor para uso manual/debug
  window.historicoTramitacoes = {
    open: async function(numero){
      const raw = await ensureProcessData(numero);
      openHistoricoModal(normalizarNumero(numero), raw || {});
    },
    injectButtons: insertButtonsForAllRows,
  injectButtonsForNumero: insertButtonsForNumero,
  compute: buildTimeline,
  openDoc: openDocViewer,
  closeDoc: closeDocViewer,
  debug: async function(numero){
    try {
      const raw = await ensureProcessData(numero);
      const { stints } = buildTimeline(raw||{});
      console.group('[HistoricoTramitacoes][DEBUG] Stints do processo', numero);
      stints.forEach((s,i)=>{
        console.log(`#${i} setor=`, s.setor, '| acao=', s.acao, '| inicio=', s.inicio?.toLocaleString('pt-BR'), '-> fim=', s.fim?.toLocaleString('pt-BR'), s.ateAgora? '(ATE AGORA)':'');
      });
      // Detecção simples de "pulo": origem do próximo não bate com destino atual e não há stint intermediária com aquele setor
      const setoresListado = stints.map(s=>s.setor);
      const avisos = [];
      for (let i=0; i<stints.length-1; i++) {
        const atual = stints[i];
        const prox = stints[i+1];
        // Se prox.setor não aparece em nenhum stint anterior cronologicamente antes de atual (além dele próprio) e há diferença brusca de datas, apenas log informativo
        if (atual.setor === prox.setor) continue;
        // Se existir uma origem declarada em algum trâmite que não virou stint (difícil detectar sem raw), apenas placeholder
      }
      if (avisos.length) {
        console.warn('[HistoricoTramitacoes][DEBUG] Possíveis setores pulados:', avisos);
      } else {
        console.info('[HistoricoTramitacoes][DEBUG] Nenhum setor faltando detectado pela heurística.');
      }
      console.groupEnd();
      return stints;
    } catch(err){
      console.error('[HistoricoTramitacoes][DEBUG] Falha ao gerar debug', err);
    }
  }
  };
})();
