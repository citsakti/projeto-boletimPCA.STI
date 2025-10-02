/**
 * ProcessoTag.js
 * 
 * Objetivo: Remover a coluna "Processo" da tabela principal e exibir o número
 * do processo como uma tag cinza dentro da coluna "Tipo" (abaixo do conteúdo),
 * mantendo a funcionalidade de abrir o modal ao clicar (substitui o antigo 🔗).
 * 
 * Requisitos:
 *  - NÃO quebrar AcompanhamentoProcessos.js (que lê a coluna Processo):
 *    -> Main.js adiciona uma célula oculta com data-label="Processo" e data-processo-numero
 *  - NÃO mexer na posição do ícone 🛍️ (Comprasgov) já implementado em Projeto.
 *  - ProcessoModal.js continua existindo para DadosAnaliticos.html; aqui só acionamos a abertura via tag.
 *  - Tag com estilo cinza, análoga às tags de EspecieProcessoTag.js, renderizada dentro de uma div logo abaixo do texto da célula "Tipo".
 */

(function(){
  const TAG_CLASS = 'processo-tag';
  const WRAPPER_CLASS = 'processo-tag-wrapper';

  function sanitizeProjectMeta(rawValue){
    if (!rawValue) return '';
    const cleaned = String(rawValue)
      .replace(/[🔗🛍️]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const segments = cleaned.split('|').map(part => part.trim()).filter(Boolean);
    return segments.length ? segments.join(' | ') : cleaned;
  }

  function normalizarNumero(raw){
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  // Localiza a célula "Tipo" do TR
  function obterCelulaTipo(tr){
    if (!tr) return null;
    // Buscar por data-label primeiro (mais confiável)
    let cel = tr.querySelector('td[data-label="Tipo"]');
    if (cel) return cel;
    
    // Fallback: buscar pela posição (index 2 na tabela principal, pode variar em analíticas)
    // Nas tabelas analíticas de Pareceres Jurídicos, a coluna Tipo também é index 2
    const children = Array.from(tr.children);
    const tipoIndex = children.findIndex(td => {
      const text = (td.textContent || '').trim();
      return text.includes('🛒 Aquisição') || text.includes('🔄 Renovação') || text.includes('Aquisição') || text.includes('Renovação');
    });
    
    return tipoIndex >= 0 ? children[tipoIndex] : (tr.children[2] || null);
  }

  // Localiza a célula (oculta) "Processo" do TR
  function obterCelulaProcesso(tr){
    if (!tr) return null;
    // Buscar por data-label primeiro
    let cel = tr.querySelector('td[data-label="Processo"]');
    if (cel) return cel;
    
    // Fallback: buscar pela posição (index 9 na tabela principal, pode variar)
    return tr.children[9] || null;
  }

  function extrairNumeroProcesso(tr){
    if (!tr) return '';
    // Preferir atributo no TR
    let numero = tr.getAttribute('data-processo-numero') || '';
    if (!numero){
      const tdProc = obterCelulaProcesso(tr);
      if (tdProc){
        numero = tdProc.dataset.processoNumero || tdProc.textContent || '';
      }
    }
    numero = numero.replace('🔗','').trim();
    return normalizarNumero(numero);
  }

  function renderTag(numero){
    if (!numero) return '';
    const safe = numero;
    const title = `Abrir processo ${safe}`;
    return `<div class="${WRAPPER_CLASS}" aria-label="Processo">
      <span class="${TAG_CLASS}" data-proc="${safe}" title="${title}" role="button" tabindex="0">${safe}</span>
    </div>`;
  }

  function aplicarEstilos(){
    if (document.getElementById('processo-tag-styles')) return;
    const style = document.createElement('style');
    style.id = 'processo-tag-styles';
    style.textContent = `
      /* Wrapper alinhado ao centro */
  .${WRAPPER_CLASS}{
    margin-top: 6px;
    display: flex;              /* Igual ao container de espécie */
    align-items: center;        /* Centraliza verticalmente */
    gap: 6px;                   /* Mesmo espaçamento do especie */
    justify-content: center;    /* Centraliza horizontalmente dentro da célula */
    flex-wrap: wrap;            /* Permite quebra se necessário em telas pequenas */
    text-align: center;         /* Mantém alinhamento textual */
  }
  /* Garantir centralização também do conteúdo interno existente da célula Tipo */
  td[data-label="Tipo"] { text-align: center; }

      /* Estilo idêntico à especie-processo-tag (base cinza) */
      .${TAG_CLASS}{
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700; /* negrito conforme solicitado */
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.2;
  cursor: pointer; /* alterado de help para pointer (mãozinha) */
        transition: all 0.2s ease;
        white-space: nowrap;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        color: #424242;
        border: 1px solid #bdbdbd;
      }

      /* Hover igual à especie-processo-tag */
      .${TAG_CLASS}:hover{
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
      }

      /* Responsividade equivalente */
      @media (max-width: 768px) {
        .${WRAPPER_CLASS}{
          margin-top: 4px; /* segue redução similar */
          gap: 4px;
        }
        .${TAG_CLASS} {
          font-size: 10px;
          padding: 2px 6px;
          letter-spacing: 0.2px;
        }
      }

      @media (max-width: 480px) {
        .${WRAPPER_CLASS}{
          gap: 3px;
        }
        .${TAG_CLASS} {
          font-size: 9px;
          padding: 1px 4px;
          max-width: 120px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function inserirTagNoTipo(tr){
    try{
      const celTipo = obterCelulaTipo(tr);
      if (!celTipo) return;

      // Evitar duplicação
      if (celTipo.querySelector('.'+WRAPPER_CLASS)) return;

      const numero = extrairNumeroProcesso(tr);
      if (!numero) return;

      const tagHtml = renderTag(numero);
      const div = document.createElement('div');
      div.innerHTML = tagHtml;
      celTipo.appendChild(div.firstElementChild);
    }catch(e){ /* noop */ }
  }

  function handleClick(event){
    let el = event.target.closest('.'+TAG_CLASS);
    // Se clicar no wrapper, procurar a tag interna
    if (!el){
      const wrapper = event.target.closest('.'+WRAPPER_CLASS);
      if (wrapper) el = wrapper.querySelector('.'+TAG_CLASS) || null;
    }
    if (!el) return;
    const numero = el.getAttribute('data-proc');
    if (!numero) return;

    // Reutiliza ProcessoModal.js abrindo o overlay legado
    // Estratégia: simular clique do antigo ícone, aproveitando a leitura do TD pela classe

    try{
      // Se existir API pública do modal, usar
      if (window.processoModalInstance && typeof window.processoModalInstance.openModal === 'function'){
        // Fecha o modal de processo se estiver aberto, para garantir limpeza total
        if (typeof window.processoModalInstance.closeModal === 'function') {
          window.processoModalInstance.closeModal();
        }
        setTimeout(function() {
          // Limpeza profunda do iframe: remove do DOM e insere novamente
          var iframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
          if (iframe) {
            var parent = iframe.parentNode;
            var isLegacy = iframe.id === 'processo-iframe-legacy';
            parent.removeChild(iframe);
            // Cria novo iframe limpo
            var newIframe = document.createElement('iframe');
            newIframe.id = iframe.id;
            newIframe.className = iframe.className;
            newIframe.name = iframe.name;
            newIframe.style.cssText = iframe.style.cssText;
            newIframe.setAttribute('frameborder', '0');
            newIframe.setAttribute('allowfullscreen', '');
            newIframe.src = 'about:blank';
            parent.appendChild(newIframe);
          }
          // openModal espera (processo, projectName)
          const tr = el.closest('tr');
          let projectName = '';
          if (tr){
            const celProjeto = tr.querySelector('td[data-label="Projeto de Aquisição"]') || tr.children[3];
            if (celProjeto) {
              projectName = window.extractCellTextWithSeparator ? 
                window.extractCellTextWithSeparator(celProjeto) : 
                (celProjeto.textContent||'').trim();
              projectName = sanitizeProjectMeta(projectName);
            }
          }
          window.processoModalInstance.openModal(numero, projectName);
        }, 500); // tempo maior que o timeout de fechamento do modal
        return;
      }
    }catch(_){ }

    // Fallback: abrir em nova aba
    const BASE = 'https://www.tce.ce.gov.br/contexto/#/processo';
    const url = `${BASE}?search=${encodeURIComponent(numero)}`;
    window.open(url, '_blank', 'noopener');
  }

  function processarTabela(){
    // Processar tabela principal (#detalhes)
    const tbody = document.querySelector('#detalhes table tbody');
    if (tbody) {
      const trs = Array.from(tbody.querySelectorAll('tr'));
      trs.forEach(inserirTagNoTipo);
    }
    
    // Processar também tabelas analíticas (ex: seção 3.3 Pareceres Jurídicos)
    const tabelasAnaliticas = document.querySelectorAll('.project-details-table tbody');
    tabelasAnaliticas.forEach(tbody => {
      const trs = Array.from(tbody.querySelectorAll('tr'));
      trs.forEach(inserirTagNoTipo);
    });
  }

  function scheduleUpdate(delay=200){
    clearTimeout(scheduleUpdate._id);
    scheduleUpdate._id = setTimeout(processarTabela, delay);
  }

  // Eventos
  document.addEventListener('DOMContentLoaded', ()=>{
    aplicarEstilos();
    scheduleUpdate(0);
  });
  document.addEventListener('tabela-carregada', ()=>scheduleUpdate(50));
  document.addEventListener('acompanhamento-atualizado', ()=>scheduleUpdate(50));
  document.addEventListener('acompanhamento-loading', ()=>scheduleUpdate(0));
  document.addEventListener('pareceres-tabela-expandida', ()=>scheduleUpdate(100));

  // Delegação de clique para abrir modal
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') handleClick(e);
  });

  // Expor para debug
  window.debugProcessoTag = { processarTabela, inserirTagNoTipo };
})();
