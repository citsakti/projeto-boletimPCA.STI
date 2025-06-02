/**
 * AnalyticsContratos.js - Gerenciador de interfaces para contratos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Criar e gerenciar tooltips para exibir números de contratos
 *  - Implementar funcionalidade de modal para visualização de contratos
 *  - Fornecer interface unificada para integração com o sistema de analytics
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Tooltip: Elemento flutuante que mostra número do contrato ao passar o mouse
 *   - Modal: Janela de visualização que carrega o contrato do TCE-CE via iframe
 * 
 * # Funções Principais:
 *   - showAnalyticsTooltip(): Exibe tooltip com número do contrato
 *   - hideAnalyticsTooltip(): Oculta o tooltip
 *   - openAnalyticsContractModal(): Abre modal com iframe do contrato
 *   - closeAnalyticsModal(): Fecha o modal com animação
 *   - setupAnalyticsTooltips(): Função global para configurar tooltips em células de tabela
 * 
 * # Fluxo de Execução:
 *   1. O script cria elementos de UI reutilizáveis (tooltip)
 *   2. Captura referências para elementos do modal no DOM
 *   3. Define funções de manipulação de eventos
 *   4. Expõe função global para configuração de tooltips
 *   5. Configura listeners para fechamento do modal (clique, ESC)
 * 
 * # Integração:
 *   - Exporta setupAnalyticsTooltips como método global (window)
 *   - Responde a eventos de mouse em células com atributo data-contrato
 *   - Utiliza classes CSS existentes (status-tooltip) para estilização
 *   - Adiciona ícone 📄 para indicar contratos visualizáveis
 * 
 * # Interação com Usuário:
 *   - Hover: Exibe tooltip com número do contrato
 *   - Clique: Abre modal para visualização completa do contrato
 *   - ESC/clique externo/botão fechar: Fecha o modal
 * 
 * # Tratamento de Erros:
 *   - Fallback para abrir em nova aba caso modal não esteja disponível
 *   - Verificações de null/empty para evitar erros em atributos ausentes
 *   - Limpeza do iframe após fechamento para prevenir problemas de memória
 */
document.addEventListener('DOMContentLoaded', function() {
    // Criar elemento de tooltip que será reutilizado
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip'; // Reutilize a classe CSS existente
    document.body.appendChild(tooltip);
      // Referências aos elementos do modal (assumindo que existem em DadosAnaliticos.html)
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
    const closeModalBtn = document.getElementById('close-modal-btn');

    /**
     * Exibe tooltip com número do contrato
     * @param {Event} event - Evento de mouse que acionou a função
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
     * Se o modal não estiver disponível, abre em nova aba como fallback
     */
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
        
        // Sincronizar com o iframe Bootstrap se existir
        const bootstrapIframe = document.getElementById('processo-iframe');
        if (bootstrapIframe) {
            bootstrapIframe.src = contractUrl;
        }
        
        modalIframe.src = contractUrl;
        modalOverlay.style.display = 'flex';
        
        modalContent.classList.remove('show');
        void modalContent.offsetWidth; 
        modalContent.classList.add('show');
        
        document.body.style.overflow = 'hidden';
    }    /**
     * Fecha o modal com animação
     * Limpa o iframe para economizar recursos
     */    
    function closeAnalyticsModal() {
        if (modalOverlay && modalContent && modalIframe) {
            modalContent.classList.remove('show');
            
            // Otimização: esconder o overlay imediatamente para melhor UX
            modalOverlay.style.opacity = '0';
            modalOverlay.style.pointerEvents = 'none';
            
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                // Restaurar propriedades para próxima abertura
                modalOverlay.style.opacity = '';
                modalOverlay.style.pointerEvents = '';
                
                modalIframe.src = 'about:blank'; // Limpa o iframe legacy
                // Limpar também o iframe Bootstrap se existir
                const bootstrapIframe = document.getElementById('processo-iframe');
                if (bootstrapIframe) {
                    bootstrapIframe.src = 'about:blank';
                }
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

    /**
     * Função global para configurar tooltips e modais nas células de tabela
     * Exposta como método global para ser chamada após carregamento de dados
     */
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