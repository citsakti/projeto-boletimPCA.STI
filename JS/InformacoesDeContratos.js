/**
 * InformacoesDeContratos.js
 * 
 * Este script adiciona tooltips para exibir informações sobre os contratos ao passar o mouse
 * sobre os projetos de aquisição na tabela do Boletim PCA.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Criar elemento de tooltip que será reutilizado
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip';
    document.body.appendChild(tooltip);
    
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
            
            // Adicionar os eventos apenas se tiver contrato
            if (cell.hasAttribute('data-contrato') && cell.getAttribute('data-contrato').trim() !== '') {
                cell.addEventListener('mouseenter', showTooltip);
                cell.addEventListener('mouseleave', hideTooltip);
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
});