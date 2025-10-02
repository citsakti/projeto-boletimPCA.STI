/**
 * AnalyticsPareceresJuridicosTag.js
 * 
 * Objetivo:
 *  - Adicionar tags verdes nas células de projeto na tabela "Com Parecer Jurídico" (3.3)
 *  - Exibir a data de emissão do parecer jurídico no formato DD/MM/YYYY
 *  - Ao clicar na tag, abrir modal com visualização do parecer jurídico (nos moldes de DocumentosDoProcessso.js)
 *  - Tag deve aparecer antes de todas as outras tags dentro da mesma div
 * 
 * Dependências:
 *  - AnalyticsPareceresJuridicos.js (fonte de dados)
 *  - DocumentosDoProcessso.js (estrutura do modal e APIs)
 *  - ModalManager.js (gerenciamento do modal)
 */
(function(){
  const API_DOC_ARQUIVO = 'https://api-add.tce.ce.gov.br/arquivos/documento?documento_id=';
  const API_DOC_ASSINATURAS = 'https://api-processos.tce.ce.gov.br/documento/assinaturas?documento_id=';
  const DEBUG_TAG = true; // Ativar debug temporariamente

  // Cache de assinaturas por documento
  const cacheAssinaturasDoc = new Map(); // documentoId -> { assinaturas: Array, fetchedAt: number }

  // SVGs
  const SVG_GAVEL = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-card-text" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
    <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8m0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
  </svg>`;

  const SVG_PEN = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pen-fill" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001"/>
  </svg>`;

  // Estilos
  function ensureStyles() {
    if (document.getElementById('parecer-juridico-tag-styles')) return;
    const style = document.createElement('style');
    style.id = 'parecer-juridico-tag-styles';
    style.textContent = `
      /* Estilo para tag de parecer jurídico - seguindo padrão do EspecieProcessoTag.js */
      .parecer-juridico-tag {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.2;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        /* Cor verde do histórico de tramitações */
        background: linear-gradient(135deg, #cbead2 0%, #e6f5ec 70%);
        color: #155724;
        border: 1px solid #a5d6a7;
        box-shadow: inset 0 0 0 1px rgba(165,214,167,.3);
      }
      
      .parecer-juridico-tag:hover {
        background: linear-gradient(135deg, #c3e5cc 0%, #def2e6 70%);
        border-color: #9ccc9b;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .parecer-juridico-tag svg {
        width: 11px;
        height: 11px;
        display: inline-block;
        vertical-align: middle;
        margin-right: 3px;
      }
      
      .parecer-juridico-tag-text {
        display: inline;
        font-size: 11px;
      }
      
      /* Responsividade */
      @media (max-width: 768px) {
        .parecer-juridico-tag {
          font-size: 10px;
          padding: 2px 6px;
          letter-spacing: 0.2px;
        }
        
        .parecer-juridico-tag svg {
          width: 10px;
          height: 10px;
        }
        
        .parecer-juridico-tag-text {
          font-size: 10px;
        }
      }
      
      @media (max-width: 480px) {
        .parecer-juridico-tag {
          font-size: 9px;
          padding: 1px 4px;
          max-width: 120px;
        }
        
        .parecer-juridico-tag svg {
          width: 9px;
          height: 9px;
        }
        
        .parecer-juridico-tag-text {
          font-size: 9px;
        }
      }
      
      /* Modal específico para parecer jurídico */
      #parecer-modal-overlay .modal-content {
        width: min(1200px, 90vw);
        height: min(90vh, 900px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #parecer-modal-overlay .modal-header {
        flex: 0 0 auto;
      }
      #parecer-modal-overlay .flex-fill {
        flex: 1 1 auto;
        min-height: 0;
      }
      .parecer-modal-body {
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        display: grid;
        grid-template-columns: 320px 1fr;
      }
      .parecer-index {
        border-right: 1px solid #eee;
        overflow: auto;
        padding: 10px;
        min-width: 0;
        box-sizing: border-box;
        background: #f8f9fa;
      }
      .parecer-item {
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        border: 1px solid #28a745;
        background: linear-gradient(135deg, #cbead2 0%, #e6f5ec 70%);
        margin-bottom: 8px;
      }
      .parecer-item:hover {
        background: linear-gradient(135deg, #c3e5cc 0%, #def2e6 70%);
        border-color: #1e7e34;
      }
      .parecer-item.active {
        background: linear-gradient(135deg, #d4edda 0%, #f1f9f4 70%);
        border-color: #155724;
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
      }
      .parecer-item-title {
        font-size: 13px;
        font-weight: 600;
        color: #155724;
        margin-bottom: 4px;
      }
      .parecer-item-info {
        font-size: 12px;
        color: #383d41;
        margin-bottom: 6px;
      }
      .parecer-item-assinaturas {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(40, 167, 69, 0.2);
        font-size: 11px;
        color: #5f6368;
        line-height: 1.4;
      }
      .parecer-item-assinaturas .sig-title {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        color: #155724;
        margin-bottom: 4px;
      }
      .parecer-item-assinaturas .sig-line {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 18px;
        margin-bottom: 2px;
      }
      .parecer-item-assinaturas .sig-empty {
        color: #9aa0a6;
        font-style: italic;
        padding-left: 18px;
      }
      .parecer-item-assinaturas .sig-loading {
        color: #6c757d;
        font-style: italic;
        padding-left: 18px;
      }
      .parecer-viewer {
        overflow: auto;
        min-width: 0;
        min-height: 0;
        height: 100%;
      }
      .parecer-viewer iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: none;
        background: #f8f9fa;
      }
      @media (max-width: 900px) {
        .parecer-modal-body {
          grid-template-columns: 1fr;
        }
        .parecer-index {
          max-height: 40%;
          border-right: none;
          border-bottom: 1px solid #eee;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById('parecer-modal-overlay')) {
      if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Modal já existe');
      return;
    }
    
    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Criando modal');
    
    const overlay = document.createElement('div');
    overlay.id = 'parecer-modal-overlay';
    overlay.className = 'modal-overlay d-none position-fixed top-0 start-0 w-100 h-100';
    overlay.style.cssText = 'display:none; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 9999;';
    overlay.innerHTML = `
      <div class="modal-content position-relative bg-white rounded d-flex flex-column" style="width: 90vw; height: 90vh; max-width: 1200px;">
        <div class="modal-header p-3 text-white rounded-top-2 d-flex justify-content-between align-items-center" style="background: #28a745;">
          <h5 id="parecer-modal-title" class="mb-0 text-white">Parecer Jurídico</h5>
          <button id="parecer-modal-close" class="btn-close btn-close-white" type="button" aria-label="Close"></button>
        </div>
        <div class="flex-fill p-0 position-relative" style="display: flex; flex-direction: column;">
          <div class="parecer-modal-body">
            <div id="parecer-index" class="parecer-index" role="navigation" aria-label="Índice de pareceres"></div>
            <div class="parecer-viewer">
              <iframe id="parecer-viewer-frame" title="Visualizador de parecer jurídico PDF"></iframe>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Modal criado e adicionado ao DOM');

    // Registro no ModalManager - seguir o mesmo padrão de DocumentosDoProcessso.js
    const register = () => {
      if (window.modalManager && typeof window.modalManager.registerModal === 'function') {
        // Configuração idêntica ao DocumentosDoProcessso.js
        window.modalManager.registerModal('parecer-modal', {
          overlay: 'parecer-modal-overlay',
          content: '.modal-content',
          closeButtons: ['parecer-modal-close'],
          type: 'content'
        });
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Modal registrado no ModalManager');
      } else {
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] ModalManager não disponível, tentando novamente...');
        setTimeout(register, 150);
      }
    };
    register();

    // Fechar no X
    overlay.querySelector('#parecer-modal-close').addEventListener('click', (e) => {
      e.preventDefault();
      if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Botão fechar clicado');
      if (window.modalManager) window.modalManager.closeModal('parecer-modal');
      else overlay.style.display = 'none';
    });

    // Fechar ao clicar no overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Clique no overlay, fechando modal');
        if (window.modalManager) window.modalManager.closeModal('parecer-modal');
        else overlay.style.display = 'none';
      }
    });
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
      console.error('[PareceresJuridicosTag] Erro ao buscar assinaturas:', e);
      cacheAssinaturasDoc.set(key, { assinaturas: [], fetchedAt: Date.now() });
      return [];
    }
  }

  function renderAssinaturas(signContainer, assinaturas) {
    if (!signContainer) return;
    // Cabeçalho
    const header = `<div class="sig-title">${SVG_PEN} Assinaturas</div>`;
    if (!assinaturas || assinaturas.length === 0) {
      signContainer.innerHTML = `${header}<div class="sig-empty">Sem assinaturas</div>`;
      return;
    }
    // Renderizar cada assinatura: "Nome — dataAssinatura"
    const lines = assinaturas.map(a => {
      const nome = a && a.nome ? String(a.nome) : '—';
      const data = a && a.dataAssinatura ? String(a.dataAssinatura) : '';
      return `<div class="sig-line" title="${nome} • ${data}">${nome} — ${data}</div>`;
    }).join('');
    signContainer.innerHTML = `${header}${lines}`;
  }

  async function carregarAssinaturasNoCard(documentoId, signContainer) {
    if (!documentoId || !signContainer) return [];
    const key = String(documentoId);
    try {
      // Placeholder de carregamento
      signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-loading">Carregando...</div>`;
      
      let assinaturas;
      if (cacheAssinaturasDoc.has(key)) {
        const cached = cacheAssinaturasDoc.get(key);
        assinaturas = cached.assinaturas || [];
      } else {
        assinaturas = await fetchAssinaturasDocumento(documentoId);
      }
      
      renderAssinaturas(signContainer, assinaturas);
      return assinaturas;
    } catch(e) {
      console.error('[PareceresJuridicosTag] Erro ao carregar assinaturas no card:', e);
      signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-empty">Erro ao carregar</div>`;
      return [];
    }
  }

  function openParecerModal(pareceres, meta = {}) {
    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] openParecerModal chamado com:', { pareceres, meta });
    
    ensureStyles();
    ensureModal();
    
    const overlay = document.getElementById('parecer-modal-overlay');
    const titleEl = document.getElementById('parecer-modal-title');
    const indexEl = document.getElementById('parecer-index');
    const iframe = document.getElementById('parecer-viewer-frame');
    
    if (!overlay) {
      console.error('[PareceresJuridicosTag] Overlay não encontrado!');
      return;
    }
    
    if (!indexEl || !iframe) {
      console.error('[PareceresJuridicosTag] Elementos do modal não encontrados!', { indexEl, iframe });
      return;
    }

    // Título: "Parecer Jurídico - ID PCA - Projeto | Processo"
    const { projectName = '', idPca = '', numeroProcesso = '' } = meta || {};
    const mainTitle = projectName
      ? `Parecer Jurídico - ${idPca ? idPca + ' - ' : ''}${projectName}`
      : 'Parecer Jurídico';
    const numSuffix = numeroProcesso ? ` | ${numeroProcesso}` : '';
    titleEl.textContent = `${mainTitle}${numSuffix}`;

    // Limpar índice
    indexEl.innerHTML = '';

    // Se não houver pareceres válidos
    if (!pareceres || !pareceres.length) {
      console.warn('[PareceresJuridicosTag] Nenhum parecer disponível');
      indexEl.innerHTML = '<div class="alert alert-warning">Nenhum parecer jurídico disponível para visualização.</div>';
      iframe.removeAttribute('src');
      if (window.modalManager) {
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Abrindo via ModalManager');
        window.modalManager.openModal('parecer-modal');
      } else {
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Abrindo via display direto');
        overlay.classList.remove('d-none');
        overlay.style.display = 'flex';
      }
      return;
    }

    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Montando lista de', pareceres.length, 'pareceres');

    // Montar lista de pareceres
    pareceres.forEach((parecer, idx) => {
      const item = document.createElement('div');
      item.className = 'parecer-item';
      item.dataset.parecerId = String(parecer.id || '');
      
      const title = document.createElement('div');
      title.className = 'parecer-item-title';
      title.textContent = parecer.descricao || 'PARECER JURÍDICO';
      
      const info = document.createElement('div');
      info.className = 'parecer-item-info';
      const partesInfo = [];
      if (parecer.numero) partesInfo.push(`Nº ${parecer.numero}`);
      if (parecer.ano) partesInfo.push(`${parecer.ano}`);
      if (parecer.dataFinalizacao) partesInfo.push(parecer.dataFinalizacao);
      info.textContent = partesInfo.join(' • ');
      
      item.appendChild(title);
      item.appendChild(info);
      
      // Bloco de assinaturas
      const signContainer = document.createElement('div');
      signContainer.className = 'parecer-item-assinaturas';
      signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-loading">Carregando...</div>`;
      item.appendChild(signContainer);
      
      indexEl.appendChild(item);

      // Carregar assinaturas para este parecer
      if (parecer.id) {
        carregarAssinaturasNoCard(parecer.id, signContainer).catch(() => {
          signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-empty">Erro ao carregar</div>`;
        });
      } else {
        signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-empty">Indisponível</div>`;
      }

      // Click para carregar no iframe
      item.addEventListener('click', () => {
        indexEl.querySelectorAll('.parecer-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (parecer.id) {
          const url = API_DOC_ARQUIVO + encodeURIComponent(parecer.id);
          if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Carregando documento:', url);
          iframe.src = url;
        }
      });

      // Carregar primeiro parecer automaticamente
      if (idx === 0) {
        item.classList.add('active');
        if (parecer.id) {
          const url = API_DOC_ARQUIVO + encodeURIComponent(parecer.id);
          if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Carregando primeiro documento:', url);
          iframe.src = url;
        }
      }
    });

    // Abrir modal
    if (window.modalManager) {
      if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Abrindo modal via ModalManager');
      window.modalManager.openModal('parecer-modal');
    } else {
      if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Abrindo modal via display direto');
      overlay.classList.remove('d-none');
      overlay.style.display = 'flex';
    }
    
    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Modal aberto com sucesso');
  }

  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) window._processoPorNumeroCache = new Map();
    return window._processoPorNumeroCache;
  }

  function normalizarNumero(raw) {
    return String(raw || '').replace(/[^0-9./-]/g, '').trim();
  }

  function extrairPareceresDoCache(numeroProcesso) {
    const cache = getSharedProcessCache();
    const num = normalizarNumero(numeroProcesso);
    if (!num || !cache.has(num)) return [];
    
    const entry = cache.get(num);
    if (!entry || !Array.isArray(entry.documentos)) return [];
    
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
        const norm = combinado.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
        
        if (norm.includes('PARECER') && norm.includes('JURID')) {
          pareceres.push({
            id: doc.id,
            numero: doc.numero,
            ano: doc.ano,
            dataFinalizacao: doc.dataFinalizacao || '',
            descricao: combinado
          });
        }
      } catch (_) {}
    });
    
    return pareceres;
  }

  function obterDataMaisRecente(pareceres) {
    if (!pareceres || !pareceres.length) return null;
    
    // Tentar encontrar data mais recente
    let dataMaisRecente = null;
    pareceres.forEach(p => {
      if (p.dataFinalizacao) {
        const match = p.dataFinalizacao.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const data = new Date(match[3], match[2] - 1, match[1]);
          if (!dataMaisRecente || data > dataMaisRecente) {
            dataMaisRecente = data;
          }
        }
      }
    });
    
    return dataMaisRecente;
  }

  function formatarData(data) {
    if (!data) return '';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function criarTag(pareceres, meta) {
    const dataMaisRecente = obterDataMaisRecente(pareceres);
    if (!dataMaisRecente) return null;

    const tag = document.createElement('span');
    tag.className = 'parecer-juridico-tag';
    tag.title = 'Clique para visualizar parecer jurídico';
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    
    // Estrutura inline: SVG + texto (sem wrapper interno)
    tag.innerHTML = `${SVG_GAVEL}<span class="parecer-juridico-tag-text">${formatarData(dataMaisRecente)}</span>`;

    // Click para abrir modal
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Tag clicada, abrindo modal com', pareceres.length, 'pareceres', meta);
      openParecerModal(pareceres, meta);
    });

    // Suporte para Enter/Space (acessibilidade)
    tag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Tag ativada via teclado');
        openParecerModal(pareceres, meta);
      }
    });

    return tag;
  }

  function extrairMetaDaLinha(tr) {
    let projectName = '';
    let idPca = '';
    let numeroProcesso = '';

    try {
      // ID PCA
      const idCell = tr.querySelector('td:first-child');
      if (idCell) idPca = idCell.textContent.trim();

      // Projeto
      const projetoCell = tr.querySelector('td[data-label="Projeto de Aquisição"]');
      if (projetoCell) {
        projectName = projetoCell.textContent
          .replace(/[🔗🛍️]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Número do processo
      const processoCell = tr.querySelector('td[data-label="Processo"]');
      if (processoCell) {
        numeroProcesso = processoCell.dataset.processoNumero || 
                        processoCell.textContent.replace('🔗', '').trim();
      }
    } catch (_) {}

    return { projectName, idPca, numeroProcesso };
  }

  function processarTabela() {
    ensureStyles();
    
    if (DEBUG_TAG) console.log('[PareceresJuridicosTag] processarTabela chamado');
    
    // Processar tabelas de pareceres jurídicos:
    // 1. Tabela "Com Parecer Jurídico" (seção 3.3)
    // 2. Tabelas de analistas (seção 3.4)
    
    const seletores = [
      '#pareceres-com table',                      // 3.3 Com Parecer
      '.setor-details table.project-details-table' // 3.4 Pareceres por Analista
    ];
    
    let tabelasProcessadas = 0;
    let tagsAdicionadas = 0;
    
    seletores.forEach(seletor => {
      const tabelas = document.querySelectorAll(seletor);
      if (DEBUG_TAG) console.log(`[PareceresJuridicosTag] Encontradas ${tabelas.length} tabelas para seletor: ${seletor}`);
      
      tabelas.forEach(tabela => {
        const linhas = tabela.querySelectorAll('tbody tr');
        if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Processando', linhas.length, 'linhas da tabela');
        
        linhas.forEach(tr => {
          const projetoCell = tr.querySelector('td[data-label="Projeto de Aquisição"]');
          if (!projetoCell) {
            if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Célula de projeto não encontrada');
            return;
          }

          // Evitar duplicação
          if (projetoCell.querySelector('.parecer-juridico-tag')) {
            if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Tag já existe, pulando');
            return;
          }

          const meta = extrairMetaDaLinha(tr);
          if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Meta extraída:', meta);
          
          const pareceres = extrairPareceresDoCache(meta.numeroProcesso);
          if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Pareceres encontrados:', pareceres.length, pareceres);
          
          if (!pareceres || !pareceres.length) {
            if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Nenhum parecer encontrado para', meta.numeroProcesso);
            return;
          }

          // Criar tag
          const tag = criarTag(pareceres, meta);
          if (!tag) {
            if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Falha ao criar tag');
            return;
          }

          // Procurar pelo container de tags de espécie (padrão do EspecieProcessoTag.js)
          let wrapper = projetoCell.querySelector('.projeto-tags-wrapper');
          if (!wrapper) {
            // Criar wrapper se não existir
            wrapper = document.createElement('div');
            wrapper.className = 'projeto-tags-wrapper';
            projetoCell.appendChild(wrapper);
          }
          
          let container = wrapper.querySelector('.projeto-especie-container');
          if (!container) {
            // Criar container de espécie se não existir
            container = document.createElement('div');
            container.className = 'projeto-especie-container';
            wrapper.appendChild(container);
          }

          // Evitar duplicação - remover tag existente antes de adicionar nova
          const existingTag = container.querySelector('.parecer-juridico-tag');
          if (existingTag) {
            existingTag.remove();
          }

          // Inserir tag de parecer SEMPRE como primeiro elemento do container
          // Mesmo que outras tags já existam, inserir antes de todas
          if (container.firstChild) {
            container.insertBefore(tag, container.firstChild);
          } else {
            container.appendChild(tag);
          }
          tagsAdicionadas++;
          
          if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Tag adicionada com sucesso para', meta.numeroProcesso);
        });
        
        tabelasProcessadas++;
      });
    });

    if (DEBUG_TAG) console.log(`[PareceresJuridicosTag] Processamento concluído: ${tabelasProcessadas} tabelas, ${tagsAdicionadas} tags adicionadas`);
  }

  // Inicialização
  function init() {
    // Processar quando a tabela for expandida (seção 3.3)
    document.addEventListener('pareceres-tabela-expandida', (e) => {
      if (e.detail && e.detail.tabelaId === 'pareceres-com') {
        setTimeout(processarTabela, 100);
      }
    });

    // Processar quando analista for expandido (seção 3.4)
    document.addEventListener('pareceres-analista-expandido', () => {
      setTimeout(processarTabela, 100);
    });

    // Processar após carregamento inicial
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(processarTabela, 1500);
    });

    // Reprocessar quando cache de processos for atualizado
    document.addEventListener('processo-cache-atualizado', () => {
      setTimeout(processarTabela, 200);
    });

    // Reprocessar quando analytics for recarregado
    window.addEventListener('analytics-reload-finished', () => {
      setTimeout(processarTabela, 1500);
    });
  }

  // Iniciar
  init();

  // Expor para debug
  window.debugPareceresJuridicosTag = {
    processarTabela,
    openParecerModal,
    extrairPareceresDoCache
  };

  if (DEBUG_TAG) console.log('[PareceresJuridicosTag] Módulo carregado');
})();
