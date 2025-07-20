/**
 * AnalyticsYearSelector.js - Processa o parâmetro de ano na URL para a página de dados analíticos
 * 
 * Este script é responsável por:
 *  - Obter o parâmetro 'ano' da URL quando a página é carregada
 *  - Configurar o seletor de ano com o valor correto baseado no parâmetro
 *  - Garantir que a página de dados analíticos use o mesmo ano que a página principal
 */

(function() {
    /**
     * Obtém os parâmetros da URL atual
     * @returns {Object} Um objeto com os parâmetros da URL
     */
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        
        return params;
    }
    
    /**
     * Configura o ano correto baseado no parâmetro da URL
     */
    function setupYearFromUrl() {
        const params = getUrlParams();
        
        // Verifica se o parâmetro 'ano' existe na URL
        if (params.ano) {
            // Armazena o ano no localStorage para que o YearSelector.js o utilize
            localStorage.setItem('selectedYear', params.ano);
        }
    }
    
    // Executa a configuração assim que o script for carregado
    setupYearFromUrl();
})();
