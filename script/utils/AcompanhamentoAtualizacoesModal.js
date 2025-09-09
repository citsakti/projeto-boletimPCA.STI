(function(){
  // AcompanhamentoAtualizacoesModal.js
  // Mostra um modal com os processos que tiveram mudança após um auto-refresh

  // ===== Helpers compartilhados =====
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) {
      window._processoPorNumeroCache = new Map();
    }
    return window._processoPorNumeroCache;
  }
  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }
  function obterNumeroDoTR(tr) {
    let processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    if (!processoCell) return '';
    let texto = (processoCell.dataset && processoCell.dataset.processoNumero) ? processoCell.dataset.processoNumero : (processoCell.textContent || '');
    texto = texto.replace('🔗', '').trim();
    return normalizarNumero(texto);
  }
  function extrairProjetoDoTR(tr) {
    let projectName = '';
    try {
      const table = tr.closest('table');
      if (table) {
        const ths = Array.from(table.querySelectorAll('thead th'));
        const idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
        if (idxProjeto >= 0 && tr.children[idxProjeto]) {
          projectName = tr.children[idxProjeto].textContent.trim();
        }
      }
      if (!projectName) {
        const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset && c.dataset.label) || ''));
        if (candidato) projectName = candidato.textContent.trim();
      }
    } catch(_) {}
    return projectName;
  }
  function parseDateBR(dstr) {
    if (!dstr || !/\d{2}\/\d{2}\/\d{4}/.test(dstr)) return null;
    const [d,m,a] = dstr.split('/').map(Number);
    const dt = new Date(a, m-1, d, 0,0,0,0);
    return isNaN(dt.getTime()) ? null : dt;
  }
  function pickUltimoDocumento(documentos) {
    if (!Array.isArray(documentos) || documentos.length === 0) return null;
    // Preferir por dataFinalizacao mais recente; fallback: último do array
    const comData = documentos.filter(d => d && d.dataFinalizacao && parseDateBR(d.dataFinalizacao));
    if (comData.length) {
      comData.sort((a,b)=> parseDateBR(b.dataFinalizacao) - parseDateBR(a.dataFinalizacao));
      return comData[0];
    }
    return documentos[documentos.length - 1];
  }
  function formatDocResumo(doc) {
    if (!doc) return '';
    const tipo = (doc.tipoAtoDocumento && doc.tipoAtoDocumento.descricao) ? doc.tipoAtoDocumento.descricao : 'Documento';
    const partes = [];
    if (doc.numero) partes.push(String(doc.numero));
    if (doc.ano) partes.push(String(doc.ano));
    const sufixo = partes.length ? ` ${partes.join('/')}` : '';
    const data = doc.dataFinalizacao ? ` • ${doc.dataFinalizacao}` : '';
    return `${tipo}${sufixo}${data}`;
  }

  // ===== Snapshot da tabela =====
  function snapshotTabela() {
    const tbody = document.querySelector('#detalhes table tbody');
    const shared = getSharedProcessCache();
    const mapa = new Map(); // numero -> state
    if (!tbody) return mapa;
    tbody.querySelectorAll('tr').forEach(tr => {
      const numero = obterNumeroDoTR(tr);
      if (!numero) return;
      const acompCell = tr.querySelector('td[data-label="Acompanhamento"]') || tr.children[4];
      const setorAtual = (acompCell && acompCell.dataset && acompCell.dataset.setorAtual) ? acompCell.dataset.setorAtual : '';
      const projeto = extrairProjetoDoTR(tr);
      // Dados da API (cache compartilhado)
      let dtUltimoEnc = '';
      let sigiloso = false;
      let docUltimo = null;
      let rawCopy = null;
      let docsCopy = null;
      if (shared && shared.has(numero)) {
        const entry = shared.get(numero);
        const raw = entry && entry.raw ? entry.raw : null;
        dtUltimoEnc = raw && raw.dtUltimoEncaminhamento ? raw.dtUltimoEncaminhamento : '';
        sigiloso = !!(entry && entry.sigiloso);
        const docs = Array.isArray(entry && entry.documentos) ? entry.documentos : [];
        if (!sigiloso) docUltimo = pickUltimoDocumento(docs);
        try { rawCopy = raw ? JSON.parse(JSON.stringify(raw)) : null; } catch(_) { rawCopy = raw || null; }
        try { docsCopy = JSON.parse(JSON.stringify(docs)); } catch(_) { docsCopy = docs || []; }
      }
      mapa.set(numero, { numero, projeto, setor: setorAtual || null, dtUltimoEnc, sigiloso, docUltimo, raw: rawCopy, documentos: docsCopy });
    });
    return mapa;
  }

  // ===== Modal =====
  function ensureStyles() {
    if (document.getElementById('updates-notification-styles')) return;
    const style = document.createElement('style');
    style.id = 'updates-notification-styles';
    style.textContent = `
      #update-notification-overlay .update-notification-content { width: min(900px, 92vw); max-height: 88vh; overflow: auto; background: #fff; border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.2); }
      .update-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--brand-primary, #0d6efd); color: #fff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .update-modal-body { padding: 12px 16px; }
      .update-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; background: #fafafa; }
      .update-title { font-weight: 700; color: #111827; }
      .update-move { color: #374151; margin-top: 4px; }
      .update-doc { color: #1f2937; margin-top: 4px; font-style: italic; }
      .update-empty { padding: 16px; color: #374151; }
      .btn-close-update { background: transparent; border: none; color: #fff; font-size: 20px; line-height: 1; cursor: pointer; }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById('update-notification-overlay')) return;
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.id = 'update-notification-overlay';
    overlay.className = 'modal-overlay d-none position-fixed top-0 start-0 w-100 h-100';
    overlay.style.cssText = 'display:none; background: rgba(0,0,0,0.5); align-items: center; justify-content: center;';
    overlay.innerHTML = `
      <div class="update-notification-content">
        <div class="update-modal-header">
          <h5 id="update-notification-title" class="mb-0">Atualizações de Acompanhamento</h5>
          <button id="update-notification-close-btn" class="btn-close-update" aria-label="Fechar">×</button>
        </div>
        <div class="update-modal-body" id="update-notification-body"></div>
      </div>`;
    document.body.appendChild(overlay);

    // Registrar no ModalManager se disponível
    const register = () => {
      if (window.modalManager && typeof window.modalManager.registerModal === 'function') {
        window.modalManager.registerModal('update-notification', {
          overlay: 'update-notification-overlay',
          content: '.update-notification-content',
          closeButtons: ['update-notification-close-btn'],
          type: 'content'
        });
      } else {
        setTimeout(register, 150);
      }
    };
    register();

    // Fallback fechar
    overlay.querySelector('#update-notification-close-btn').addEventListener('click', (e)=>{
      e.preventDefault();
      if (window.modalManager) window.modalManager.closeModal('update-notification');
      else overlay.style.display = 'none';
    });
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay) {
        if (window.modalManager) window.modalManager.closeModal('update-notification');
        else overlay.style.display = 'none';
      }
    });
  }

  function abrirModalAtualizacoes(itens) {
    ensureModal();
    const body = document.getElementById('update-notification-body');
    const titleEl = document.getElementById('update-notification-title');
    if (!body) return;
    body.innerHTML = '';

    // Normaliza, deduplica por número e ordena por projeto e número
    const normalizados = Array.isArray(itens) ? itens.filter(Boolean).map(i => ({
      numero: i.numero || '',
      projeto: i.projeto || '',
      de: i.de || '',
      para: i.para || '',
      sigiloso: !!i.sigiloso,
      docResumo: i.docResumo || ''
    })) : [];
    const porNumero = new Map();
    for (const it of normalizados) {
      const num = normalizarNumero(it.numero);
      if (!num) continue;
      // Se houver duplicatas, mantém a última ocorrência (mais recente na lista)
      porNumero.set(num, { ...it, numero: num });
    }
    const lista = Array.from(porNumero.values()).sort((a,b)=>{
      const pa = (a.projeto || '').localeCompare(b.projeto || '');
      if (pa !== 0) return pa;
      return (a.numero || '').localeCompare(b.numero || '');
    });

    if (titleEl) {
      const count = lista.length;
      titleEl.textContent = count > 0 ? `Atualizações de Acompanhamento (${count})` : 'Atualizações de Acompanhamento';
    }

    if (!lista.length) {
      const div = document.createElement('div');
      div.className = 'update-empty';
      div.textContent = 'Nenhuma alteração relevante detectada.';
      body.appendChild(div);
    } else {
      const frag = document.createDocumentFragment();
      lista.forEach(info => {
        const div = document.createElement('div');
        div.className = 'update-item';
        const titulo = document.createElement('div');
        titulo.className = 'update-title';
        titulo.textContent = `${info.numero} - ${info.projeto || 'Sem projeto'}`;
        const movimento = document.createElement('div');
        movimento.className = 'update-move';
        const de = info.de || '(indefinido)';
        const para = info.para || '(indefinido)';
        movimento.textContent = `${de} → ${para}`;
        div.appendChild(titulo);
        div.appendChild(movimento);
        if (!info.sigiloso && info.docResumo) {
          const doc = document.createElement('div');
          doc.className = 'update-doc';
          doc.textContent = `Última peça: ${info.docResumo}`;
          div.appendChild(doc);
        }
        frag.appendChild(div);
      });
      body.appendChild(frag);
    }

    if (window.modalManager) window.modalManager.openModal('update-notification');
    else document.getElementById('update-notification-overlay').style.display = 'flex';
  }

  // Notificações do navegador (opcional, ajuda a trazer a atenção do usuário)
  function ensureNotificationPermission() {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(()=>{});
      }
    } catch(_) {}
  }
  function notifyUpdates(itens) {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      if (!document.hidden) return; // só notifica se estiver em outra aba/janela
      const first = itens[0];
      const count = itens.length;
      const title = count > 1 ? `Atualizações detectadas (${count})` : 'Atualização detectada';
      const body = count > 1
        ? `${first.numero} - ${first.projeto || ''} e mais ${count-1}`
        : `${first.numero} - ${first.projeto || ''}`;
      const n = new Notification(title, { body });
      n.onclick = () => { try { window.focus(); } catch(_) {} n.close(); };
      setTimeout(() => { try { n.close(); } catch(_) {} }, 8000);
    } catch(_) {}
  }

  // ===== Ciclo de atualização =====
  let prevSnapshot = null;
  let awaitingCycle = false;
  let lastCycleId = 0;

  function onAutoRefresh(evtDetail) {
    // Tira snapshot antes das mudanças
    prevSnapshot = snapshotTabela();
    awaitingCycle = true;
    lastCycleId = (evtDetail && evtDetail.count) || (lastCycleId + 1);
    if (window._acompanhamentoDebug) {
      console.log('[AtualizacoesModal] Snapshot capturado para ciclo', lastCycleId, 'itens:', prevSnapshot.size);
    }
  }

  function onAcompanhamentoAtualizado() {
    if (!awaitingCycle || !prevSnapshot) return;
    const post = snapshotTabela();
    const itens = [];

    // União de chaves
    const numeros = new Set([...prevSnapshot.keys(), ...post.keys()]);
    numeros.forEach(numero => {
      const antes = prevSnapshot.get(numero);
      const depois = post.get(numero);
      if (!antes || !depois) return;
      const mudouSetor = (antes.setor || '') !== (depois.setor || '');
      const mudouData = (antes.dtUltimoEnc || '') !== (depois.dtUltimoEnc || '');
      // Comparação profunda do JSON (raw + documentos) para detectar mudanças reais
      let mudouJson = false;
      try {
        const aRaw = JSON.stringify(antes.raw || {});
        const bRaw = JSON.stringify(depois.raw || {});
        const aDocs = JSON.stringify(antes.documentos || []);
        const bDocs = JSON.stringify(depois.documentos || []);
        mudouJson = (aRaw !== bRaw) || (aDocs !== bDocs);
      } catch(_) {}
      if (mudouSetor || mudouData || mudouJson) {
        const docResumo = (!depois.sigiloso && depois.docUltimo) ? formatDocResumo(depois.docUltimo) : '';
        itens.push({
          numero,
          projeto: depois.projeto || antes.projeto || '',
          de: antes.setor || '',
          para: depois.setor || '',
          sigiloso: !!depois.sigiloso,
          docResumo
        });
      }
    });

    awaitingCycle = false;

    if (itens.length) {
      abrirModalAtualizacoes(itens);
      notifyUpdates(itens);
      // Tentativa de trazer a aba/janela à frente (limitado por políticas do navegador)
      try { window.focus(); } catch(_) {}
      // Breve destaque no título da aba
      try {
        const oldTitle = document.title;
        const count = itens.length;
        document.title = `(${count}) Atualizações • ${oldTitle}`;
        setTimeout(()=>{ document.title = oldTitle; }, 10000);
      } catch(_) {}
    } else if (window._acompanhamentoDebug) {
      console.log('[AtualizacoesModal] Sem alterações relevantes no ciclo', lastCycleId);
    }
  }

  // ===== Wiring de eventos =====
  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles();
  ensureNotificationPermission();
  });

  // Evento emitido pelo AcompanhamentoProcessos.js ao disparar auto refresh
  document.addEventListener('acompanhamento-auto-refresh', (e) => {
    try { onAutoRefresh(e && e.detail); } catch(_) {}
  });

  // Evento emitido após aplicação dos dados na tabela
  document.addEventListener('acompanhamento-atualizado', () => {
    // pequeno atraso para garantir DOM aplicado
    setTimeout(() => { try { onAcompanhamentoAtualizado(); } catch(_) {} }, 50);
  });

  // Debug público
  window.debugAcompanhamentoAtualizacoes = {
    snapshot: snapshotTabela,
    openSample: function(){
      abrirModalAtualizacoes([
        { numero: '01234/2025-0', projeto: 'Projeto Exemplo', de: 'Protocolo', para: 'ASCOM', sigiloso: false, docResumo: 'Despacho 123/2025 • 05/09/2025' },
        { numero: '99999/2025-0', projeto: 'Outro Projeto', de: 'ASJUR', para: 'COARE', sigiloso: true }
      ]);
    }
  };
})();
