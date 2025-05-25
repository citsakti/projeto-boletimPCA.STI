/**
 * InformacoesDeContratos.js - Sistema de visualização de contratos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Adicionar tooltips informativos sobre contratos nos projetos da tabela
 *  - Tornar células clicáveis para abrir os contratos em um modal com iframe
 *  - Monitorar mudanças na tabela para manter a funcionalidade em atualizações dinâmicas
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Tooltip: Elemento flutuante que mostra informações do contrato ao passar o mouse
 *   - Modal: Janela que exibe o contrato em um iframe quando o usuário clica na célula
 * 
 * # Funções Principais:
 *   - setupTooltips(): Configura os tooltips e eventos de clique nas células
 *   - showTooltip(): Exibe o tooltip com informações do contrato
 *   - hideTooltip(): Oculta o tooltip quando o mouse sai da célula
 *   - openContractInModal(): Abre o modal com iframe para visualização do contrato
 * 
 * # Fluxo de Execução:
 *   1. Cria elemento de tooltip no carregamento do DOM
 *   2. Configura referências para o modal existente
 *   3. Monitora mudanças na tabela usando MutationObserver
 *   4. Aplica tooltips e eventos de clique nas células relevantes
 * 
 * # Dependências:
 *   - Modal compartilhado com outros scripts
 *   - Evento customizado 'tabela-carregada'
 */

document.addEventListener('DOMContentLoaded', function() {
    // Criar elemento de tooltip que será reutilizado
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip';
    document.body.appendChild(tooltip);
    
    // Referências aos elementos do modal (reutilizando o modal existente)
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay.querySelector('.modal-content');
    const modalIframe = document.getElementById('processo-iframe');
    
    // Adicionar eventos após o carregamento da tabela
    document.addEventListener('tabela-carregada', setupTooltips);
    
    // Observer para monitorar mudanças na tabela
    const observer = new MutationObserver(setupTooltips);
    const tableBody = document.querySelector('table tbody');
    if (tableBody) {
        observer.observe(tableBody, { childList: true, subtree: true });
    }
    
    // Configuração inicial se a tabela já estiver carregada
    setupTooltips();
    
    function setupTooltips() {
        // Selecionar todas as células de projeto (4ª coluna)
        const projetoCells = document.querySelectorAll('table tbody tr td:nth-child(4)');
        
        projetoCells.forEach(cell => {
            // Remover handlers antigos para evitar duplicação
            cell.removeEventListener('mouseenter', showTooltip);
            cell.removeEventListener('mouseleave', hideTooltip);
            cell.removeEventListener('click', openContractModal);
            
            // Adicionar os eventos apenas se tiver contrato
            if (cell.hasAttribute('data-contrato') && cell.getAttribute('data-contrato').trim() !== '') {
                cell.addEventListener('mouseenter', showTooltip);
                cell.addEventListener('mouseleave', hideTooltip);
                cell.addEventListener('click', openContractModal);
                
                // Adicionar estilo para indicar que é clicável
                cell.style.cursor = 'pointer';
                
                // Adicionar um ícone para indicar que é clicável - opção 1: ícone no final do texto
                if (!cell.querySelector('.contract-link-icon')) {
                    const originalText = cell.innerHTML;
                    cell.innerHTML = `${originalText} <span class="contract-link-icon" title="Abrir contrato">📄</span>`;
                }
            }
        });
    }
    
    function showTooltip(event) {
        const numeroContrato = this.getAttribute('data-contrato');
        if (!numeroContrato || numeroContrato.trim() === '') return;
        
        tooltip.textContent = `Contrato ${numeroContrato}`;
        tooltip.style.opacity = '1';
        
        // Posicionar o tooltip acima do elemento
        const rect = this.getBoundingClientRect();
        tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10 + window.scrollY) + 'px';
    }
    
    function hideTooltip() {
        tooltip.style.opacity = '0';
    }
    
    function openContractModal() {
        const numeroRegistro = this.getAttribute('data-registro');
        if (!numeroRegistro || numeroRegistro.trim() === '') return;
        
        // Construir a URL com o número de registro (não com o número do contrato)
        const contractUrl = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
        
        // Configurar e abrir o modal
        if (modalIframe && modalOverlay && modalContent) {
            modalIframe.src = contractUrl;
            modalOverlay.style.display = 'flex';
            
            // Adicionar a animação de entrada
            modalContent.classList.remove('show');
            void modalContent.offsetWidth; // Força um reflow
            modalContent.classList.add('show');
            
            // Impedir rolagem da página de fundo
            document.body.style.overflow = 'hidden';
        } else {
            // Fallback caso o modal não esteja disponível
            window.open(contractUrl, '_blank');
        }
    }
});