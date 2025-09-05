/**
 * AnalyticsContratos.js - Gerenciador de interfaces para contratos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Criar e gerenciar tooltips para exibir números de contratos
 *  - Implementar funcionalidade de modal para visualização de contratos
 *  - Fornecer interface unificada para integração com o sistema de analytics
 */
document.addEventListener('DOMContentLoaded', function() {
    // Criar elemento de tooltip que será reutilizado
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip';
    document.body.appendChild(tooltip);

    // Referências aos elementos do modal
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
    const closeModalBtn = document.getElementById('close-modal-btn-legacy') || document.getElementById('close-modal-btn');    /**
     * Exibe tooltip com número do contrato
     */
    function showAnalyticsTooltip(event) {
        const numeroContrato = this.getAttribute('data-contrato');
        if (!numeroContrato || numeroContrato.trim() === '') return;
        
        tooltip.textContent = `Contrato ${numeroContrato}`;
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        
        const rect = this.getBoundingClientRect();
        tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10 + window.scrollY) + 'px';
    }
    
    /**
     * Oculta o tooltip de contrato
     */
    function hideAnalyticsTooltip() {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }
    
    /**
     * Abre o modal com iframe do contrato
     */
    function openAnalyticsContractModal() {
        const numeroRegistro = this.getAttribute('data-registro');
        if (!numeroRegistro || numeroRegistro.trim() === '') {
            return;
        }
        
        if (!modalIframe || !modalOverlay || !modalContent) {
            console.error('Elementos do modal não encontrados. Verifique o HTML de DadosAnaliticos.html.');
            const fallbackContractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
            window.open(fallbackContractUrl, '_blank');
            return;
        }

        const contractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
        
        // Sincronizar com o iframe Bootstrap se existir
        const bootstrapIframe = document.getElementById('processo-iframe');
        if (bootstrapIframe) {
            bootstrapIframe.src = contractUrl;
        }
        
        modalIframe.src = contractUrl;
        modalOverlay.style.display = 'flex';
        modalOverlay.classList.remove('d-none');
        
        if (modalContent) {
            modalContent.classList.remove('show');
            void modalContent.offsetWidth; 
            modalContent.classList.add('show');
        }
        
        document.body.style.overflow = 'hidden';
    }

    /**
     * Fecha o modal com animação
     */    
    function closeAnalyticsModal() {
        if (modalOverlay && modalContent && modalIframe) {
            modalContent.classList.remove('show');
            
            modalOverlay.style.opacity = '0';
            modalOverlay.style.pointerEvents = 'none';
            
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                modalOverlay.classList.add('d-none');
                modalOverlay.style.opacity = '';
                modalOverlay.style.pointerEvents = '';
                
                modalIframe.src = 'about:blank';
                const bootstrapIframe = document.getElementById('processo-iframe');
                if (bootstrapIframe) {
                    bootstrapIframe.src = 'about:blank';
                }
            }, 400);
            document.body.style.overflow = '';
        }
    }

    // Event listeners para fechar o modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAnalyticsModal);
    }

    if (modalOverlay) {
        // (Removido) Fechamento ao clicar fora do overlay
        // modalOverlay.addEventListener('click', function(event) {
        //     if (event.target === modalOverlay) {
        //         closeAnalyticsModal();
        //     }
        // });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
            closeAnalyticsModal();
        }
    });

    /**
     * Função global para configurar tooltips e modais nas células de tabela
     */
    window.setupAnalyticsTooltips = function() {
        // Tentar diferentes seletores para encontrar as células
        let projetoCells = document.querySelectorAll('.project-details-table td[data-contrato]');
        
        // Se não encontrou, tentar um seletor mais amplo
        if (projetoCells.length === 0) {
            projetoCells = document.querySelectorAll('td[data-contrato]');
        }
        
        projetoCells.forEach((cell) => {
            // Remover handlers antigos para evitar duplicação
            cell.removeEventListener('mouseenter', showAnalyticsTooltip);
            cell.removeEventListener('mouseleave', hideAnalyticsTooltip);
            cell.removeEventListener('click', openAnalyticsContractModal);
            
            // Adicionar os eventos
            cell.addEventListener('mouseenter', showAnalyticsTooltip);
            cell.addEventListener('mouseleave', hideAnalyticsTooltip);
            cell.addEventListener('click', openAnalyticsContractModal);
            
            cell.style.cursor = 'pointer';
            
            // Adicionar ícone se ainda não existir
            if (!cell.querySelector('.contract-link-icon')) {
                let currentHTML = cell.innerHTML;
                const textNode = Array.from(cell.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    cell.innerHTML = currentHTML + ' <span class="contract-link-icon" title="Abrir contrato">📄</span>';
                } else if (!currentHTML.includes('contract-link-icon')) {
                    cell.innerHTML = currentHTML + ' <span class="contract-link-icon" title="Abrir contrato">📄</span>';
                }
            }
        });
    };

    // Configurar MutationObserver para detectar quando novas tabelas são adicionadas
    const observer = new MutationObserver(function(mutations) {
        let shouldResetup = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && node.classList.contains('project-details-table') ||
                            node.querySelector && node.querySelector('.project-details-table') ||
                            node.querySelector && node.querySelector('td[data-contrato]')) {
                            shouldResetup = true;
                        }
                    }
                });
            }
        });
        
        if (shouldResetup) {
            setTimeout(() => {
                if (typeof window.setupAnalyticsTooltips === 'function') {
                    window.setupAnalyticsTooltips();
                }
            }, 100);
        }
    });

    // Iniciar observação do DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Configuração inicial para o caso de algum conteúdo já estar visível
    if (document.readyState === 'complete') {
        if (typeof window.setupAnalyticsTooltips === 'function') {
            window.setupAnalyticsTooltips();
        }
    }
});