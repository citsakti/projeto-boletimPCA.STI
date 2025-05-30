/**
 * MobileCompactCards.js - Sistema de cards compactos para mobile
 * 
 * Este script é responsável por:
 *  - Converter a tabela tradicional em cards compactos na versão mobile
 *  - Controlar a expansão/retração dos detalhes dos cards
 *  - Manter a funcionalidade de filtros e ordenação
 */

class MobileCompactCards {
    constructor() {
        this.isCompactMode = false;
        this.originalTableData = null;
        this.init();
    }

    init() {
        // Aguarda o carregamento da tabela
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAndActivate();
            this.setupExpandButton();
        });

        document.addEventListener('tabela-carregada', () => {
            setTimeout(() => {
                this.checkAndActivate();
            }, 100);
        });

        // Monitora mudanças de tamanho da tela
        window.addEventListener('resize', this.debounce(() => {
            this.checkAndActivate();
        }, 250));

        // Observer para mudanças na tabela
        this.observeTableChanges();
    }

    setupExpandButton() {
        const expandBtn = document.getElementById('btnExpandCards');
        if (!expandBtn) return;

        expandBtn.addEventListener('click', () => {
            const allExpanded = this.areAllCardsExpanded();
            this.toggleAllCards(!allExpanded);
            this.updateExpandButtonState();
        });
    }

    areAllCardsExpanded() {
        const rows = document.querySelectorAll('#detalhes table tbody tr');
        if (rows.length === 0) return false;
        
        return Array.from(rows).every(row => row.classList.contains('expanded'));
    }

    updateExpandButtonState() {
        const expandBtn = document.getElementById('btnExpandCards');
        if (!expandBtn) return;

        const allExpanded = this.areAllCardsExpanded();
        const textSpan = expandBtn.querySelector('span:not(.emoji-icon)') || expandBtn.firstChild;
        
        if (allExpanded) {
            expandBtn.classList.add('all-expanded');
            if (textSpan) textSpan.textContent = 'Recolher Todos ';
        } else {
            expandBtn.classList.remove('all-expanded');
            if (textSpan) textSpan.textContent = 'Expandir Todos ';
        }
    }

    checkAndActivate() {
        const isMobile = window.matchMedia('(max-width: 991.98px)').matches;
        const table = document.querySelector('#detalhes table');
        
        if (!table) return;

        if (isMobile && !this.isCompactMode) {
            this.activateCompactMode();
        } else if (!isMobile && this.isCompactMode) {
            this.deactivateCompactMode();
        }
    }    activateCompactMode() {
        const table = document.querySelector('#detalhes table');
        if (!table) return;

        console.log('MobileCompactCards: Ativando modo compacto');
        
        this.isCompactMode = true;
        table.classList.add('mobile-compact-cards');
        document.body.classList.add('mobile-compact-mode');

        // Mostrar botão de expandir/recolher
        const expandBtn = document.getElementById('btnExpandCards');
        if (expandBtn) {
            expandBtn.style.display = 'flex';
        }

        this.convertTableToCompactCards();
        this.updateExpandButtonState();
    }    deactivateCompactMode() {
        const table = document.querySelector('#detalhes table');
        if (!table) return;

        console.log('MobileCompactCards: Desativando modo compacto');
        
        this.isCompactMode = false;
        table.classList.remove('mobile-compact-cards');
        document.body.classList.remove('mobile-compact-mode');

        // Esconder botão de expandir/recolher
        const expandBtn = document.getElementById('btnExpandCards');
        if (expandBtn) {
            expandBtn.style.display = 'none';
        }

        this.restoreOriginalTable();
    }    convertTableToCompactCards() {
        const tbody = document.querySelector('#detalhes table tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            // Verifica se já foi convertido
            if (!row.querySelector('.card-header')) {
                this.convertRowToCompactCard(row, index);
            }
        });

        // Atualiza o estado do botão após conversão
        setTimeout(() => {
            this.updateExpandButtonState();
        }, 100);
    }

    convertRowToCompactCard(row, index) {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        // Extrai os dados das células
        const data = this.extractRowData(cells);
        
        // Limpa o conteúdo da linha
        row.innerHTML = '';
        
        // Cria o card compacto
        const cardHTML = this.createCompactCardHTML(data, index);
        row.innerHTML = cardHTML;
        
        // Adiciona event listeners
        this.addCardEventListeners(row, data);
        
        // Aplica classes de status
        this.applyStatusClasses(row, data.status);
    }

    extractRowData(cells) {
        return {
            id: cells[0]?.textContent?.trim() || '',
            area: cells[1]?.textContent?.trim() || '',
            tipo: cells[2]?.textContent?.trim() || '',
            projeto: cells[3]?.textContent?.trim() || '',
            acompanhamento: cells[4]?.textContent?.trim() || '',
            status: cells[5]?.textContent?.trim() || '',
            contratarAte: cells[6]?.textContent?.trim() || '',
            valor: cells[7]?.textContent?.trim() || '',
            orcamento: cells[8]?.textContent?.trim() || '',
            processo: cells[9]?.textContent?.trim() || '',
            // Preserva atributos especiais
            contratoData: cells[3]?.getAttribute('data-contrato') || '',
            registroData: cells[3]?.getAttribute('data-registro') || ''
        };
    }

    createCompactCardHTML(data, index) {
        return `
            <div class="card-header" data-card-id="${index}">
                <div class="card-main-info">
                    <div class="card-id-projeto">
                        <span>#${data.id}</span>
                        <span>•</span>
                        <span>${data.area}</span>
                    </div>
                    <div class="card-projeto-nome">${data.projeto}</div>
                    <div class="card-status">${data.status}</div>
                    <div class="card-valor">${data.valor}</div>
                </div>
                <button class="card-toggle-btn" type="button">
                    <span>Detalhar</span>
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <div class="detail-label">Área:</div>
                    <div class="detail-value">${data.area}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tipo:</div>
                    <div class="detail-value">${data.tipo}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Acompanhamento:</div>
                    <div class="detail-value">${data.acompanhamento}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status do Processo:</div>
                    <div class="detail-value">${data.status}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Contratar Até:</div>
                    <div class="detail-value">${data.contratarAte}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Valor PCA:</div>
                    <div class="detail-value">${data.valor}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Orçamento:</div>
                    <div class="detail-value">${data.orcamento}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Processo:</div>
                    <div class="detail-value">
                        ${data.processo ? `<span class="processo-link" data-processo="${data.processo}">${data.processo} 📄</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    addCardEventListeners(row, data) {
        const header = row.querySelector('.card-header');
        const toggleBtn = row.querySelector('.card-toggle-btn');
        const processoLink = row.querySelector('.processo-link');        if (header && toggleBtn) {
            const toggleCard = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isExpanded = row.classList.contains('expanded');
                const toggleText = toggleBtn.querySelector('span:first-child');
                
                if (isExpanded) {
                    row.classList.remove('expanded');
                    toggleText.textContent = 'Detalhar';
                } else {
                    row.classList.add('expanded');
                    toggleText.textContent = 'Recolher';
                }

                // Atualiza o estado do botão expandir todos
                setTimeout(() => {
                    this.updateExpandButtonState();
                }, 100);
            };

            header.addEventListener('click', toggleCard);
            toggleBtn.addEventListener('click', toggleCard);
        }

        // Event listener para processo (se existir)
        if (processoLink && data.processo) {
            processoLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openProcessModal(data.processo);
            });
        }

        // Preserva funcionalidades de contrato
        if (data.contratoData || data.registroData) {
            const projetoDiv = row.querySelector('.card-projeto-nome');
            if (projetoDiv) {
                if (data.contratoData) {
                    projetoDiv.setAttribute('data-contrato', data.contratoData);
                }
                if (data.registroData) {
                    projetoDiv.setAttribute('data-registro', data.registroData);
                }
                
                // Adiciona indicador visual de contrato
                row.classList.add('has-contract');
            }
        }
    }    applyStatusClasses(row, status) {
        const statusLower = status.toLowerCase().trim();
        
        // Remove todas as classes de status existentes
        const statusClasses = [
            'status-aguardando-dfd', 'status-aguardando-etp', 'status-etp-atrasado',
            'status-dfd-atrasado', 'status-elaborando-tr', 'status-aguardando-definicao',
            'status-analise-viabilidade', 'status-em-contratacao', 'status-em-renovacao',
            'status-renovado', 'status-contratado', 'status-revisao-pca', 'status-a-iniciar',
            'status-contratacao-atrasada', 'status-autuacao-atrasada', 'status-cancelado',
            'status-atrasado', 'priority-high'
        ];
        
        statusClasses.forEach(cls => row.classList.remove(cls));
        
        // Mapeamento específico baseado no texto do status
        if (statusLower.includes('aguardando dfd')) {
            row.classList.add('status-aguardando-dfd');
        } else if (statusLower.includes('aguardando etp')) {
            row.classList.add('status-aguardando-etp');
        } else if (statusLower.includes('etp atrasado')) {
            row.classList.add('status-etp-atrasado');
        } else if (statusLower.includes('dfd atrasado')) {
            row.classList.add('status-dfd-atrasado');
        } else if (statusLower.includes('elaborando tr')) {
            row.classList.add('status-elaborando-tr');
        } else if (statusLower.includes('aguardando definição')) {
            row.classList.add('status-aguardando-definicao');
        } else if (statusLower.includes('análise de viabilidade') || statusLower.includes('analise de viabilidade')) {
            row.classList.add('status-analise-viabilidade');
        } else if (statusLower.includes('em contratação') || statusLower.includes('em contratacao')) {
            row.classList.add('status-em-contratacao');
        } else if (statusLower.includes('em renovação') || statusLower.includes('em renovacao')) {
            row.classList.add('status-em-renovacao');
        } else if (statusLower.includes('renovado')) {
            row.classList.add('status-renovado');
        } else if (statusLower.includes('contratado')) {
            row.classList.add('status-contratado');
        } else if (statusLower.includes('revisão pca') || statusLower.includes('revisao pca')) {
            row.classList.add('status-revisao-pca');
        } else if (statusLower.includes('a iniciar')) {
            row.classList.add('status-a-iniciar');
        } else if (statusLower.includes('contratação atrasada') || statusLower.includes('contratacao atrasada')) {
            row.classList.add('status-contratacao-atrasada');
        } else if (statusLower.includes('autuação atrasada') || statusLower.includes('autuacao atrasada')) {
            row.classList.add('status-autuacao-atrasada');
        } else if (statusLower.includes('cancelado')) {
            row.classList.add('status-cancelado');
        } else if (statusLower.includes('atrasado')) {
            row.classList.add('status-atrasado');
        }

        // Adiciona classe de prioridade se necessário
        if (statusLower.includes('urgente') || statusLower.includes('crítico') || 
            statusLower.includes('atrasado') || statusLower.includes('atrasada')) {
            row.classList.add('priority-high');
        }
    }

    openProcessModal(processo) {
        const modalOverlay = document.getElementById('processo-modal-overlay');
        const modalIframe = document.getElementById('processo-iframe');
        
        if (modalOverlay && modalIframe) {
            const numeroProcesso = processo.replace(/[^0-9]/g, '');
            modalIframe.src = `https://sei.example.com/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=${numeroProcesso}`;
            modalOverlay.style.display = 'flex';
        }
    }

    restoreOriginalTable() {
        const tbody = document.querySelector('#detalhes table tbody');
        if (!tbody) return;

        // Remove classes e restaura funcionalidade original
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('expanded', 'status-contratado', 'status-cancelado', 'status-atrasado', 'priority-high', 'has-contract');
        });

        // Força re-renderização da tabela
        if (window.fetchAndPopulate) {
            setTimeout(() => {
                window.fetchAndPopulate();
            }, 100);
        }
    }

    observeTableChanges() {
        const targetNode = document.querySelector('#detalhes');
        if (!targetNode) return;

        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target.tagName === 'TBODY') {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate && this.isCompactMode) {
                setTimeout(() => {
                    this.convertTableToCompactCards();
                }, 100);
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    // Utility function para debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Método público para forçar atualização
    forceUpdate() {
        if (this.isCompactMode) {
            this.convertTableToCompactCards();
        }
    }    // Método para expandir/recolher todos os cards
    toggleAllCards(expand = null) {
        if (!this.isCompactMode) return;

        const rows = document.querySelectorAll('#detalhes table tbody tr');
        
        rows.forEach(row => {
            const isExpanded = row.classList.contains('expanded');
            const toggleBtn = row.querySelector('.card-toggle-btn');
            const toggleText = toggleBtn?.querySelector('span:first-child');
            
            if (expand === null) {
                // Toggle current state
                if (isExpanded) {
                    row.classList.remove('expanded');
                    if (toggleText) toggleText.textContent = 'Detalhar';
                } else {
                    row.classList.add('expanded');
                    if (toggleText) toggleText.textContent = 'Recolher';
                }
            } else if (expand && !isExpanded) {
                row.classList.add('expanded');
                if (toggleText) toggleText.textContent = 'Recolher';
            } else if (!expand && isExpanded) {
                row.classList.remove('expanded');
                if (toggleText) toggleText.textContent = 'Detalhar';
            }
        });

        // Atualiza o estado do botão
        setTimeout(() => {
            this.updateExpandButtonState();
        }, 100);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.mobileCompactCards = new MobileCompactCards();
});

// Funções globais para debug e controle
window.toggleAllCompactCards = (expand) => {
    if (window.mobileCompactCards) {
        window.mobileCompactCards.toggleAllCards(expand);
    }
};

window.forceUpdateCompactCards = () => {
    if (window.mobileCompactCards) {
        window.mobileCompactCards.forceUpdate();
    }
};
