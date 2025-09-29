/**
 * DocumentosDoProcessso.js
 *
 * Objetivo:
 *  - Buscar metadados de documentos de cada processo via API /processos/porNumero
 *  - Inserir um ícone ao lado da tag de tempo (renderizada por AcompanhamentoProcessos.js)
 *  - Abrir um modal (usando ModalManager) com índice à esquerda e visualizador de PDF à direita
 *  - Link de assinaturas ao lado de cada item do índice
 *  - Caso o processo seja sigiloso (sem sessão "documentos"), mostrar ícone de cadeado com tooltip
 *
 * Dependências:
 *  - Arquivo AcompanhamentoProcessos.js para as tags de tempo e o evento 'acompanhamento-atualizado'
 *  - ModalManager.js para gerenciamento do modal
 */
(function(){
  const API_POR_NUMERO = 'https://api-processos.tce.ce.gov.br/processos/porNumero';
  const API_DOC_ARQUIVO = 'https://api-add.tce.ce.gov.br/arquivos/documento?documento_id=';
  // API de assinaturas (corrigida conforme especificação do usuário)
  const API_DOC_ASSINATURAS = 'https://api-processos.tce.ce.gov.br/documento/assinaturas?documento_id=';

  // Cache de respostas por número de processo
  const cacheProcessoDocs = new Map(); // numero -> { raw, documentos: [], sigiloso: boolean }
  // Cache de assinaturas por documento
  const cacheAssinaturasDoc = new Map(); // documentoId -> { assinaturas: Array, fetchedAt: number }

  // Cache global compartilhado entre módulos (Acompanhamento e Documentos)
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) {
      window._processoPorNumeroCache = new Map();
    }
    return window._processoPorNumeroCache;
  }

  // Controle de atualização
  let debounceId = null;

  // ===== SVGs =====
  const SVG_JOURNALS = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journals" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2"/>
    <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V9h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 2.5v.5H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H2v-.5a.5.5 0 0 0-1 0"/>
  </svg>`;

  const SVG_LOCK = `🔒`;

  const SVG_PEN = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pen-fill" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001"/>
  </svg>`;

  // ===== Estilos =====
  function ensureStyles() {
    if (document.getElementById('documentos-processo-styles')) return;
    const style = document.createElement('style');
    style.id = 'documentos-processo-styles';
    style.textContent = `
      .doc-icon-wrapper { display: inline-flex; align-items: center; gap: 6px; margin-left: 6px; }
      .doc-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; background: #eef3f8; color: #1a73e8; cursor: pointer; border: 1px solid #d2e3fc; }
      .doc-icon-btn:hover { background: #e2ecf7; }
  /* Removido opacity para evitar transparência no tooltip do cadeado */
  .doc-icon-btn[aria-disabled="true"] { opacity: 1; cursor: not-allowed; }
  .doc-icon-btn svg { display: block; width: 18px; height: 18px; }
  /* Aumentar um pouco o cadeado (emoji) quando usado */
  .doc-icon-btn { font-size: 16px; }
      .doc-icon-tooltip { position: relative; }
  .doc-icon-tooltip:hover::after { content: attr(data-title); position: absolute; top: -32px; left: 50%; transform: translateX(-50%); background: #000; color: #ffffffff; padding: 6px 8px; font-size: 12px; font-weight: 500; border-radius: 4px; white-space: nowrap; pointer-events: none; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,.4); border: 1px solid rgba(0,0,0,.6); }
  /* Linha da tag de tempo e do ícone: sempre abaixo do conteúdo principal da célula */
  .tempo-acompanhamento-wrapper { display: flex !important; align-items: center; gap: 6px; margin-top: 4px; }
  /* Spinner circular próprio (rodinha) */
  .doc-spinner { width: 14px; height: 14px; border: 2px solid #90a4ae; border-top-color: transparent; border-right-color: transparent; border-radius: 50%; display: inline-block; animation: docspin .7s linear infinite; }
  @keyframes docspin { to { transform: rotate(360deg); } }
  /* Limites e contenção do modal */
  #documentos-modal-overlay .modal-content { width: min(1200px, 90vw); height: min(90vh, 900px); display: flex; flex-direction: column; overflow: hidden; }
  #documentos-modal-overlay .modal-header { flex: 0 0 auto; }
  #documentos-modal-overlay .flex-fill { flex: 1 1 auto; min-height: 0; }
  /* Corpo com índice à esquerda e viewer à direita */
  .documentos-modal-body { flex: 1 1 auto; height: 100%; min-height: 0; overflow: hidden; display: grid; grid-template-columns: 320px 1fr; }
  .documentos-index { border-right: 1px solid #eee; overflow: auto; padding: 10px; min-width: 0; box-sizing: border-box; }
  /* Barra de busca fixa no topo do índice */
  .documentos-index .documentos-index-controls { position: sticky; top: 0; z-index: 2; background: #f5f7fb; padding: 10px; margin: 0 0 8px 0; border: 1px solid #e5e7eb; border-radius: 8px; }
  .documentos-index .documentos-index-controls .row { display:contents; gap:8px; align-items:center; width:100%; box-sizing:border-box; }
  .documentos-index .documentos-index-controls select,
  .documentos-index .documentos-index-controls input[type="text"] { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; font-size: 12px; background: #fff; color:#111827; box-sizing:border-box; }
  .documentos-index .documentos-index-controls select { flex: 0 0 140px; max-width: 45%; min-width: 120px; }
  .documentos-index .documentos-index-controls input[type="text"] { flex: 1 1 auto; min-width: 0; }
  .documentos-index .documentos-index-controls select:focus,
  .documentos-index .documentos-index-controls input[type="text"]:focus { outline: none; border-color:#93c5fd; box-shadow: 0 0 0 3px rgba(147,197,253,.3); }
  .documentos-index .documentos-index-controls .doc-index-clear-btn { flex: 0 0 28px; width: 28px; height: 28px; display:inline-flex; align-items:center; justify-content:center; border:1px solid #d1d5db; background:#fff; color:#374151; border-radius:6px; cursor:pointer; }
  .documentos-index .documentos-index-controls .doc-index-clear-btn:hover { background:#f3f4f6; }
  .documentos-index .documentos-index-controls .doc-index-clear-btn:focus { outline:none; border-color:#93c5fd; box-shadow:0 0 0 3px rgba(147,197,253,.3); }
  .documentos-index .documentos-index-controls .doc-index-clear-btn svg { width:16px; height:16px; display:block; }
  .documentos-index .documentos-index-controls .meta { margin-top:6px; font-size:11px; color:#6b7280; }
  .documentos-index .documentos-index-list { display:block; }
  .documentos-index .doc-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px; border-radius: 6px; cursor: pointer; border: 1px solid #585858ff; background: #ffffff; margin-bottom: 8px; }
    .documentos-index .doc-item:hover { background: #e2e8f3ff; border-color: #585858ff; }
      .documentos-index .doc-item.active { background: #feffd3; border-color: #ffc107; }
  /* Destaque verde para PARECER JURÍDICO (alinhado com o Histórico) */
  .documentos-index .doc-item.parecer-highlight { background: linear-gradient(135deg, #cbead2 0%, #e6f5ec 70%); border-color: #a5d6a7; box-shadow: inset 0 0 0 1px rgba(165,214,167,.3); }
  .documentos-index .doc-item.parecer-highlight:hover { background: linear-gradient(135deg, #c3e5cc 0%, #def2e6 70%); border-color: #9ccc9b; }
  .documentos-index .doc-item.parecer-highlight.active { background: linear-gradient(135deg, #cbead2 0%, #e6f5ec 70%); border-color: #81c784; }
  /* Destaque azul para TERMO DE REFERÊNCIA (alinhado com os cards azuis do Histórico) */
  .documentos-index .doc-item.termo-ref-highlight { background: linear-gradient(135deg, #c7ddff 0%, #e3efff 70%); border-color: #90caf9; box-shadow: inset 0 0 0 1px rgba(144,202,249,.3); border-left: 4px solid var(--brand-primary); }
  .documentos-index .doc-item.termo-ref-highlight:hover { background: linear-gradient(135deg, #bfd6ff 0%, #dbeaff 70%); border-color: #7fb6f2; }
  .documentos-index .doc-item.termo-ref-highlight.active { background: linear-gradient(135deg, #c7ddff 0%, #e3efff 70%); border-color: #64b5f6; }
      .documentos-index .doc-main { display: grid; gap: 2px; min-width: 0; }
      .documentos-index .doc-title { font-size: 13px; font-weight: 600; color: #202124; overflow: hidden; text-overflow: ellipsis;; }
      .documentos-index .doc-sub { font-size: 12px; color: #19191aff; overflow: hidden; text-overflow: ellipsis; }
      /* Assinaturas dentro do item do índice */
      .documentos-index .doc-sign { margin-top: 4px; font-size: 11px; color: #5f6368; line-height: 1.25; }
      .documentos-index .doc-sign .sig-title { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #3c4043; }
      .documentos-index .doc-sign .sig-line { display: block; overflow: hidden; text-overflow: ellipsis; }
    .documentos-index .doc-sign .sig-empty { color: #9aa0a6; font-style: italic; }
  /* Afastar levemente os controles do limite esquerdo */
  .documentos-index .documentos-index-controls .row { 
    /* Desativa gutter do Bootstrap nessa .row específica */
    --bs-gutter-x: 0; 
    --bs-gutter-y: 0; 
    margin-left: 0 !important; 
    margin-right: 0 !important; 
    padding-left: 12px; 
    padding-right: 0;
  }
  /* .doc-actions removido temporariamente (sem ícones extras no índice) */
      .documentos-index .doc-item.disabled { opacity: .6; cursor: not-allowed; }
      .documento-viewer { overflow: auto; min-width: 0; min-height: 0; height: 100%; }
      .documento-viewer iframe { display: block; width: 100%; height: 100%; border: none; background: #f8f9fa; }
      @media (max-width: 900px) { .documentos-modal-body { grid-template-columns: 1fr; } .documentos-index { max-height: 40%; border-right: none; border-bottom: 1px solid #eee; } }
    `;
    document.head.appendChild(style);
  }

  // ===== Modal =====
  function ensureModal() {
    if (document.getElementById('documentos-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'documentos-modal-overlay';
    overlay.className = 'modal-overlay d-none position-fixed top-0 start-0 w-100 h-100';
    overlay.style.cssText = 'display:none; background: rgba(0,0,0,0.5); align-items: center; justify-content: center;';
    overlay.innerHTML = `
      <div class="modal-content position-relative bg-white rounded d-flex flex-column" style="width: 90vw; height: 90vh; max-width: 1200px;">
        <div class="modal-header p-3 text-white rounded-top-2 d-flex justify-content-between align-items-center" style="background: var(--brand-primary);">
          <h5 id="documentos-modal-title" class="mb-0 text-white">Documentos do Processo</h5>
          <button id="documentos-modal-close" class="btn-close btn-close-white" type="button" aria-label="Close"></button>
        </div>
        <div class="flex-fill p-0 position-relative" style="display: flex; flex-direction: column;">
          <div class="documentos-modal-body">
            <div id="documentos-index" class="documentos-index" role="navigation" aria-label="Índice de documentos"></div>
            <div class="documento-viewer">
              <iframe id="documento-viewer-frame" title="Visualizador de documento PDF"></iframe>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Registro no ModalManager
    const register = () => {
      if (window.modalManager && typeof window.modalManager.registerModal === 'function') {
        window.modalManager.registerModal('documentos-modal', {
          overlay: 'documentos-modal-overlay',
          content: '.modal-content',
          closeButtons: ['documentos-modal-close'],
          type: 'content'
        });
      } else {
        // Tenta novamente após breve atraso até que o ModalManager esteja pronto
        setTimeout(register, 150);
      }
    };
    register();

    // Fechar no X (fallback caso ModalManager não capture)
    overlay.querySelector('#documentos-modal-close').addEventListener('click', (e)=>{
      e.preventDefault();
      if (window.modalManager) window.modalManager.closeModal('documentos-modal');
      else overlay.style.display = 'none';
    });

    // Fechar ao clicar no overlay (fora do conteúdo do modal), como nos outros modais
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        if (window.modalManager) window.modalManager.closeModal('documentos-modal');
        else overlay.style.display = 'none';
      }
    });
  }

  function openDocumentosModal(numeroProcesso, documentos, meta = {}) {
    ensureStyles();
    ensureModal();
  const titleEl = document.getElementById('documentos-modal-title');
  const indexEl = document.getElementById('documentos-index');
    const iframe = document.getElementById('documento-viewer-frame');
    if (!indexEl || !iframe) return;

    // Título no padrão do ProcessoModal: "ID PCA - Projeto" e incluir número do processo
    const { projectName = '', idPca = '' } = meta || {};
    const mainTitle = projectName
      ? `${idPca ? idPca + ' - ' : ''}${projectName}`
      : 'Documentos do Processo';
    const numSuffix = numeroProcesso ? ` | ${numeroProcesso}` : '';
    titleEl.textContent = `${mainTitle}${numSuffix}`;
    indexEl.innerHTML = '';
    // Controles de busca
    const controls = document.createElement('div');
    controls.className = 'documentos-index-controls';
      controls.innerHTML = `
      <div class="row">
          <select id="doc-index-filter-mode" aria-label="Selecionar modo de filtro">
            <option value="peca">Peça</option>
            <option value="setor">Setor</option>
            <option value="pessoa">Pessoas</option>
          </select>
          <input id="doc-index-filter-input" type="text" placeholder="Filtrar por peça..." aria-label="Filtrar itens" />
          <button id="doc-index-clear-btn" class="doc-index-clear-btn" type="button" title="Limpar busca" aria-label="Limpar busca">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
          </button>
      </div>`;
    indexEl.appendChild(controls);
    // Container da lista
    const listEl = document.createElement('div');
    listEl.className = 'documentos-index-list';
    indexEl.appendChild(listEl);

  // Montar itens do índice e determinar primeiro documento exibível
  let firstDisplayable = null;
  const total = documentos.length;
  documentos.forEach((doc, idx) => {
      const canDisplay = !!(doc && doc.id && Number(doc.id) > 0 && doc.exibirDocumento !== false);
      if (!firstDisplayable && canDisplay) firstDisplayable = doc;

      const item = document.createElement('div');
      item.className = 'doc-item' + (canDisplay ? '' : ' disabled');
      item.dataset.docId = String(doc.id || '');
      item.title = canDisplay ? 'Abrir documento' : 'Documento indisponível';

  const main = document.createElement('div');
      main.className = 'doc-main';
  const titulo = document.createElement('div');
  titulo.className = 'doc-title';
  const tipo = (doc.tipoAtoDocumento && doc.tipoAtoDocumento.descricao) ? doc.tipoAtoDocumento.descricao : 'Documento';
  // Se for PARECER JURÍDICO, aplicar destaque verde no card
  try {
    const normTipo = String(tipo).normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase();
    if (normTipo.includes('PARECER JURIDICO')) {
      item.classList.add('parecer-highlight');
    }
    // Se for TERMO DE REFERÊNCIA, aplicar destaque azul no card
    if (normTipo.includes('TERMO DE REFERENCIA')) {
      item.classList.add('termo-ref-highlight');
    }
  } catch(_) {}
  // Anexar número do ato (numero/ano) após o tipo, conforme JSON
  const partesAto = [];
  if (doc && doc.numero) partesAto.push(String(doc.numero));
  if (doc && doc.ano) partesAto.push(String(doc.ano));
  const sufixoAto = partesAto.length ? ` - ${partesAto.join('/')}` : '';
  const tituloBase = `${tipo}${sufixoAto}`;
  // Numeração decrescente (ex.: total, total-1, ..., 1)
  titulo.textContent = `${Math.max(1, total - idx)}. ${tituloBase}`;
      const sub = document.createElement('div');
      sub.className = 'doc-sub';
      const data = doc.dataFinalizacao ? ` • ${doc.dataFinalizacao}` : '';
      const setor = (doc.setor && doc.setor.descricao) ? doc.setor.descricao : '';
      // Atributos de dados para filtragem
      try {
        item.dataset.peca = `${tituloBase}`;
        item.dataset.setor = `${setor}`;
      } catch(_) {}
      sub.textContent = [setor, data].filter(Boolean).join('');
      main.appendChild(titulo);
      main.appendChild(sub);

      // Bloco de assinaturas
      const sign = document.createElement('div');
      sign.className = 'doc-sign';
      // Placeholder de carregamento somente para documentos exibíveis
      if (canDisplay) {
        sign.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line">Carregando...</span>`;
      } else {
        sign.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line sig-empty">Indisponível</span>`;
      }
      main.appendChild(sign);

  item.appendChild(main);
  listEl.appendChild(item);

      if (canDisplay) {
        item.addEventListener('click', () => {
          // Atualiza seleção
          indexEl.querySelectorAll('.doc-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          // Carrega PDF
          iframe.src = API_DOC_ARQUIVO + encodeURIComponent(doc.id);
          // Dispara busca de assinaturas on-click, caso ainda não tenha sido carregada
          if (!cacheAssinaturasDoc.has(String(doc.id))) {
            carregarAssinaturasNoElemento(doc.id, sign).then(()=>{
              try {
                const key = String(doc.id);
                const cached = cacheAssinaturasDoc.get(key);
                const nomes = Array.isArray(cached && cached.assinaturas) ? cached.assinaturas.map(a=>a && a.nome ? String(a.nome) : '').filter(Boolean) : [];
                item.dataset.signers = nomes.join(' | ');
                const host = document.getElementById('documentos-index');
                if (host && typeof host._applyFilter === 'function') host._applyFilter();
              } catch(_) {}
            }).catch(()=>{
              // falha silenciosa
            });
          }
        });
        // Busca assinaturas para o item assim que construído (carregamento inicial)
        carregarAssinaturasNoElemento(doc.id, sign).then(() => {
          try {
            const key = String(doc.id);
            const cached = cacheAssinaturasDoc.get(key);
            const nomes = Array.isArray(cached && cached.assinaturas) ? cached.assinaturas.map(a=>a && a.nome ? String(a.nome) : '').filter(Boolean) : [];
            item.dataset.signers = nomes.join(' | ');
            const host = document.getElementById('documentos-index');
            if (host && typeof host._applyFilter === 'function') host._applyFilter();
          } catch(_) {}
        }).catch(()=>{
          sign.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line sig-empty">Erro ao carregar</span>`;
        });
      }
    });

    // Seleciona e carrega primeiro documento exibível
  const firstItem = listEl.querySelector('.doc-item:not(.disabled)');
    if (firstDisplayable && firstItem) {
      firstItem.classList.add('active');
      iframe.src = API_DOC_ARQUIVO + encodeURIComponent(firstDisplayable.id);
    } else {
      iframe.removeAttribute('src');
      iframe.title = 'Nenhum documento disponível para visualização';
    }

    // Filtro dinâmico
    try {
      const modeSel = document.getElementById('doc-index-filter-mode');
      const input = document.getElementById('doc-index-filter-input');
      const applyFilter = () => {
        const mode = (modeSel && modeSel.value) || 'peca';
        const q = (input && input.value || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().trim();
        const items = listEl.querySelectorAll('.doc-item');
        items.forEach(el => {
          const peca = (el.dataset.peca || '').toUpperCase();
          const setor = (el.dataset.setor || '').toUpperCase();
          const pessoas = (el.dataset.signers || '').toUpperCase();
          const hay = q ? (mode === 'setor' ? setor.includes(q) : (mode === 'pessoa' ? pessoas.includes(q) : peca.includes(q))) : true;
          el.style.display = hay ? '' : 'none';
        });
        // Não alterar iframe durante digitação; apenas esconder/exibir cards.
        // Se o item ativo foi ocultado, remover apenas o destaque visual.
        const active = listEl.querySelector('.doc-item.active');
        if (active && active.style.display === 'none') active.classList.remove('active');
      };
      if (modeSel) modeSel.addEventListener('change', () => {
        // Atualiza placeholder conforme modo
        if (input) {
          const m = (modeSel.value || 'peca');
          input.placeholder = m === 'setor' ? 'Filtrar por setor...' : (m === 'pessoa' ? 'Filtrar por pessoa (assinaturas)...' : 'Filtrar por peça...');
          // Limpa o campo quando trocar o modo
          input.value = '';
        }
        applyFilter();
      });
      if (input) input.addEventListener('input', applyFilter);
      const clearBtn = document.getElementById('doc-index-clear-btn');
      if (clearBtn && input) {
        clearBtn.addEventListener('click', () => {
          input.value = '';
          applyFilter();
          // Foco volta para o input
          try { input.focus(); } catch(_) {}
        });
      }
      // Expor função para reuso quando assinaturas chegarem
      indexEl._applyFilter = applyFilter;
    } catch(_) {}

    if (window.modalManager) window.modalManager.openModal('documentos-modal');
    else document.getElementById('documentos-modal-overlay').style.display = 'flex';
  }

  // ===== Assinaturas: fetch e render =====
  async function fetchAssinaturasDocumento(documentoId) {
    const key = String(documentoId || '');
    if (!key) return [];
    if (cacheAssinaturasDoc.has(key)) {
      const cached = cacheAssinaturasDoc.get(key);
      return cached && Array.isArray(cached.assinaturas) ? cached.assinaturas : [];
    }
    try {
      const url = API_DOC_ASSINATURAS + encodeURIComponent(key);
      const resp = await fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      let assinaturas = [];
      if (data && Array.isArray(data.assinaturas)) assinaturas = data.assinaturas;
      else if (Array.isArray(data)) assinaturas = data; // fallback caso API retorne array direto
      cacheAssinaturasDoc.set(key, { assinaturas, fetchedAt: Date.now() });
      return assinaturas;
    } catch (e) {
      cacheAssinaturasDoc.set(key, { assinaturas: [], fetchedAt: Date.now() });
      return [];
    }
  }

  function renderAssinaturas(signContainer, assinaturas) {
    if (!signContainer) return;
    // Cabeçalho
    const header = `<span class="sig-title">${SVG_PEN} Assinaturas</span>`;
    if (!assinaturas || assinaturas.length === 0) {
      signContainer.innerHTML = `${header}<span class="sig-line sig-empty">Sem assinaturas</span>`;
      return;
    }
    // Renderizar cada assinatura: "Nome — dataAssinatura"
    const lines = assinaturas.map(a => {
      const nome = a && a.nome ? String(a.nome) : '—';
      const data = a && a.dataAssinatura ? String(a.dataAssinatura) : '';
      return `<span class="sig-line" title="${nome} • ${data}">${nome} — ${data}</span>`;
    }).join('');
    signContainer.innerHTML = `${header}${lines}`;
  }

  async function carregarAssinaturasNoElemento(documentoId, signContainer) {
    if (!documentoId || !signContainer) return;
    try {
      const key = String(documentoId);
      // Evitar refetch se já carregado com sucesso
      if (cacheAssinaturasDoc.has(key)) {
        const cached = cacheAssinaturasDoc.get(key);
        renderAssinaturas(signContainer, cached.assinaturas || []);
        return;
      }
      // Placeholder de carregamento e busca assíncrona em background
      signContainer.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line">Carregando...</span>`;
      setTimeout(async () => {
        try {
          const assinaturas = await fetchAssinaturasDocumento(documentoId);
          renderAssinaturas(signContainer, assinaturas);
        } catch (_) {
          signContainer.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line sig-empty">Erro ao carregar</span>`;
        }
      }, 0);
    } catch (_) {
      signContainer.innerHTML = `<span class="sig-title">${SVG_PEN} Assinaturas</span><span class="sig-line sig-empty">Erro ao carregar</span>`;
    }
  }

  // ===== Fetch =====
  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  async function fetchProcessoPorNumero(numero) {
    // Somente cache: este módulo não deve disparar requisições de rede
    const num = normalizarNumero(numero);
    if (!num) return null;
    if (cacheProcessoDocs.has(num)) return cacheProcessoDocs.get(num);
    const shared = getSharedProcessCache();
    if (shared.has(num)) {
      const val = shared.get(num);
      cacheProcessoDocs.set(num, val);
      return val;
    }
    return null;
  }

  function processarResposta(numero, data) {
    try {
      const item = data && data.data && Array.isArray(data.data.lista) ? data.data.lista[0] : null;
      const documentosSessao = item && item.documentos ? item.documentos : null;
      const sigiloso = !documentosSessao; // regra solicitada

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

  const result = { raw: item || null, documentos, sigiloso };
  cacheProcessoDocs.set(numero, result);
  // Preencher cache global compartilhado
  try { getSharedProcessCache().set(numero, result); } catch(_) {}
  return result;
    } catch (e) {
  const result = { raw: null, documentos: [], sigiloso: false };
  cacheProcessoDocs.set(numero, result);
  try { getSharedProcessCache().set(numero, result); } catch(_) {}
  return result;
    }
  }

  // ===== UI: Inserção do ícone próximo à tag de tempo =====
  function obterNumeroDoTR(tr) {
    let processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    if (!processoCell) return '';
    let texto = (processoCell.dataset && processoCell.dataset.processoNumero) ? processoCell.dataset.processoNumero : processoCell.textContent || '';
    texto = texto.replace('🔗', '').trim();
    return normalizarNumero(texto);
  }

  function ensurePlaceholderDocIcon(tr) {
    // Insere um placeholder clicável-desabilitado enquanto os dados chegam
    const numeroTr = obterNumeroDoTR(tr);
    if (!numeroTr) {
      // Remover se houver algum wrapper deixado por engano
      const cell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4] || tr.querySelector('td:last-child');
      const wrap = cell && cell.querySelector ? cell.querySelector('.doc-icon-wrapper') : null;
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      return;
    }
    let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
    if (!targetCell) {
      targetCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    }
    if (!targetCell) return;
  let tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
    if (!tagWrapper) {
      tagWrapper = document.createElement('div');
      tagWrapper.className = 'tempo-acompanhamento-wrapper';
      targetCell.appendChild(tagWrapper);
    }
    // Não duplicar
    let wrapper = tagWrapper.querySelector('.doc-icon-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('span');
      wrapper.className = 'doc-icon-wrapper';
      tagWrapper.appendChild(wrapper);
    }
    // Placeholder com spinner
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'doc-icon-btn';
    btn.setAttribute('aria-disabled', 'true');
    btn.title = 'Carregando documentos...';
  // Rodinha clássica via CSS próprio
  btn.innerHTML = '<span class="doc-spinner" aria-hidden="true"></span>';
    wrapper.innerHTML = '';
    wrapper.appendChild(btn);
    // Evitar que o botão de histórico esteja dentro do wrapper e garantir ordem à esquerda
    try {
      const historicoBtn = tagWrapper.querySelector('.acomp-historico-btn');
      if (historicoBtn && historicoBtn.parentNode === wrapper) {
        // Mover o histórico para fora do wrapper, logo após ele
        wrapper.insertAdjacentElement('afterend', historicoBtn);
      }
      // Garantir que o wrapper esteja antes do histórico
      if (historicoBtn && wrapper.nextElementSibling !== historicoBtn) {
        wrapper.parentNode.insertBefore(wrapper, historicoBtn);
      }
    } catch(_) {}
    // Garantir ordem com botão de refresh, se existir
    try {
      const refreshBtn = tagWrapper.querySelector('.acomp-refresh-btn');
      if (refreshBtn) {
        if (wrapper.nextSibling) tagWrapper.insertBefore(refreshBtn, wrapper.nextSibling);
        else tagWrapper.appendChild(refreshBtn);
      }
    } catch(_) {}
  }

  function addIconeSeNecessario(tr, info) {
    const numeroTr = obterNumeroDoTR(tr);
    if (!numeroTr) {
      // Se não há número, remover qualquer ícone existente
      const cell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4] || tr.querySelector('td:last-child');
      const wrap = cell && cell.querySelector ? cell.querySelector('.doc-icon-wrapper') : null;
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      return;
    }
    // Alvo preferencial: célula de Acompanhamento; fallback: célula de Processo (para linhas sem tag de tempo)
    let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
    if (!targetCell) {
      targetCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    }
    if (!targetCell) return;
  let tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
    // Se não existir a linha do tempo (ex.: processos com status concluído), cria uma linha abaixo
    if (!tagWrapper) {
      tagWrapper = document.createElement('div');
      tagWrapper.className = 'tempo-acompanhamento-wrapper';
      targetCell.appendChild(tagWrapper);
    }
    const insertionTarget = tagWrapper;

    // Usa wrapper existente se já houver, senão cria
    let wrapper = insertionTarget.querySelector('.doc-icon-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('span');
      wrapper.className = 'doc-icon-wrapper';
      insertionTarget.appendChild(wrapper);
    }
    // Reconstruir botão conforme info
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'doc-icon-btn';
    wrapper.innerHTML = '';
    if (info && info.sigiloso) {
      btn.innerHTML = SVG_LOCK;
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('doc-icon-tooltip');
      btn.setAttribute('data-title', 'Processo Sigiloso');
    } else if (info) {
      btn.innerHTML = SVG_JOURNALS;
    } else {
      // Se ainda sem info, manter placeholder (rodinha)
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'Carregando documentos...';
      btn.innerHTML = '<span class="doc-spinner" aria-hidden="true"></span>';
    }
    wrapper.appendChild(btn);
    // Evitar que o botão de histórico esteja dentro do wrapper e garantir ordem à esquerda
    try {
      const historicoBtn = tagWrapper.querySelector('.acomp-historico-btn');
      if (historicoBtn && historicoBtn.parentNode === wrapper) {
        wrapper.insertAdjacentElement('afterend', historicoBtn);
      }
      if (historicoBtn && wrapper.nextElementSibling !== historicoBtn) {
        wrapper.parentNode.insertBefore(wrapper, historicoBtn);
      }
    } catch(_) {}
    // Posicionar refresh à direita do wrapper (documentos à esquerda, depois histórico, depois refresh)
    try {
      const refreshBtn = insertionTarget.querySelector('.acomp-refresh-btn');
      const historicoBtn = insertionTarget.querySelector('.acomp-historico-btn');
      if (refreshBtn) {
        // Preferir posicionar após o histórico, se existir; senão, após o wrapper
        if (historicoBtn) {
          historicoBtn.insertAdjacentElement('afterend', refreshBtn);
        } else if (wrapper.nextSibling) {
          insertionTarget.insertBefore(refreshBtn, wrapper.nextSibling);
        } else {
          insertionTarget.appendChild(refreshBtn);
        }
      }
    } catch(_) {}

    // Habilitar clique quando não sigiloso e info disponível
    if (info && !info.sigiloso) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const numero = obterNumeroDoTR(tr);
        const dados = cacheProcessoDocs.get(numero) || info;
        const docs = (dados && Array.isArray(dados.documentos)) ? dados.documentos : [];
        const meta = extrairMetaDoTR(tr);
        openDocumentosModal(numero, docs, meta);
      });
    }
  }

  // Extrai metadados (projeto e ID PCA) da linha, semelhante ao ProcessoModal
  function sanitizeMetaField(rawValue) {
    if (!rawValue) return '';
    const cleaned = String(rawValue)
      .replace(/[🔗🛍️]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const segments = cleaned.split('|').map(seg => seg.trim()).filter(Boolean);
    return segments.length ? segments.join(' | ') : cleaned;
  }

  function extrairMetaDoTR(tr) {
    let projectName = '';
    let idPca = '';
    try {
      const table = tr.closest('table');
      if (table) {
        const ths = Array.from(table.querySelectorAll('thead th'));
        const idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
        if (idxProjeto >= 0 && tr.children[idxProjeto]) {
          projectName = window.extractCellTextWithSeparator ? 
            window.extractCellTextWithSeparator(tr.children[idxProjeto]) : 
            tr.children[idxProjeto].textContent.trim();
          projectName = sanitizeMetaField(projectName);
        }
        const idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
        if (idxId >= 0 && tr.children[idxId]) {
          idPca = window.extractCellTextWithSeparator ? 
            window.extractCellTextWithSeparator(tr.children[idxId]) : 
            tr.children[idxId].textContent.trim();
          idPca = sanitizeMetaField(idPca);
        }
      }
      if (!projectName) {
        const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset.label||'')));
        if (candidato) {
          projectName = window.extractCellTextWithSeparator ? 
            window.extractCellTextWithSeparator(candidato) : 
            candidato.textContent.trim();
          projectName = sanitizeMetaField(projectName);
        }
      }
      if (!idPca) {
        const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset.label||'')));
        if (idCand) {
          idPca = window.extractCellTextWithSeparator ? 
            window.extractCellTextWithSeparator(idCand) : 
            idCand.textContent.trim();
          idPca = sanitizeMetaField(idPca);
        }
      }
    } catch(_) { /* ignore */ }
    return { projectName, idPca };
  }

  async function atualizarIconesDocumentos() {
    ensureStyles();
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;

    // Coletar números únicos
    const numerosSet = new Set();
    const linhas = Array.from(tbody.querySelectorAll('tr'));
    linhas.forEach(tr => {
      const numero = obterNumeroDoTR(tr);
      if (numero) numerosSet.add(numero);
    });
    const numeros = Array.from(numerosSet);

    // Inserir placeholders imediatamente
    linhas.forEach(tr => ensurePlaceholderDocIcon(tr));

    // Preencher/atualizar conforme cache disponível agora
    linhas.forEach(tr => {
      const numero = obterNumeroDoTR(tr);
      if (!numero) return;
      // Tentar cache local e cache compartilhado
      let info = cacheProcessoDocs.get(numero);
      if (!info) {
        const shared = getSharedProcessCache();
        if (shared && shared.has(numero)) info = shared.get(numero);
      }
      // Só exibe o ícone se info existir e não for erro
      if (info && !info.erro) {
        addIconeSeNecessario(tr, info);
      } else {
        // Remove wrapper se existir
        let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
        if (!targetCell) targetCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
        if (targetCell) {
          let tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
          if (tagWrapper) {
            let wrap = tagWrapper.querySelector('.doc-icon-wrapper');
            if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
          }
        }
      }
    });
  }

  function scheduleUpdate(delay=400) {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => { atualizarIconesDocumentos().catch(()=>{}); }, delay);
  }

  // Eventos de integração
  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles();
    scheduleUpdate(800);
  });

  // Quando o acompanhamento for atualizado, (re)inserir ícones
  document.addEventListener('acompanhamento-atualizado', () => scheduleUpdate(300));
  // Quando iniciar o loading das células, inserir placeholders imediatamente
  document.addEventListener('acompanhamento-loading', () => scheduleUpdate(0));
  // Atualizações parciais por número: atualizar ícone apenas daquela(s) linha(s)
  document.addEventListener('acompanhamento-atualizado-parcial', (ev) => {
    try {
      const numero = ev && ev.detail && ev.detail.numero ? ev.detail.numero : '';
      if (!numero) return;
      ensureStyles();
      const tbody = document.querySelector('#detalhes table tbody');
      if (!tbody) return;
      tbody.querySelectorAll('tr').forEach(tr => {
        if (obterNumeroDoTR(tr) === normalizarNumero(numero)) {
          ensurePlaceholderDocIcon(tr);
          // Tenta preencher com cache compartilhado
          let info = cacheProcessoDocs.get(numero);
          if (!info) {
            const shared = getSharedProcessCache();
            if (shared && shared.has(numero)) info = shared.get(numero);
          }
          if (info && !info.erro) {
            addIconeSeNecessario(tr, info);
          } else {
            // Remove wrapper se existir
            let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
            if (!targetCell) targetCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
            if (targetCell) {
              let tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
              if (tagWrapper) {
                let wrap = tagWrapper.querySelector('.doc-icon-wrapper');
                if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
              }
            }
          }
        }
      });
    } catch(_) {}
  });
  // Quando a tabela sinaliza carregada (caso emitam este evento em outros fluxos)
  document.addEventListener('tabela-carregada', () => scheduleUpdate(600));

  // Expor para debug manual
  // Função para remover o ícone de documentos de uma linha específica
  function removerIconeDocumentosDeTR(tr) {
    if (!tr) return;
    let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
    if (!targetCell) return;
    let tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
    if (!tagWrapper) return;
    let wrapper = tagWrapper.querySelector('.doc-icon-wrapper');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }

  // Expor função global para integração com outros módulos
  if (!window.removerIconesDocumentosHistorico) {
    window.removerIconesDocumentosHistorico = function(tr) {
      removerIconeDocumentosDeTR(tr);
      // HistoricoTramitacoesModal.js também deve implementar a remoção do seu ícone
      if (window.removerIconeHistoricoDeTR) window.removerIconeHistoricoDeTR(tr);
    };
  }

  window.debugDocumentosProcesso = {
    fetch: fetchProcessoPorNumero,
    abrir: openDocumentosModal,
    atualizar: atualizarIconesDocumentos,
    cache: cacheProcessoDocs
  };
})();
