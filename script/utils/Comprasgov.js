/**
 * Comprasgov.js - Gerenciamento do Modal para link do Comprasnet
 *
 * Objetivo:
 *  - Exibir ícone 🛍️ ao lado do ícone 🔗 (quando houver valor na coluna Y do CSV)
 *  - Abrir o modal padrão (mesmo utilizado por ProcessoModal.js) carregando a URL do Comprasnet
 *  - A URL é montada com base nas colunas X (modalidade) e Y (número/identificador) do CSV
 *      Base: https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/-1?compra=925467yyxxxxxxxxx
 *      Regra de yy: "05" para PREGÃO; "06" para DISPENSA
 */

class Comprasgov {
    constructor() {
    // Modal legacy removido em favor do ModalManager central
    this.modalOverlay = null;
    this.modalContent = null;
    this.modalIframe = null;
        this.tableBody = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
    // Modal legacy não é mais necessário; ModalManager cuidará da abertura
    this.modalOverlay = document.getElementById('processo-modal-overlay');
    this.modalContent = this.modalOverlay ? this.modalOverlay.querySelector('.modal-content') : null;
    this.modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
        this.tableBody = document.querySelector('#detalhes table tbody');

    // Se ModalManager existir, não precisamos validar overlay/iframe agora

        this.setupListeners();
    }

    setupListeners() {
        // Clique no ícone 🛍️ via delegação no tbody principal
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (event) => {
                if (event.target.classList.contains('comprasgov-link-icon')) {
                    this.handleComprasgovClick(event);
                }
            });
        }
        // Captura global para ícones inseridos dinamicamente nas tabelas analíticas
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.classList && target.classList.contains('comprasgov-link-icon')) {
                this.handleComprasgovClick(event);
            }
        });

    // Eventos de fechamento delegados ao ModalManager (não replicar aqui)
    }

    handleComprasgovClick(event) {
        const icon = event.target;
        // Dados preferencialmente no próprio ícone
        const modalidadeX = (icon.getAttribute('data-x') || '').trim();
        const numeroY = (icon.getAttribute('data-y') || '').trim();

        // Capturar nome do projeto (mesma linha)
        const tr = icon.closest('tr');
        let projectName = '';
        let idPca = '';
        let processNumber = this.extractProcessNumberFromRow(tr);
        try {
            if (tr) {
                const table = tr.closest('table');
                let idxProjeto = -1;
                let idxId = -1;
                if (table) {
                    const ths = Array.from(table.querySelectorAll('thead th'));
                    idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
                    idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
                    if (idxProjeto >= 0 && tr.children[idxProjeto]) {
                        projectName = window.extractCellTextWithSeparator ? 
                            window.extractCellTextWithSeparator(tr.children[idxProjeto]) : 
                            tr.children[idxProjeto].textContent.trim();
                        // Remove emojis (🔗, 🛍️) do nome do projeto
                        projectName = projectName.replace(/[🔗🛍️]/g, '').trim();
                    }
                    if (idxId >= 0 && tr.children[idxId]) {
                        idPca = window.extractCellTextWithSeparator ? 
                            window.extractCellTextWithSeparator(tr.children[idxId]) : 
                            tr.children[idxId].textContent.trim();
                        // Remove emojis (🔗, 🛍️) do ID PCA
                        idPca = idPca.replace(/[🔗🛍️]/g, '').trim();
                    }
                }
                if (!projectName) {
                    const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset.label||'')));
                    if (candidato) {
                        projectName = window.extractCellTextWithSeparator ? 
                            window.extractCellTextWithSeparator(candidato) : 
                            candidato.textContent.trim();
                        // Remove emojis (🔗, 🛍️) do nome do projeto
                        projectName = projectName.replace(/[🔗🛍️]/g, '').trim();
                    }
                }
                if (!idPca) {
                    const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset.label||'')));
                    if (idCand) {
                        idPca = window.extractCellTextWithSeparator ? 
                            window.extractCellTextWithSeparator(idCand) : 
                            idCand.textContent.trim();
                        // Remove emojis (🔗, 🛍️) do ID PCA
                        idPca = idPca.replace(/[🔗🛍️]/g, '').trim();
                    }
                }
            }
        } catch(e) { /* ignore */ }

        if (!numeroY || numeroY === '-') {
            console.warn('Comprasgov: valor da coluna Y ausente ou inválido (\'-\'), não é possível montar o link.');
            return;
        }

        const yy = this.mapYY(modalidadeX);
        const formattedProcess = this.formatProcessNumber(numeroY);
        const displayProcess = processNumber || formattedProcess;
        const baseTitleRaw = (idPca ? `${idPca} - ` : '') + projectName;
        const baseTitle = baseTitleRaw.trim();
        let finalTitle = baseTitle;

        if (displayProcess) {
            if (baseTitle) {
                const normalizedBase = baseTitle.replace(/\s+$/, '');
                const endsWithPipe = /\|$/.test(normalizedBase);
                finalTitle = endsWithPipe ? `${normalizedBase} ${displayProcess}` : `${normalizedBase} | ${displayProcess}`;
            } else {
                finalTitle = displayProcess;
            }
        }

        const url = `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/1?compra=925467${yy}${numeroY}`;
        this.openModal(url, finalTitle);
    }

    mapYY(modalidadeX) {
        const normalized = (modalidadeX || '').toUpperCase();
        if (normalized.includes('PREGÃO') || normalized.includes('PREGAO')) return '05';
        if (normalized.includes('DISPENSA')) return '06';
        // Padrão seguro: DISPENSA (06) quando modalidade não reconhecida
        return '06';
    }

    formatProcessNumber(numeroY) {
        const raw = (numeroY || '').trim();
        if (!raw || raw === '-') {
            return '';
        }

        if (/[\/-]/.test(raw)) {
            return raw;
        }

        const digits = raw.replace(/\D/g, '');
        if (digits.length < 9) {
            return raw;
        }

        const prefix = digits.slice(0, 5);
        const middle = digits.slice(5, 9);
        const suffix = digits.slice(9);
        let formatted = `${prefix}/${middle}`;
        if (suffix) {
            formatted += `-${suffix}`;
        }
        return formatted;
    }

    extractProcessNumberFromRow(tr) {
        if (!tr) return '';
        let numero = tr.getAttribute('data-processo-numero') || '';
        if (!numero) {
            const tdProc = tr.querySelector('td[data-label="Processo"]');
            if (tdProc) {
                numero = tdProc.dataset.processoNumero || (window.extractCellTextWithSeparator ? window.extractCellTextWithSeparator(tdProc) : tdProc.textContent) || '';
            }
        }

        if (!numero && typeof window.debugProcessoTag === 'object' && window.debugProcessoTag !== null) {
            try {
                const tdFallback = tr.querySelector('[data-label="Tipo"] .processo-tag');
                if (tdFallback) {
                    numero = tdFallback.getAttribute('data-proc') || tdFallback.textContent || '';
                }
            } catch(_e) { /* ignore */ }
        }

        if (!numero) return '';
        return String(numero).replace(/[🔗🛍️]/g, '').trim();
    }

    openModal(url, projectTitle = '') {
        if (window.modalManager && typeof window.modalManager.openModal === 'function') {
            window.modalManager.openModal('processo-modal', { url, title: projectTitle });
            if (projectTitle && typeof window.setProcessoModalTitle === 'function') window.setProcessoModalTitle(projectTitle);
        } else {
            // Fallback mínimo
            window.open(url, '_blank');
        }
    }

    closeModal() {
        if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
            window.modalManager.closeModal('processo-modal');
        }
    }

    reinitialize() {
        this.setup();
    }
}

// Inicialização automática
const comprasgov = new Comprasgov();
window.Comprasgov = Comprasgov;
window.comprasgovInstance = comprasgov;
