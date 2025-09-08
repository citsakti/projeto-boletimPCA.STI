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
  const API_DOC_ASSINATURAS = 'https://api-add.tce.ce.gov.br/arquivos/documento?documento_id=';

  // Cache de respostas por número de processo
  const cacheProcessoDocs = new Map(); // numero -> { raw, documentos: [], sigiloso: boolean }

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
      .doc-icon-btn[aria-disabled="true"] { opacity: .6; cursor: not-allowed; }
      .doc-icon-btn svg { display: block; }
      .doc-icon-tooltip { position: relative; }
      .doc-icon-tooltip:hover::after { content: attr(data-title); position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: rgba(60,64,67,.9); color: #fff; padding: 4px 6px; font-size: 12px; border-radius: 4px; white-space: nowrap; pointer-events: none; z-index: 10; }
  /* Limites e contenção do modal */
  #documentos-modal-overlay .modal-content { width: min(1200px, 90vw); height: min(90vh, 900px); display: flex; flex-direction: column; overflow: hidden; }
  #documentos-modal-overlay .modal-header { flex: 0 0 auto; }
  #documentos-modal-overlay .flex-fill { flex: 1 1 auto; min-height: 0; }
  /* Corpo com índice à esquerda e viewer à direita */
  .documentos-modal-body { flex: 1 1 auto; height: 100%; min-height: 0; overflow: hidden; display: grid; grid-template-columns: 320px 1fr; }
      .documentos-index { border-right: 1px solid #eee; overflow: auto; padding: 10px; min-width: 0; }
      .documentos-index .doc-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; }
      .documentos-index .doc-item:hover { background: #f6f8fc; border-color: #e9eef6; }
      .documentos-index .doc-item.active { background: #e8f0fe; border-color: #d2e3fc; }
      .documentos-index .doc-main { display: grid; gap: 2px; min-width: 0; }
      .documentos-index .doc-title { font-size: 13px; font-weight: 600; color: #202124; overflow: hidden; text-overflow: ellipsis;; }
      .documentos-index .doc-sub { font-size: 12px; color: #5f6368; overflow: hidden; text-overflow: ellipsis; }
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
    const numSuffix = numeroProcesso ? ` • Nº ${numeroProcesso}` : '';
    titleEl.textContent = `${mainTitle}${numSuffix}`;
    indexEl.innerHTML = '';

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
      sub.textContent = [setor, data].filter(Boolean).join('');
      main.appendChild(titulo);
      main.appendChild(sub);

  item.appendChild(main);
      indexEl.appendChild(item);

      if (canDisplay) {
        item.addEventListener('click', () => {
          // Atualiza seleção
          indexEl.querySelectorAll('.doc-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          // Carrega PDF
          iframe.src = API_DOC_ARQUIVO + encodeURIComponent(doc.id);
        });
      }
    });

    // Seleciona e carrega primeiro documento exibível
    const firstItem = indexEl.querySelector('.doc-item:not(.disabled)');
    if (firstDisplayable && firstItem) {
      firstItem.classList.add('active');
      iframe.src = API_DOC_ARQUIVO + encodeURIComponent(firstDisplayable.id);
    } else {
      iframe.removeAttribute('src');
      iframe.title = 'Nenhum documento disponível para visualização';
    }

    if (window.modalManager) window.modalManager.openModal('documentos-modal');
    else document.getElementById('documentos-modal-overlay').style.display = 'flex';
  }

  // ===== Fetch =====
  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  async function fetchProcessoPorNumero(numero, { timeoutMs = 12000 } = {}) {
    const num = normalizarNumero(numero);
    if (!num) return null;
    if (cacheProcessoDocs.has(num)) return cacheProcessoDocs.get(num);

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(API_POR_NUMERO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: num }),
        signal: controller.signal
      });
      if (!resp.ok) {
        // Tenta uma variação de chave comum (nrProcesso)
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
              return processarResposta(num, data2);
            }
          } catch(_) { /* ignore */ }
        }
        const t = await resp.text().catch(()=> '');
        throw new Error(`HTTP ${resp.status} ${t || resp.statusText}`);
      }
      const data = await resp.json();
      return processarResposta(num, data);
    } finally {
      clearTimeout(to);
    }
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
      return result;
    } catch (e) {
      const result = { raw: null, documentos: [], sigiloso: false };
      cacheProcessoDocs.set(numero, result);
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

  function addIconeSeNecessario(tr, info) {
    // Alvo preferencial: célula de Acompanhamento; fallback: célula de Processo (para linhas sem tag de tempo)
    let targetCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
    if (!targetCell) {
      targetCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    }
    if (!targetCell) return;
    const tagWrapper = targetCell.querySelector('.tempo-acompanhamento-wrapper');
    const insertionTarget = tagWrapper || targetCell;

    // Evitar duplicar
    if (insertionTarget.querySelector('.doc-icon-wrapper')) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'doc-icon-wrapper';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'doc-icon-btn doc-icon-tooltip';
    if (info && info.sigiloso) {
      btn.innerHTML = SVG_LOCK;
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('data-title', 'processo sigiloso');
    } else {
      btn.innerHTML = SVG_JOURNALS;
      btn.title = 'Abrir documentos';
    }

    wrapper.appendChild(btn);
  // Inserir após a tag de tempo quando existir; caso contrário, ao final do conteúdo da célula alvo
  insertionTarget.appendChild(wrapper);

    if (!info || info.sigiloso) return; // nada para abrir

    // Clique para abrir modal com documentos
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const numero = obterNumeroDoTR(tr);
      const dados = cacheProcessoDocs.get(numero) || info;
      const docs = (dados && Array.isArray(dados.documentos)) ? dados.documentos : [];
      const meta = extrairMetaDoTR(tr);
      openDocumentosModal(numero, docs, meta);
    });
  }

  // Extrai metadados (projeto e ID PCA) da linha, semelhante ao ProcessoModal
  function extrairMetaDoTR(tr) {
    let projectName = '';
    let idPca = '';
    try {
      const table = tr.closest('table');
      if (table) {
        const ths = Array.from(table.querySelectorAll('thead th'));
        const idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
        if (idxProjeto >= 0 && tr.children[idxProjeto]) {
          projectName = tr.children[idxProjeto].textContent.trim();
        }
        const idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
        if (idxId >= 0 && tr.children[idxId]) {
          idPca = tr.children[idxId].textContent.trim();
        }
      }
      if (!projectName) {
        const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset.label||'')));
        if (candidato) projectName = candidato.textContent.trim();
      }
      if (!idPca) {
        const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset.label||'')));
        if (idCand) idPca = idCand.textContent.trim();
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

    // Buscar dados (paralelo com limite simples)
    const maxConc = 4;
    let i = 0;
    async function worker() {
      while (i < numeros.length) {
        const idx = i++;
        const numero = numeros[idx];
        try { await fetchProcessoPorNumero(numero); } catch(_) {}
      }
    }
    const workers = Array.from({length: Math.min(maxConc, numeros.length)}, worker);
    await Promise.all(workers);

    // Inserir ícones
    linhas.forEach(tr => {
      const numero = obterNumeroDoTR(tr);
      if (!numero) return;
      const info = cacheProcessoDocs.get(numero);
      addIconeSeNecessario(tr, info);
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
  // Quando a tabela sinaliza carregada (caso emitam este evento em outros fluxos)
  document.addEventListener('tabela-carregada', () => scheduleUpdate(600));

  // Expor para debug manual
  window.debugDocumentosProcesso = {
    fetch: fetchProcessoPorNumero,
  abrir: openDocumentosModal,
    atualizar: atualizarIconesDocumentos,
    cache: cacheProcessoDocs
  };
})();
