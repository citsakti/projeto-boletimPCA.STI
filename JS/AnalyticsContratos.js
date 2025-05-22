/**
 * AnalyticsContratos.js
 * 
 * Adiciona tooltips e modais para informações de contrato nas tabelas de analytics.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Criar elemento de tooltip que será reutilizado
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip'; // Reutilize a classe CSS existente
    document.body.appendChild(tooltip);
    
    // Referências aos elementos do modal (assumindo que existem em DadosAnaliticos.html)
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const modalIframe = document.getElementById('processo-iframe');
    const closeModalBtn = document.getElementById('close-modal-btn');

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
    
    function hideAnalyticsTooltip() {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }
    
    function openAnalyticsContractModal() {
        const numeroRegistro = this.getAttribute('data-registro');
        if (!numeroRegistro || numeroRegistro.trim() === '') return;
        
        if (!modalIframe || !modalOverlay || !modalContent) {
            console.error('Elementos do modal não encontrados. Verifique o HTML de DadosAnaliticos.html.');
            // Fallback para abrir em nova aba se o modal não estiver configurado
            const fallbackContractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
            window.open(fallbackContractUrl, '_blank');
            return;
        }
        
        const contractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
        
        modalIframe.src = contractUrl;
        modalOverlay.style.display = 'flex';
        
        modalContent.classList.remove('show');
        void modalContent.offsetWidth; 
        modalContent.classList.add('show');
        
        document.body.style.overflow = 'hidden';
    }

    function closeAnalyticsModal() {
        if (modalOverlay && modalContent && modalIframe) {
            modalContent.classList.remove('show');
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                modalIframe.src = 'about:blank'; // Limpa o iframe
            }, 400); // Tempo da transição CSS (ajuste se necessário)
            document.body.style.overflow = ''; // Restaura a rolagem da página
        }
    }

    // Event listeners para fechar o modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAnalyticsModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(event) {
            // Fecha o modal se o clique for no overlay (fora do conteúdo)
            if (event.target === modalOverlay) {
                closeAnalyticsModal();
            }
        });
    }

    document.addEventListener('keydown', function(event) {
        // Fecha o modal ao pressionar a tecla ESC
        if (event.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
            closeAnalyticsModal();
        }
    });

    // Função global para configurar/reconfigurar tooltips e modais nas tabelas de analytics
    window.setupAnalyticsTooltips = function() {
        const projetoCells = document.querySelectorAll('.project-details-table td[data-contrato]');
        
        projetoCells.forEach(cell => {
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
                // Preservar conteúdo existente e adicionar o ícone
                let currentHTML = cell.innerHTML;
                // Evitar adicionar o ícone dentro de outros elementos HTML que possam estar no texto do projeto
                const textNode = Array.from(cell.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                     // Adiciona o ícone após o texto principal. Se houver HTML complexo, isso pode precisar de ajuste.
                    cell.innerHTML = currentHTML + ' <span class="contract-link-icon" title="Abrir contrato">📄</span>';
                } else if (!currentHTML.includes('contract-link-icon')) { // Fallback se não houver nó de texto direto
                    cell.innerHTML = currentHTML + ' <span class="contract-link-icon" title="Abrir contrato">📄</span>';
                }
            }
        });
    };

    // Configuração inicial para o caso de algum conteúdo já estar visível (pouco provável aqui, mas seguro)
    if (document.readyState === 'complete') {
        if (typeof window.setupAnalyticsTooltips === 'function') {
            window.setupAnalyticsTooltips();
        }
    } else {
        // Normalmente, initAnalytics chamará isso após o carregamento dos dados.
    }
});