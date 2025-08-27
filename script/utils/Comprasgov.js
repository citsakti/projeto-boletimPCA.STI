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
        // Reaproveita o mesmo modal utilizado pelo ProcessoModal
        this.modalOverlay = document.getElementById('processo-modal-overlay');
        this.modalContent = this.modalOverlay ? this.modalOverlay.querySelector('.modal-content') : null;
        this.modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
        this.tableBody = document.querySelector('#detalhes table tbody');

        if (!this.modalOverlay || !this.modalIframe) {
            console.error('Comprasgov: elementos essenciais do modal não encontrados.');
            return;
        }

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

        // Fecha modal ao pressionar ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalOverlay && this.modalOverlay.style.display === 'flex') {
                this.closeModal();
            }
        });

        // Fecha ao clicar no overlay
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (event) => {
                if (event.target === this.modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Botões de fechar padrão (compatível com estrutura existente)
        document.addEventListener('click', (event) => {
            const isCloseBtn = (
                event.target.id === 'close-modal-btn' ||
                event.target.id === 'close-modal-btn-legacy' ||
                event.target.classList.contains('btn-close')
            );

            if (isCloseBtn) {
                // Aplicar mesma lógica do clique no overlay: não interromper propagação.
                // Apenas evitar navegação caso seja um link.
                const tag = (event.target.tagName || '').toLowerCase();
                if (tag === 'a') {
                    event.preventDefault();
                }
                this.closeModal();
            }
        });
    }

    handleComprasgovClick(event) {
        const icon = event.target;
        // Dados preferencialmente no próprio ícone
        const modalidadeX = (icon.getAttribute('data-x') || '').trim();
        const numeroY = (icon.getAttribute('data-y') || '').trim();

        // Capturar nome do projeto (mesma linha)
        let projectName = '';
        try {
            const tr = icon.closest('tr');
            if (tr) {
                const table = tr.closest('table');
                let idxProjeto = -1;
                if (table) {
                    const ths = Array.from(table.querySelectorAll('thead th'));
                    idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
                    if (idxProjeto >= 0 && tr.children[idxProjeto]) {
                        projectName = tr.children[idxProjeto].textContent.trim();
                    }
                }
                if (!projectName) {
                    const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset.label||'')));
                    if (candidato) projectName = candidato.textContent.trim();
                }
            }
        } catch(e) { /* ignore */ }

        if (!numeroY || numeroY === '-') {
            console.warn('Comprasgov: valor da coluna Y ausente ou inválido (\'-\'), não é possível montar o link.');
            return;
        }

        const yy = this.mapYY(modalidadeX);
    const url = `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/1?compra=925467${yy}${numeroY}`;
    this.openModal(url, projectName);
    }

    mapYY(modalidadeX) {
        const normalized = (modalidadeX || '').toUpperCase();
        if (normalized.includes('PREGÃO') || normalized.includes('PREGAO')) return '05';
        if (normalized.includes('DISPENSA')) return '06';
        // Padrão seguro: DISPENSA (06) quando modalidade não reconhecida
        return '06';
    }

    openModal(url, projectName = '') {
        // Preferir o ModalManager para manter consistência com outros modais
        if (window.modalManager && typeof window.modalManager.openModal === 'function') {
            window.modalManager.openModal('processo-modal', { url, title: projectName });
            if (projectName && typeof window.setProcessoModalTitle === 'function') {
                window.setProcessoModalTitle(projectName);
            }
            return;
        }

        if (!this.modalOverlay || !this.modalIframe || !this.modalContent) {
            console.error('Comprasgov: elementos do modal não encontrados.');
            return;
        }

        // Caso o ModalManager tenha fechado anteriormente, o overlay pode ter recebido 'd-none'
        if (this.modalOverlay.classList.contains('d-none')) {
            this.modalOverlay.classList.remove('d-none');
        }

        // Reset de estilos possivelmente definidos no fechamento
        this.modalOverlay.style.opacity = '';
        this.modalOverlay.style.pointerEvents = '';

        this.modalIframe.src = url;
        this.modalOverlay.style.display = 'flex';

        // Animação semelhante ao ProcessoModal
        this.modalContent.classList.remove('show');
        void this.modalContent.offsetWidth;
        this.modalContent.classList.add('show');
        document.body.style.overflow = 'hidden';

        if (projectName && typeof window.setProcessoModalTitle === 'function') {
            window.setProcessoModalTitle(projectName);
        }
    }

    closeModal() {
        // Preferir o ModalManager para manter consistência com outros modais
        if (window.modalManager && typeof window.modalManager.closeModal === 'function') {
            window.modalManager.closeModal('processo-modal');
            return;
        }

        if (!this.modalOverlay || !this.modalContent) return;
        this.modalContent.classList.remove('show');
        this.modalOverlay.style.opacity = '0';
        this.modalOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
            this.modalOverlay.style.display = 'none';
            this.modalOverlay.style.opacity = '';
            this.modalOverlay.style.pointerEvents = '';
            if (this.modalIframe) {
                this.modalIframe.src = 'about:blank';
            }
            document.body.style.overflow = '';
        }, 400);
    }

    reinitialize() {
        this.setup();
    }
}

// Inicialização automática
const comprasgov = new Comprasgov();
window.Comprasgov = Comprasgov;
window.comprasgovInstance = comprasgov;
