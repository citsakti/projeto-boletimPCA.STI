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

      /* Modal */
      #historico-tramitacoes-overlay { display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1055; }
      #historico-tramitacoes-overlay .historico-modal { width: min(980px, 94vw); max-height: 90vh; overflow: auto; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
      .historico-header { display:flex; align-items:center; justify-content: space-between; padding: 12px 16px; background: var(--brand-primary, #0d6efd); color: #fff; border-top-left-radius:8px; border-top-right-radius:8px; }
      .historico-body { padding: 12px 16px; }
      .historico-section { margin-bottom: 14px; }
      .historico-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; background: #fafafa; }
      .historico-title { font-weight: 700; color: #111827; margin-bottom: 6px; }
      .historico-sub { color: #374151; }
      .btn-close-historico { background: transparent; border: none; color: #fff; font-size: 20px; line-height: 1; cursor: pointer; }
      .setor-pill { display:flex; align-items:center; justify-content: space-between; gap: 8px; }
      .setor-nome { font-weight: 600; color: #1f2937; }
      .timeline-dates { color: #4b5563; font-size: 12px; margin-top: 2px; }
  /* Ações na linha do tempo */
  .timeline-dates .acao-verde { color: #2e7d32; }
  .acao-tag { display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 700; border: 1px solid transparent; }
  .acao-tag.acao-verde { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-color: #a5d6a7; color: #2e7d32; }
    `;
    document.head.appendChild(style);
  }

  // Ícone (Bootstrap Icons - clock-history)
  const SVG_HISTORY = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8.515 1.019A7 7 0 0 0 8 1a7 7 0 1 0 6.48 9.271.5.5 0 1 0-.936-.352A6 6 0 1 1 8 2a.5.5 0 0 0 .515-.981z"/>
      <path d="M7.5 3a.5.5 0 0 1 .5.5v4.21l3.248 1.856a.5.5 0 1 1-.496.868l-3.5-2A.5.5 0 0 1 7 8V3.5a.5.5 0 0 1 .5-.5z"/>
    </svg>`;

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
        // Mantém compatibilidade: "setor" representa o DESTINO do evento (onde o processo permaneceu até o próximo evento)
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
    acao: ev.acao || '',
    nextAcao: prox && prox.acao ? (prox.acao || '') : '',
    ateAgora: !prox,
        _synthetic: ev._synthetic || null
      });
    }

    // Agregado por setor (somar dias de múltiplas passagens)
    const totalsMap = new Map(); // key -> { setor, totalDias, passagens }
    stints.forEach(s => {
      const key = (s.setorId != null) ? `id:${s.setorId}` : `nm:${s.setor}`;
      const cur = totalsMap.get(key) || { setor: s.setor, totalDias: 0, passagens: 0 };
      cur.totalDias += (s.dias||0);
      cur.passagens += 1;
      totalsMap.set(key, cur);
    });

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
    overlay.innerHTML = `
      <div class="historico-modal">
        <div class="historico-header">
          <h5 id="historico-tramitacoes-title" class="modal-title mb-0">Histórico de Tramitações</h5>
          <button class="btn-close-historico" id="historico-tramitacoes-close" aria-label="Fechar">×</button>
        </div>
        <div class="historico-body" id="historico-tramitacoes-body"></div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => { overlay.style.display = 'none'; };
    overlay.querySelector('#historico-tramitacoes-close').addEventListener('click', (e)=>{ e.preventDefault(); close(); });
    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) close(); });
  }

  function openHistoricoModal(numero, dataRaw, meta = {}) {
    ensureModal();
    const overlay = document.getElementById('historico-tramitacoes-overlay');
    const title = document.getElementById('historico-tramitacoes-title');
    const body = document.getElementById('historico-tramitacoes-body');
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

    const { stints, totals } = buildTimeline(dataRaw || {});

    if (!stints.length) {
      const div = document.createElement('div');
      div.className = 'historico-item';
      div.textContent = 'Nenhum trâmite encontrado para este processo.';
      body.appendChild(div);
    } else {
      // Linha do tempo (primeiro)
  const s2 = document.createElement('div');
      s2.className = 'historico-section';
      const h2 = document.createElement('div');
      h2.className = 'historico-title';
      h2.textContent = 'Linha do tempo';
      s2.appendChild(h2);
      // Exibir em ordem decrescente (mais recentes primeiro)
      const stintsDesc = stints.slice().sort((a,b) => {
        const ai = a.inicio ? a.inicio.getTime() : 0;
        const bi = b.inicio ? b.inicio.getTime() : 0;
        if (bi !== ai) return bi - ai;
        const af = a.fim ? a.fim.getTime() : 0;
        const bf = b.fim ? b.fim.getTime() : 0;
        return bf - af;
      });
      stintsDesc.forEach(s => {
        const item = document.createElement('div');
        item.className = 'historico-item';
        const dtIni = s.inicio ? s.inicio.toLocaleDateString('pt-BR') : '';
        const dtFim = s.ateAgora ? '—' : (s.fim ? s.fim.toLocaleDateString('pt-BR') : '');
        const setorTitulo = s.setor || s.destino || '(sem setor)';
        const acaoSaida = (s.nextAcao && typeof s.nextAcao.descricao === 'string')
          ? s.nextAcao.descricao
          : (typeof s.nextAcao === 'string' ? s.nextAcao : '');
    const isParecerEmitido = typeof acaoSaida === 'string' && acaoSaida.trim().toUpperCase() === 'PARECER EMITIDO';
    item.innerHTML = `
          <div class="setor-pill">
            <div>
              <div class="setor-nome">${setorTitulo}</div>
              <div class="timeline-dates">Entrada: ${dtIni}</div>
              <div class="timeline-dates">Saída: ${dtFim}</div>
              ${acaoSaida ? `<div class=\"timeline-dates\">${isParecerEmitido ? `<span class=\"acao-tag acao-verde\"><strong>${acaoSaida}</strong></span>` : `<strong>${acaoSaida}</strong>`}</div>` : ''}
            </div>
            <div>${renderTempoTag(s.dias)}</div>
          </div>`;
        s2.appendChild(item);
      });
      body.appendChild(s2);

      // Sumário por setor (depois)
      const s1 = document.createElement('div');
      s1.className = 'historico-section';
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
    }

    overlay.style.display = 'flex';
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
  });
  // Em alguns cenários, DOMContentLoaded já passou
  if (document.readyState !== 'loading') {
    ensureTagStyles();
    insertButtonsForAllRows();
    observeTableBody();
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
    compute: buildTimeline
  };
})();
