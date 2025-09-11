/**
 * InformacoesDeContratos.js
 * Insere a tag de contrato DENTRO de .projeto-especie-container (criada por EspecieProcessoTag.js)
 * e garante que nenhuma .contrato-tag permaneça solta na célula.
 *
 * Estratégia:
 *  - Percorre linhas, identifica célula "Projeto de Aquisição".
 *  - Observa mutações na célula (recriação do wrapper/container).
 *  - Ao existir .projeto-especie-container: cria ou migra a .contrato-tag para dentro dele.
 *  - Evita duplicação usando data-registro.
 *  - Clique / Enter apenas na própria .contrato-tag abre o modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay  = document.getElementById('processo-modal-overlay');
    const modalContent  = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const modalIframe   = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');

    ensureStyles();

    const observers = new WeakMap();

    ['tabela-carregada','acompanhamento-atualizado','acompanhamento-loading','acompanhamento-atualizado-parcial']
        .forEach(ev => document.addEventListener(ev, () => schedule(140)));

    schedule(100);

    function schedule(delay=80){
        clearTimeout(schedule._id);
        schedule._id = setTimeout(processRows, delay);
    }

    function processRows(){
        const trs = document.querySelectorAll('table tbody tr');
        trs.forEach(tr => {
            try {
                const cell = getProjetoCell(tr);
                if (!cell) return;
                const numeroContrato = (cell.getAttribute('data-contrato')||'').trim();
                const numeroRegistro = (cell.getAttribute('data-registro')||'').trim();
                if (!numeroContrato || !numeroRegistro) return;
                ensureObserver(cell);
                insertOrMigrate(cell, numeroContrato, numeroRegistro);
            } catch(_){/*noop*/}
        });
    }

    function getProjetoCell(tr){
        return tr?.querySelector('td[data-label="Projeto de Aquisição"]')
                || tr?.children[3]
                || tr?.querySelector('td[data-label*="Projeto"]')
                || null;
    }

    function ensureObserver(cell){
        if (observers.has(cell)) return;
        const obs = new MutationObserver(() => {
            const numeroContrato = (cell.getAttribute('data-contrato')||'').trim();
            const numeroRegistro = (cell.getAttribute('data-registro')||'').trim();
            if (!numeroContrato || !numeroRegistro) return;
            insertOrMigrate(cell, numeroContrato, numeroRegistro);
        });
        obs.observe(cell, { childList:true, subtree:true });
        observers.set(cell, obs);
    }

    function findContainer(cell){
        return cell.querySelector('.projeto-tags-wrapper .projeto-especie-container')
                || cell.querySelector('.projeto-especie-container')
                || null;
    }

    function insertOrMigrate(cell, numeroContrato, numeroRegistro){
        const container = findContainer(cell);
        if (!container) return false; // Aguarda criação

        // Migrar qualquer contrato-tag solta para dentro (primeiro encontrado)
        const looseTags = [...cell.querySelectorAll(':scope > .contrato-tag')];
        looseTags.forEach(tag => {
            // Se já existe igual no container, remove a solta; senão move
            const reg = tag.getAttribute('data-registro');
            if (reg && container.querySelector(`.contrato-tag[data-registro="${reg}"]`)) {
                tag.remove();
            } else {
                container.appendChild(tag);
            }
        });

        // Se já existe a correta, fim
        if (container.querySelector(`.contrato-tag[data-registro="${numeroRegistro}"]`)) return true;

        const span = document.createElement('span');
        span.className = 'contrato-tag';
        span.textContent = numeroContrato;
        span.setAttribute('data-contrato', numeroContrato);
        span.setAttribute('data-registro', numeroRegistro);
        span.title = `Abrir contrato ${numeroContrato}`;
        span.tabIndex = 0;
        container.appendChild(span);
        return true;
    }

    function openContractModal(numeroRegistro, projectName, numeroContrato){
        if (!numeroRegistro) return;
        const contractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
        const finalTitle = (numeroContrato ? numeroContrato + ' - ' : '') + (projectName || '');

        if (window.modalManager && typeof window.modalManager.openModal === 'function') {
            window.modalManager.openModal('processo-modal', { url: contractUrl, title: finalTitle });
            if (finalTitle && typeof window.setProcessoModalTitle === 'function') {
                window.setProcessoModalTitle(finalTitle);
            }
            return;
        }

        if (modalIframe && modalOverlay && modalContent) {
            const bootstrapIframe = document.getElementById('processo-iframe');
            if (bootstrapIframe) bootstrapIframe.src = contractUrl;
            if (modalIframe.tagName === 'IFRAME') modalIframe.src = contractUrl;
            modalOverlay.style.display = 'flex';
            modalContent.classList.remove('show');
            void modalContent.offsetWidth;
            modalContent.classList.add('show');
            document.body.style.overflow = 'hidden';
            if (finalTitle) {
                if (typeof window.setProcessoModalTitle === 'function') {
                    window.setProcessoModalTitle(finalTitle);
                } else {
                    const legacyTitle = document.querySelector('#processo-modal-overlay .modal-header h5');
                    if (legacyTitle) legacyTitle.textContent = finalTitle;
                    const bsTitle = document.querySelector('#processo-modal .modal-title');
                    if (bsTitle) bsTitle.textContent = finalTitle;
                }
            }
            return;
        }

        window.open(contractUrl, '_blank','noopener');
    }

    function getProjectName(tag){
        const tr = tag.closest('tr');
        if (!tr) return '';
        const cell = getProjetoCell(tr);
        if (!cell) return '';
        return (cell.cloneNode(true).textContent || '')
            .replace(/📄/g,'')
            .replace(/\s+/g,' ')
            .trim();
    }

    // Apenas a própria tag abre modal
    document.addEventListener('click', e => {
        const tag = e.target.closest('.contrato-tag');
        if (!tag) return;
        e.stopPropagation();
        const numeroRegistro = tag.getAttribute('data-registro');
        const numeroContrato = tag.getAttribute('data-contrato');
        const projectName = getProjectName(tag);
        openContractModal(numeroRegistro, projectName, numeroContrato);
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const tag = e.target.closest('.contrato-tag');
        if (!tag) return;
        e.preventDefault();
        e.stopPropagation();
        const numeroRegistro = tag.getAttribute('data-registro');
        const numeroContrato = tag.getAttribute('data-contrato');
        const projectName = getProjectName(tag);
        openContractModal(numeroRegistro, projectName, numeroContrato);
    });

    function ensureStyles(){
        if (document.getElementById('contrato-tag-styles')) return;
        const style = document.createElement('style');
        style.id = 'contrato-tag-styles';
        style.textContent = `
            .projeto-especie-container .contrato-tag { margin-left:4px; }
            .contrato-tag { display:inline-block; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.3px; line-height:1.2; cursor:pointer; transition:all .18s ease; white-space:nowrap; max-width:180px; overflow:hidden; text-overflow:ellipsis; background:linear-gradient(135deg,#f5f5f5 0%, #e0e0e0 100%); color:#424242; border:1px solid #bdbdbd; }
            .contrato-tag:hover, .contrato-tag:focus { transform:translateY(-1px); box-shadow:0 2px 4px rgba(0,0,0,0.14); background:linear-gradient(135deg,#e0e0e0 0%, #bdbdbd 100%); outline:none; }
            @media (max-width:1024px){ .contrato-tag { max-width:150px; } }
            @media (max-width:768px){ .contrato-tag { font-size:10px; padding:2px 6px; letter-spacing:0.2px; max-width:130px; } }
            @media (max-width:480px){ .contrato-tag { font-size:9px; padding:1px 4px; max-width:110px; } }
        `;
        document.head.appendChild(style);
    }

    // Debug helpers
    window.debugContratoTag = { reprocess: processRows, schedule, force: processRows };
});