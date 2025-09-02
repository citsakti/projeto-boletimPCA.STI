/**
 * ProcessoModal.js - Gerenciamento do Modal de Processos
 * 
 * Este módulo é responsável por:
 *  - Abrir modal com iframe quando clica no ícone 🔗 de processo
 *  - Copiar número do processo para área de transferência
 *  - Gerenciar abertura e fechamento do modal
 *  - Configurar URL dinâmica para consulta no TCE
 *
 * Dependências:
 *  - Modal HTML com ID 'processo-modal-overlay'
 *  - Iframe com ID 'processo-iframe-legacy' ou 'processo-iframe'
 *  - Elementos com classe 'processo-link-icon' na tabela
 */

class ProcessoModal {
    constructor() {
        this.modalOverlay = null;
        this.modalContent = null;
        this.modalIframe = null;
        this.tableBody = null;
        this.init();
    }

    init() {
        // Aguarda o DOM estar carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupModal());
        } else {
            this.setupModal();
        }
    }

    setupModal() {
        // Busca elementos do modal
        this.modalOverlay = document.getElementById('processo-modal-overlay');
        this.modalContent = this.modalOverlay ? this.modalOverlay.querySelector('.modal-content') : null;
        this.modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
        this.tableBody = document.querySelector('#detalhes table tbody');

        if (!this.modalOverlay || !this.modalIframe) {
            console.error("ProcessoModal: Elementos essenciais do modal não foram encontrados no DOM.");
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listener para botões de fechar - usando delegação de eventos
        document.addEventListener('click', (event) => {
            if (event.target.id === 'close-modal-btn' || 
                event.target.id === 'close-modal-btn-legacy' ||
                event.target.classList.contains('btn-close')) {
                event.preventDefault();
                event.stopPropagation();
                this.closeModal();
            }
        });

        // Event listener para clique no ícone de processo, se a tabela existir
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (event) => {
                if (event.target.classList.contains('processo-link-icon')) {
                    this.handleProcessoClick(event);
                }
            });
        }

        // Fecha modal ao pressionar ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalOverlay.style.display === 'flex') {
                this.closeModal();
            }
        });

        // Fecha modal ao clicar no overlay
        this.modalOverlay.addEventListener('click', (event) => {
            if (event.target === this.modalOverlay) {
                this.closeModal();
            }
        });
    }

    handleProcessoClick(event) {
        const td = event.target.closest('td');
        let processo = td ? td.textContent.replace('🔗', '').trim() : '';
        // Capturar nome do projeto na mesma linha
        const tr = event.target.closest('tr');
        let projectName = '';
        if (tr) {
            try {
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
            } catch(e) { /* ignore */ }
        }
        
        if (processo) {
            // Tenta copiar o número do processo para área de transferência
            navigator.clipboard.writeText(processo)
                .then(() => {
                    this.openModal(processo, projectName);
                    td.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                })
                .catch(err => {
                    console.error('Falha ao copiar para a área de transferência:', err);
                    // Mesmo se falhar ao copiar, abre a modal
                    this.openModal(processo, projectName);
                });
        } else {
            // Se não houver número de processo, abre a página padrão
            this.openModal('', projectName);
        }
    }

    openModal(processo = '', projectName = '') {
        if (!this.modalOverlay || !this.modalIframe || !this.modalContent) {
            console.error("ProcessoModal: Elementos do modal não encontrados.");
            return;
        }

        // Monta a URL dinâmica (ATUALIZADO: novo padrão de acesso ao processo)
        // Novo formato requerido: https://www.tce.ce.gov.br/contexto/#/processo?search=NUMERO_DO_PROCESSO
        // Mantemos a busca do nome do processo como já está (lógica mais abaixo para título etc.)
        const BASE_PROCESSO_URL = 'https://www.tce.ce.gov.br/contexto/#/processo';
        const url = processo
            ? `${BASE_PROCESSO_URL}?search=${encodeURIComponent(processo)}`
            : BASE_PROCESSO_URL; // fallback sem parâmetro de busca quando não há número

        // Configura o iframe e abre o modal
    this.modalIframe.src = url;
        this.modalOverlay.style.display = 'flex';
        
        // Animação de abertura
        this.modalContent.classList.remove('show');
        void this.modalContent.offsetWidth; // Força reflow
        this.modalContent.classList.add('show');
        
        // Previne scroll da página de fundo
        document.body.style.overflow = 'hidden';

        // Ajustar título via helper global se disponível
        if (projectName) {
            // Tentar obter ID PCA da mesma linha onde o ícone foi clicado (armazenado previamente? não temos aqui) – tentamos localizar última linha ativa via seleção
            let idPca = '';
            try {
                const activeSelection = document.activeElement;
                const tr = activeSelection ? activeSelection.closest('tr') : null;
                if (tr) {
                    const table = tr.closest('table');
                    if (table) {
                        const ths = Array.from(table.querySelectorAll('thead th'));
                        const idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
                        if (idxId >= 0 && tr.children[idxId]) {
                            idPca = tr.children[idxId].textContent.trim();
                        }
                    }
                    if (!idPca) {
                        const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset.label||'')));
                        if (idCand) idPca = idCand.textContent.trim();
                    }
                }
            } catch(e) { /* ignore */ }
            const finalTitle = (idPca ? (idPca + ' - ') : '') + projectName;
            if (typeof window.setProcessoModalTitle === 'function') {
                window.setProcessoModalTitle(finalTitle);
            }
        }
    }

    closeModal() {
        if (!this.modalOverlay || !this.modalContent) return;

        // Animação de fechamento
        this.modalContent.classList.remove('show');
        
        // Otimização: esconder o overlay imediatamente para melhor UX
        this.modalOverlay.style.opacity = '0';
        this.modalOverlay.style.pointerEvents = 'none';
        
        setTimeout(() => {
            this.modalOverlay.style.display = 'none';
            // Restaurar propriedades para próxima abertura
            this.modalOverlay.style.opacity = '';
            this.modalOverlay.style.pointerEvents = '';
            
            // Limpar iframe
            if (this.modalIframe) {
                this.modalIframe.src = 'about:blank';
                // Limpar também o iframe Bootstrap se existir
                const bootstrapIframe = document.getElementById('processo-iframe');
                if (bootstrapIframe) {
                    bootstrapIframe.src = 'about:blank';
                }
            }
            
            // Restaurar rolagem da página
            document.body.style.overflow = '';
        }, 400);
    }

    // Método público para reinicializar o modal (útil se a tabela for recarregada)
    reinitialize() {
        this.setupModal();
    }
}

// Inicialização automática
const processoModal = new ProcessoModal();

// Exporta para uso global se necessário
window.ProcessoModal = ProcessoModal;
window.processoModalInstance = processoModal;
