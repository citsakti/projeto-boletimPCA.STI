/**
 * ParecerJuridicoMainTag.js
 *
 * Objetivo: Adicionar uma tag verde de parecer jurídico nas células da coluna "Projeto de Aquisição"
 * na tabela principal (index.html), exibindo a data de emissão do parecer jurídico.
 * 
 * Características:
 *  - Tag verde com símbolo SVG representando o setor jurídico
 *  - Tamanho padrão seguindo o modelo de EspecieProcessoTag.js
 *  - Aparece SEMPRE ANTES da tag de EspecieProcessoTag.js dentro do .projeto-especie-container
 *  - Ao clicar, abre modal com visualização do parecer jurídico (igual ao AnalyticsPareceresJuridicosTag.js)
 *  - Utiliza informações de cache já baixadas pela API do AcompanhamentoProcessos.js
 * 
 * Dependências:
 *  - AcompanhamentoProcessos.js (cache compartilhado de processos)
 *  - EspecieProcessoTag.js (estrutura do container)
 *  - ModalManager.js (gerenciamento do modal)
 */

(function(){
  const DEBUG_TAG = false; // Ativar para depuração
  
  // API para documentos
  const API_DOC_ARQUIVO = 'https://api-add.tce.ce.gov.br/arquivos/documento?documento_id=';
  const API_DOC_ASSINATURAS = 'https://api-processos.tce.ce.gov.br/documento/assinaturas?documento_id=';
  
  // Cache de assinaturas por documento
  const cacheAssinaturasDoc = new Map(); // documentoId -> { assinaturas: Array, fetchedAt: number }

  // Emoji do setor jurídico (pergaminho)
  const EMOJI_JURIDICO = '⚖️';

  const SVG_PEN = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pen-fill" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001"/>
  </svg>`;

  // ===== Estilos CSS =====
  function ensureStyles() {
    if (document.getElementById('parecer-juridico-main-tag-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'parecer-juridico-main-tag-styles';
    style.textContent = `
      /* Tag de parecer jurídico - cores da tag "Hoje" do AcompanhamentoProcessos.js */
      .parecer-juridico-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        color: #2e7d32;
        border: 1px solid #a5d6a7;
        min-width: 20px;
        height: 20px;
        font-size: 14px;
        line-height: 1;
        user-select: none;
      }
      
      .parecer-juridico-tag:hover {
        background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
        border-color: #81c784;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }
      
      /* Responsividade */
      @media (max-width: 768px) {
        .parecer-juridico-tag {
          padding: 1px 3px;
          min-width: 18px;
          height: 18px;
          font-size: 12px;
        }
      }
      
      @media (max-width: 480px) {
        .parecer-juridico-tag {
          padding: 1px 2px;
          min-width: 16px;
          height: 16px;
          font-size: 11px;
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

  // ===== Modal =====
  function ensureModal() {
    if (document.getElementById('parecer-modal-overlay')) {
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Modal já existe');
      return;
    }
    
    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Criando modal');
    
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

    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Modal criado e adicionado ao DOM');

    // Registro no ModalManager
    const register = () => {
      if (window.modalManager && typeof window.modalManager.registerModal === 'function') {
        window.modalManager.registerModal('parecer-modal', {
          overlay: 'parecer-modal-overlay',
          content: '.modal-content',
          closeButtons: ['parecer-modal-close'],
          type: 'content'
        });
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Modal registrado no ModalManager');
      } else {
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] ModalManager não disponível, tentando novamente...');
        setTimeout(register, 150);
      }
    };
    register();

    // Fechar no X
    overlay.querySelector('#parecer-modal-close').addEventListener('click', (e) => {
      e.preventDefault();
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Botão fechar clicado');
      if (window.modalManager) window.modalManager.closeModal('parecer-modal');
      else overlay.style.display = 'none';
    });

    // Fechar ao clicar no overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Clique no overlay, fechando modal');
        if (window.modalManager) window.modalManager.closeModal('parecer-modal');
        else overlay.style.display = 'none';
      }
    });
  }

  // ===== Assinaturas =====
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
      else if (Array.isArray(data)) assinaturas = data;
      cacheAssinaturasDoc.set(key, { assinaturas, fetchedAt: Date.now() });
      return assinaturas;
    } catch (e) {
      console.error('[ParecerJuridicoMainTag] Erro ao buscar assinaturas:', e);
      cacheAssinaturasDoc.set(key, { assinaturas: [], fetchedAt: Date.now() });
      return [];
    }
  }

  function renderAssinaturas(signContainer, assinaturas) {
    if (!signContainer) return;
    const header = `<div class="sig-title">${SVG_PEN} Assinaturas</div>`;
    if (!assinaturas || assinaturas.length === 0) {
      signContainer.innerHTML = `${header}<div class="sig-empty">Sem assinaturas</div>`;
      return;
    }
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
      console.error('[ParecerJuridicoMainTag] Erro ao carregar assinaturas no card:', e);
      signContainer.innerHTML = `<div class="sig-title">${SVG_PEN} Assinaturas</div><div class="sig-empty">Erro ao carregar</div>`;
      return [];
    }
  }

  // ===== Funções de abertura do modal =====
  function openParecerModal(pareceres, meta = {}) {
    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] openParecerModal chamado com:', { pareceres, meta });
    
    ensureStyles();
    ensureModal();
    
    const overlay = document.getElementById('parecer-modal-overlay');
    const titleEl = document.getElementById('parecer-modal-title');
    const indexEl = document.getElementById('parecer-index');
    const iframe = document.getElementById('parecer-viewer-frame');
    
    if (!overlay || !indexEl || !iframe) {
      console.error('[ParecerJuridicoMainTag] Elementos do modal não encontrados!');
      return;
    }

    // Título
    const { projectName = '', idPca = '', numeroProcesso = '' } = meta || {};
    const mainTitle = projectName
      ? `Parecer Jurídico - ${idPca ? idPca + ' - ' : ''}${projectName}`
      : 'Parecer Jurídico';
    const numSuffix = numeroProcesso ? ` | ${numeroProcesso}` : '';
    titleEl.textContent = `${mainTitle}${numSuffix}`;

    // Limpar índice
    indexEl.innerHTML = '';

    if (!pareceres || !pareceres.length) {
      console.warn('[ParecerJuridicoMainTag] Nenhum parecer disponível');
      indexEl.innerHTML = '<div class="alert alert-warning">Nenhum parecer jurídico disponível para visualização.</div>';
      iframe.removeAttribute('src');
      if (window.modalManager) {
        window.modalManager.openModal('parecer-modal');
      } else {
        overlay.classList.remove('d-none');
        overlay.style.display = 'flex';
      }
      return;
    }

    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Montando lista de', pareceres.length, 'pareceres');

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

      // Carregar assinaturas
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
          if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Carregando documento:', url);
          iframe.src = url;
        }
      });

      // Carregar primeiro parecer automaticamente
      if (idx === 0) {
        item.classList.add('active');
        if (parecer.id) {
          const url = API_DOC_ARQUIVO + encodeURIComponent(parecer.id);
          if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Carregando primeiro documento:', url);
          iframe.src = url;
        }
      }
    });

    // Abrir modal
    if (window.modalManager) {
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Abrindo modal via ModalManager');
      window.modalManager.openModal('parecer-modal');
    } else {
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Abrindo modal via display direto');
      overlay.classList.remove('d-none');
      overlay.style.display = 'flex';
    }
  }

  // ===== Funções de cache e extração =====
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) window._processoPorNumeroCache = new Map();
    return window._processoPorNumeroCache;
  }

  function normalizarNumero(raw) {
    return String(raw || '').replace(/[^0-9./-]/g, '').trim();
  }

  function extrairPareceresDoCache(numeroProcesso, tipoProcesso = '') {
    const cache = getSharedProcessCache();
    const num = normalizarNumero(numeroProcesso);
    if (!num || !cache.has(num)) return [];
    
    const entry = cache.get(num);
    if (!entry || !Array.isArray(entry.documentos)) return [];
    
    // Obter ano vigente do YearSelector
    const anoVigente = window.getSelectedYear ? window.getSelectedYear() : new Date().getFullYear().toString();
    const isRenovacao = tipoProcesso.includes('🔄') || tipoProcesso.toUpperCase().includes('RENOVAÇÃO') || tipoProcesso.toUpperCase().includes('RENOVACAO');
    
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
          // Para processos de Renovação, filtrar apenas pareceres do ano vigente
          if (isRenovacao) {
            const anoDoc = doc.ano ? String(doc.ano) : '';
            if (anoDoc !== anoVigente) {
              if (DEBUG_TAG) console.log(`[ParecerJuridicoMainTag] Parecer filtrado (Renovação): ano ${anoDoc} != ${anoVigente}`);
              return; // Pular este parecer
            }
          }
          
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

  // ===== Criação da tag =====
  function criarTag(pareceres, meta) {
    const dataMaisRecente = obterDataMaisRecente(pareceres);
    if (!dataMaisRecente) return null;

    const tag = document.createElement('span');
    tag.className = 'parecer-juridico-tag';
    tag.title = `Parecer Jurídico - ${formatarData(dataMaisRecente)}`;
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    
    // Apenas o emoji (balança)
    tag.textContent = EMOJI_JURIDICO;

    // Click para abrir modal
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tag clicada, abrindo modal');
      openParecerModal(pareceres, meta);
    });

    // Suporte para Enter/Space
    tag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tag ativada via teclado');
        openParecerModal(pareceres, meta);
      }
    });

    return tag;
  }

  // ===== Extração de metadados da linha =====
  function obterNumeroDoTR(tr) {
    if (!tr) return '';
    let processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    if (!processoCell) return '';
    let texto = processoCell.dataset?.processoNumero || processoCell.textContent || '';
    texto = texto.replace('🔗', '').trim();
    return normalizarNumero(texto);
  }

  function obterCelulaProjeto(tr) {
    if (!tr) return null;
    let cel = tr.querySelector('td[data-label="Projeto de Aquisição"]') || tr.children[3] || null;
    return cel;
  }

  function extrairMetaDaLinha(tr) {
    let projectName = '';
    let idPca = '';
    let numeroProcesso = '';
    let tipoProcesso = '';

    try {
      // ID PCA
      const idCell = tr.querySelector('td:first-child');
      if (idCell) idPca = idCell.textContent.trim();

      // Tipo (coluna 2)
      const tipoCell = tr.querySelector('td[data-label="Tipo"]') || tr.children[2];
      if (tipoCell) {
        tipoProcesso = tipoCell.textContent.trim();
      }

      // Projeto
      const projetoCell = tr.querySelector('td[data-label="Projeto de Aquisição"]');
      if (projetoCell) {
        projectName = projetoCell.textContent
          .replace(/[🔗🛍️⚖️]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Número do processo
      numeroProcesso = obterNumeroDoTR(tr);
    } catch (_) {}

    return { projectName, idPca, numeroProcesso, tipoProcesso };
  }

  // ===== Processamento de linhas =====
  function processarLinha(tr) {
    if (!tr) return;
    
    const numero = obterNumeroDoTR(tr);
    if (!numero) return;
    
    const celulaProjeto = obterCelulaProjeto(tr);
    if (!celulaProjeto) return;
    
    try {
      // Verificar status do processo (coluna 5 - "Status do Processo")
      let statusCell = tr.querySelector('td[data-label="Status do Processo"]');
      if (!statusCell) statusCell = tr.children[5];
      
      const statusTexto = statusCell ? statusCell.textContent.trim().toUpperCase() : '';
      
      // Remover tag existente se o status for CONTRATADO ou RENOVADO
      const existingTag = celulaProjeto.querySelector('.parecer-juridico-tag');
      if (statusTexto.includes('CONTRATADO') || statusTexto.includes('RENOVADO')) {
        if (existingTag) {
          existingTag.remove();
          if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tag removida para status:', statusTexto);
        }
        return; // Não processar mais esta linha
      }
      
      // Evitar duplicação
      if (existingTag) {
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tag já existe, pulando');
        return;
      }

      const meta = extrairMetaDaLinha(tr);
      const pareceres = extrairPareceresDoCache(numero, meta.tipoProcesso);
      
      if (!pareceres || !pareceres.length) {
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Nenhum parecer encontrado para', numero);
        return;
      }

      // Criar tag
      const tag = criarTag(pareceres, meta);
      if (!tag) {
        if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Falha ao criar tag');
        return;
      }

      // Procurar pelo container de tags de espécie
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      
      let container = wrapper.querySelector('.projeto-especie-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'projeto-especie-container';
        wrapper.appendChild(container);
      }

      // Inserir tag DEPOIS da tag de espécie E da tag de contrato (ordem: espécie -> contrato -> parecer)
      const especieTag = container.querySelector('.especie-processo-tag');
      const contratoTag = container.querySelector('.contrato-tag');
      
      if (contratoTag) {
        // Tag de contrato existe: inserir DEPOIS dela (prioridade máxima)
        if (contratoTag.nextSibling) {
          container.insertBefore(tag, contratoTag.nextSibling);
        } else {
          container.appendChild(tag);
        }
      } else if (especieTag) {
        // Sem tag de contrato, mas com tag de espécie: inserir DEPOIS da espécie
        if (especieTag.nextSibling) {
          container.insertBefore(tag, especieTag.nextSibling);
        } else {
          container.appendChild(tag);
        }
      } else {
        // Nenhuma tag existe ainda: inserir no início (será reordenada quando as outras chegarem)
        if (container.firstChild) {
          container.insertBefore(tag, container.firstChild);
        } else {
          container.appendChild(tag);
        }
      }
      
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tag adicionada com sucesso para', numero);
    } catch (error) {
      console.warn('[ParecerJuridicoMainTag] Erro ao processar linha:', error);
    }
  }

  function processarTodasAsLinhas() {
    ensureStyles();
    
    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] processarTodasAsLinhas chamado');
    
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) {
      if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tbody não encontrado');
      return;
    }
    
    const linhas = tbody.querySelectorAll('tr');
    if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Processando', linhas.length, 'linhas');
    
    let tagsAdicionadas = 0;
    linhas.forEach(tr => {
      const before = tr.querySelector('.parecer-juridico-tag') ? 1 : 0;
      processarLinha(tr);
      const after = tr.querySelector('.parecer-juridico-tag') ? 1 : 0;
      if (after > before) tagsAdicionadas++;
      
      // Garantir ordem correta: espécie primeiro, depois parecer
      reordenarTags(tr);
    });
    
    if (DEBUG_TAG) console.log(`[ParecerJuridicoMainTag] ${tagsAdicionadas} tags adicionadas`);
  }

  // Função para reordenar tags: espécie -> contrato -> parecer
  function reordenarTags(tr) {
    try {
      const celulaProjeto = obterCelulaProjeto(tr);
      if (!celulaProjeto) return;
      
      const container = celulaProjeto.querySelector('.projeto-especie-container');
      if (!container) return;
      
      const especieTag = container.querySelector('.especie-processo-tag');
      const contratoTag = container.querySelector('.contrato-tag');
      const parecerTag = container.querySelector('.parecer-juridico-tag');
      
      // Ordem desejada: espécie -> contrato -> parecer
      // Verificar e corrigir a ordem se necessário
      
      if (especieTag && contratoTag && parecerTag) {
        // Todas as três tags existem: garantir ordem correta
        const tags = [especieTag, contratoTag, parecerTag];
        const currentOrder = [];
        let current = container.firstChild;
        
        while (current) {
          if (tags.includes(current)) {
            currentOrder.push(current);
          }
          current = current.nextSibling;
        }
        
        // Verificar se a ordem está correta
        const isCorrectOrder = 
          currentOrder[0] === especieTag &&
          currentOrder[1] === contratoTag &&
          currentOrder[2] === parecerTag;
        
        if (!isCorrectOrder) {
          // Reordenar: remover todas e reinserir na ordem correta
          especieTag.remove();
          contratoTag.remove();
          parecerTag.remove();
          
          // Reinserir na ordem correta
          container.insertBefore(especieTag, container.firstChild);
          if (especieTag.nextSibling) {
            container.insertBefore(contratoTag, especieTag.nextSibling);
          } else {
            container.appendChild(contratoTag);
          }
          if (contratoTag.nextSibling) {
            container.insertBefore(parecerTag, contratoTag.nextSibling);
          } else {
            container.appendChild(parecerTag);
          }
          
          if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tags reordenadas: espécie -> contrato -> parecer');
        }
      } else if (especieTag && contratoTag) {
        // Apenas espécie e contrato: garantir que espécie vem antes
        let especieBeforeContrato = false;
        let current = container.firstChild;
        
        while (current) {
          if (current === especieTag) {
            especieBeforeContrato = true;
            break;
          }
          if (current === contratoTag) {
            especieBeforeContrato = false;
            break;
          }
          current = current.nextSibling;
        }
        
        if (!especieBeforeContrato) {
          // Mover contrato para depois de espécie
          if (especieTag.nextSibling && especieTag.nextSibling !== contratoTag) {
            container.insertBefore(contratoTag, especieTag.nextSibling);
          } else if (!especieTag.nextSibling) {
            container.appendChild(contratoTag);
          }
        }
      } else if (contratoTag && parecerTag) {
        // Apenas contrato e parecer: garantir que contrato vem antes
        let contratoBeforeParecer = false;
        let current = container.firstChild;
        
        while (current) {
          if (current === contratoTag) {
            contratoBeforeParecer = true;
            break;
          }
          if (current === parecerTag) {
            contratoBeforeParecer = false;
            break;
          }
          current = current.nextSibling;
        }
        
        if (!contratoBeforeParecer) {
          // Mover parecer para depois de contrato
          if (contratoTag.nextSibling && contratoTag.nextSibling !== parecerTag) {
            container.insertBefore(parecerTag, contratoTag.nextSibling);
          } else if (!contratoTag.nextSibling) {
            container.appendChild(parecerTag);
          }
        }
      } else if (especieTag && parecerTag) {
        // Apenas espécie e parecer: garantir que espécie vem antes
        let especieBeforeParecer = false;
        let current = container.firstChild;
        
        while (current) {
          if (current === especieTag) {
            especieBeforeParecer = true;
            break;
          }
          if (current === parecerTag) {
            especieBeforeParecer = false;
            break;
          }
          current = current.nextSibling;
        }
        
        if (!especieBeforeParecer) {
          // Mover parecer para depois de espécie
          if (especieTag.nextSibling && especieTag.nextSibling !== parecerTag) {
            container.insertBefore(parecerTag, especieTag.nextSibling);
          } else if (!especieTag.nextSibling) {
            container.appendChild(parecerTag);
          }
          
          if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Tags reordenadas: espécie -> parecer');
        }
      }
    } catch (error) {
      console.warn('[ParecerJuridicoMainTag] Erro ao reordenar tags:', error);
    }
  }

  // ===== Debounce e agendamento =====
  let debounceId = null;
  function scheduleUpdate(delay = 400) {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      processarTodasAsLinhas();
    }, delay);
  }

  // ===== Inicialização =====
  function inicializar() {
    try {
      ensureStyles();
      scheduleUpdate(600);
      
      if (DEBUG_TAG) {
        console.log('[ParecerJuridicoMainTag] Módulo inicializado com sucesso');
      }
    } catch (error) {
      console.error('[ParecerJuridicoMainTag] Erro na inicialização:', error);
    }
  }

  // ===== Event Listeners =====
  document.addEventListener('tabela-carregada', inicializar);

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles();
    scheduleUpdate(800);
  });

  if (document.readyState !== 'loading') {
    ensureStyles();
    scheduleUpdate(1000);
  }

  // Quando o acompanhamento for atualizado, reprocessar
  document.addEventListener('acompanhamento-atualizado', () => scheduleUpdate(300));
  document.addEventListener('acompanhamento-loading', () => scheduleUpdate(0));
  
  // Quando cache de processos for atualizado
  document.addEventListener('processo-cache-atualizado', (ev) => {
    try {
      const nums = (ev && ev.detail && Array.isArray(ev.detail.numeros)) ? ev.detail.numeros : [];
      if (nums.length === 1) {
        // Atualização de um único processo: processar apenas essa linha
        const numero = nums[0];
        const tbody = document.querySelector('#detalhes table tbody');
        if (tbody) {
          tbody.querySelectorAll('tr').forEach(tr => {
            const numeroTr = obterNumeroDoTR(tr);
            if (numeroTr === numero) {
              processarLinha(tr);
              reordenarTags(tr);
            }
          });
        }
      } else {
        // Múltiplos processos: agendar atualização geral
        scheduleUpdate(150);
      }
    } catch (_) {
      scheduleUpdate(200);
    }
  });

  // Listener para atualizações parciais por número
  document.addEventListener('acompanhamento-atualizado-parcial', (ev) => {
    try {
      const numero = ev.detail && ev.detail.numero ? ev.detail.numero : null;
      if (numero) {
        const tbody = document.querySelector('#detalhes table tbody');
        if (tbody) {
          tbody.querySelectorAll('tr').forEach(tr => {
            const numeroTr = obterNumeroDoTR(tr);
            if (numeroTr === numero) {
              processarLinha(tr);
              reordenarTags(tr);
            }
          });
        }
      } else {
        scheduleUpdate(300);
      }
    } catch (error) {
      console.warn('[ParecerJuridicoMainTag] Erro no evento parcial:', error);
      scheduleUpdate(300);
    }
  });

  // Reordenar tags quando espécie for atualizada
  document.addEventListener('tabela-carregada', () => {
    setTimeout(() => {
      const tbody = document.querySelector('#detalhes table tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => reordenarTags(tr));
      }
    }, 1500);
  });

  // Observar inserções no DOM
  try {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (
              node.matches?.('#detalhes table') ||
              node.querySelector?.('#detalhes table')
            ) {
              shouldUpdate = true;
            }
          });
        }
      }
      if (shouldUpdate) scheduleUpdate(200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (errObs) {
    console.warn('[ParecerJuridicoMainTag] MutationObserver não pôde ser iniciado:', errObs);
  }

  // ===== Expor para debug =====
  window.debugParecerJuridicoMainTag = {
    inicializar,
    processarTodasAsLinhas,
    processarLinha,
    scheduleUpdate,
    openParecerModal,
    extrairPareceresDoCache,
    reordenarTags,
    getAnoVigente: () => window.getSelectedYear ? window.getSelectedYear() : new Date().getFullYear().toString()
  };

  if (DEBUG_TAG) console.log('[ParecerJuridicoMainTag] Módulo carregado');
})();
