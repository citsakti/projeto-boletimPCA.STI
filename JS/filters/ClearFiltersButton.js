/**
 * clear-filters-button.js - Melhoria na interação do botão Limpar Filtros
 * 
 * Este script melhora a experiência do usuário ao destacar o botão "Limpar Filtros"
 * quando há filtros ativos na tabela, fornecendo um feedback visual claro.
 */

document.addEventListener('DOMContentLoaded', setupClearFiltersButtonObserver);
document.addEventListener('tabela-carregada', setupClearFiltersButtonObserver);

/**
 * Configura um MutationObserver para monitorar mudanças nos botões de filtro
 * e destacar o botão "Limpar Filtros" quando necessário
 */
function setupClearFiltersButtonObserver() {
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (!limparBtn) return;

    // Função para verificar se existem filtros ativos
    function checkActiveFilters() {
        const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
        
        // Verifica se há filtros ativos do painel de resumo
        const painelFilterAtivo = window.painelFilterStatus && window.painelFilterStatus !== 'TODOS';
        
        console.log('Verificando filtros ativos - Filtros de coluna:', activeFilterButtons.length, 'Filtro do painel:', painelFilterAtivo);
        
        if (activeFilterButtons.length > 0 || painelFilterAtivo) {
            // Há filtros ativos, destaca o botão
            limparBtn.classList.add('filters-active');
        } else {
            // Não há filtros ativos, remove o destaque
            limparBtn.classList.remove('filters-active');
        }
    }

    // Verifica inicialmente
    setTimeout(checkActiveFilters, 500);

    // Configura o observador para monitorar mudanças nos botões de filtro
    const filterRowElement = document.querySelector('.filter-row');
    if (filterRowElement) {
        const observer = new MutationObserver(function(mutations) {
            // Quando houver alterações, verifica se há filtros ativos
            checkActiveFilters();
        });

        // Observa mudanças nos atributos e classes dos botões de filtro
        observer.observe(filterRowElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-active-filters']
        });
    }
    
    // Adiciona listener para o evento personalizado do painel de filtros
    document.addEventListener('painel-filter-applied', checkActiveFilters);

    // Também verifica periodicamente (como backup)
    setInterval(checkActiveFilters, 2000);
}
