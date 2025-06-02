/**
 * painel-resumo-updates.js - Extensão para atualizar o painel de resumos com filtros Google Sheets
 * 
 * Este script é responsável por:
 *  - Conectar os filtros do painel de resumos com o sistema Google Sheets e filtros mobile
 *  - Atualizar dinamicamente os contadores do painel conforme a filtragem é aplicada
 *  - Melhorar a experiência em dispositivos móveis e tablets
 * 
 * ⚠️ FUNCIONALIDADE DESABILITADA ⚠️
 * Este arquivo foi temporariamente desabilitado para manter as contagens do painel
 * de resumos sempre fixas (mostrando os totais originais), independente dos filtros aplicados.
 * A funcionalidade foi movida para PainelDeResumos.js com contagens fixas.
 */

/* CÓDIGO COMENTADO - CONTAGENS DINÂMICAS DESABILITADAS

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona event listener para quando filtros Google Sheets são aplicados
    document.addEventListener('google-sheet-filter-applied', () => {
        // Atualiza o painel para refletir os itens visíveis após filtragem
        updatePainelResumoWithVisibleRows();
    });
    
    // Adiciona event listener para quando filtros mobile são aplicados
    document.addEventListener('mobile-filter-applied', () => {
        // Atualiza o painel para refletir os itens visíveis após filtragem mobile
        updatePainelResumoWithVisibleRows();
    });
});

// Nova função que atualiza o painel baseado apenas nas linhas visíveis
function updatePainelResumoWithVisibleRows() {
    const resumoContainer = document.querySelector('.painel-resumo');
    if (!resumoContainer) return;
    
    // Seleciona apenas as linhas visíveis da tabela
    const allRows = document.querySelectorAll('table tbody tr');
    const visibleRows = Array.from(allRows).filter(row => row.style.display !== 'none');
    
    const statusCounts = {};
    let totalVisible = 0;
    
    visibleRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Considerando que "Status do Processo" é a 6ª coluna (índice 5)
        const status = cells[5] ? cells[5].textContent.trim() : '';
        if (status !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totalVisible++;
        }
    });
    
    // Mantém o HTML existente mas atualiza apenas os contadores
    const statusElements = resumoContainer.querySelectorAll('.status-option');
    statusElements.forEach(el => {
        const statusText = el.getAttribute('data-status');
        if (statusText === 'TODOS') {
            el.textContent = `TODOS: ${totalVisible}`;
        } else if (statusCounts[statusText] !== undefined) {
            el.textContent = `${statusText}: ${statusCounts[statusText]}`;
        } else {
            el.textContent = `${statusText}: 0`;
        }
    });
}

*/
