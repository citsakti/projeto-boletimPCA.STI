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

        if (!this.modalOverlay || !this.modalIframe || !this.tableBody) {
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

        // Event listener para clique no ícone de processo
        this.tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('processo-link-icon')) {
                this.handleProcessoClick(event);
            }
        });

        // Fecha modal ao clicar fora dela
        this.modalOverlay.addEventListener('click', (event) => {
            if (event.target === this.modalOverlay) {
                this.closeModal();
            }
        });

        // Fecha modal ao pressionar ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalOverlay.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    handleProcessoClick(event) {
        const td = event.target.closest('td');
        let processo = td ? td.textContent.replace('🔗', '').trim() : '';
        
        if (processo) {
            // Tenta copiar o número do processo para área de transferência
            navigator.clipboard.writeText(processo)
                .then(() => {
                    this.openModal(processo);
                    td.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                })
                .catch(err => {
                    console.error('Falha ao copiar para a área de transferência:', err);
                    // Mesmo se falhar ao copiar, abre a modal
                    this.openModal(processo);
                });
        } else {
            // Se não houver número de processo, abre a página padrão
            this.openModal('');
        }
    }

    openModal(processo = '') {
        if (!this.modalOverlay || !this.modalIframe || !this.modalContent) {
            console.error("ProcessoModal: Elementos do modal não encontrados.");
            return;
        }

        // Monta a URL dinâmica
        const url = processo 
            ? `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`
            : 'https://www.tce.ce.gov.br/contexto-consulta-geral?tipo=processos';

        // Configura o iframe e abre o modal
        this.modalIframe.src = url;
        this.modalOverlay.style.display = 'flex';
        
        // Animação de abertura
        this.modalContent.classList.remove('show');
        void this.modalContent.offsetWidth; // Força reflow
        this.modalContent.classList.add('show');
        
        // Previne scroll da página de fundo
        document.body.style.overflow = 'hidden';
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
