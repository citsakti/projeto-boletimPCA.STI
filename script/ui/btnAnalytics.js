/**
 * btnAnalytics.js - Gerenciador do botão de redirecionamento para o Relatório Analítico
 * 
 * Este script é responsável por:
 *  - Configurar o comportamento do botão "RELATÓRIO ANALÍTICO" na interface principal
 *  - Gerenciar o redirecionamento do usuário para a página de dados analíticos
 *  - Tratar possíveis erros de configuração do botão no DOM
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Botão "RELATÓRIO ANALÍTICO": Identificado pelo ID 'btnRelatorioAnalitico'
 *   - Deve estar presente no HTML da página principal
 * 
 * # Funções Principais:
 *   - redirectToDadosAnaliticos(): Realiza o redirecionamento para a página analítica
 *   - Configuração de event listener para o clique no botão
 * 
 * # Fluxo de Execução:
 *   1. Aguarda o carregamento completo do DOM
 *   2. Localiza o botão pelo seu ID no documento
 *   3. Configura a função de redirecionamento no evento de clique
 *   4. Exibe mensagem de erro no console se o botão não for encontrado
 * 
 * # Tratamento de Erros:
 *   - Verifica se o botão existe antes de adicionar o event listener
 *   - Logs de erro para facilitar depuração quando o botão não for encontrado
 * 
 * # Integração:
 *   - O script é carregado na página principal (index.html)
 *   - Trabalha em conjunto com DadosAnaliticos.html e o sistema de analytics
 *   - Usa caminhos relativos para garantir funcionamento em diferentes ambientes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o botão pelo ID
    const btnRelatorioAnalitico = document.getElementById('btnRelatorioAnalitico');
    
    // URL da página de dados analíticos (caminho relativo)
    const dadosAnaliticosUrl = './DadosAnaliticos.html';
    
    /**
     * Função para redirecionar o usuário para a página de dados analíticos
     * Utiliza window.location.href para navegação completa da página
     * Passa o ano selecionado como parâmetro de URL
     */
    function redirectToDadosAnaliticos() {
        // Verifica se existe um ano selecionado e passa como parâmetro
        let url = dadosAnaliticosUrl;
        
        if (window.getSelectedYear && typeof window.getSelectedYear === 'function') {
            const selectedYear = window.getSelectedYear();
            // Adiciona o ano como parâmetro de URL
            url += `?ano=${selectedYear}`;
        }
        
        window.location.href = url;
    }
    
    // Adiciona o evento de clique ao botão se ele existir
    if (btnRelatorioAnalitico) {
        btnRelatorioAnalitico.addEventListener('click', redirectToDadosAnaliticos);
    } else {
        // Log de erro para facilitar depuração
        console.error('Botão com ID "btnRelatorioAnalitico" não encontrado no HTML.');
    }
});