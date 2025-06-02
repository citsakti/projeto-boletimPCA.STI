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
    // Adiciona o botão de limpar filtros mobile
    const limparBtnMobile = document.getElementById("mobile-clear-filters-btn"); 

    if (!limparBtn && !limparBtnMobile) return;

    // Função para verificar se existem filtros ativos
    function checkActiveFilters() {
        const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
        const painelFilterAtivo = window.painelFilterStatus && window.painelFilterStatus !== 'TODOS';
        
        // Verifica filtros ativos no mobile através da instância de MobileCardsFilters
        let mobileFiltersAtivos = false;
        if (window.mobileCardsFiltersInstance && typeof window.mobileCardsFiltersInstance.hasActiveFilters === 'function') {
            mobileFiltersAtivos = window.mobileCardsFiltersInstance.hasActiveFilters();
        }

        const hasActiveFilters = activeFilterButtons.length > 0 || painelFilterAtivo || mobileFiltersAtivos;

        if (limparBtn) {
            if (hasActiveFilters) {
                limparBtn.classList.add('filters-active');
            } else {
                limparBtn.classList.remove('filters-active');
            }
        }
        if (limparBtnMobile) {
            if (hasActiveFilters) {
                limparBtnMobile.classList.add('filters-active'); // Supondo uma classe similar para o botão mobile
            } else {
                limparBtnMobile.classList.remove('filters-active');
            }
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
    // Adiciona listener para o evento de atualização de filtros mobile
    document.addEventListener('mobile-filters-updated', checkActiveFilters);

    // Também verifica periodicamente (como backup)
    setInterval(checkActiveFilters, 2000);

    // Adiciona listeners para os botões de limpar filtros
    if (limparBtn) {
        limparBtn.addEventListener('click', () => {
            // Lógica para limpar filtros web (Google Sheets, Painel de Resumo)
            if (typeof resetPainelFilterStatus === 'function') {
                resetPainelFilterStatus(); // Reseta o painel de resumo, que deve chamar masterFilterFunction
            }
            // Adicionalmente, reseta os filtros do Google Sheets diretamente se necessário
            const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
            filterButtons.forEach(button => {
                button.classList.remove('filter-active');
                button.removeAttribute('data-active-filters');
            });
            if (typeof masterFilterFunction === 'function') {
                masterFilterFunction(); // Garante que a tabela seja atualizada
            }

            // Limpa filtros mobile
            if (window.mobileCardsFiltersInstance && typeof window.mobileCardsFiltersInstance.clearFilters === 'function') {
                window.mobileCardsFiltersInstance.clearFilters();
                window.mobileCardsFiltersInstance.updateActiveFiltersCount();
                 // Notifica o MobileCardsManager para reaplicar os filtros (mostrar todos os cards)
                document.dispatchEvent(new CustomEvent('mobile-filters-updated', {
                    detail: { 
                        source: 'clearFiltersButton', 
                        newFilters: window.mobileCardsFiltersInstance.getFilters() 
                    }
                }));
                if (window.mobileCardsManager && typeof window.mobileCardsManager.applyFilters === 'function') {
                    window.mobileCardsManager.applyFilters(); 
                }
            }
            checkActiveFilters(); // Atualiza o estado do botão
        });
    }

    if (limparBtnMobile) {
        limparBtnMobile.addEventListener('click', () => {
            // Lógica para limpar filtros mobile
            if (window.mobileCardsFiltersInstance && typeof window.mobileCardsFiltersInstance.clearFilters === 'function') {
                window.mobileCardsFiltersInstance.clearFilters();
                window.mobileCardsFiltersInstance.updateActiveFiltersCount();
                document.dispatchEvent(new CustomEvent('mobile-filters-updated', {
                    detail: { 
                        source: 'clearFiltersButtonMobile', 
                        newFilters: window.mobileCardsFiltersInstance.getFilters() 
                    }
                }));
                if (window.mobileCardsManager && typeof window.mobileCardsManager.applyFilters === 'function') {
                    window.mobileCardsManager.applyFilters(); 
                }
            }

            // Limpa filtros web (Google Sheets, Painel de Resumo)
            if (typeof resetPainelFilterStatus === 'function') {
                resetPainelFilterStatus();
            }
            const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
            filterButtons.forEach(button => {
                button.classList.remove('filter-active');
                button.removeAttribute('data-active-filters');
            });
            if (typeof masterFilterFunction === 'function') {
                masterFilterFunction();
            }
            checkActiveFilters(); // Atualiza o estado do botão
        });
    }
}
