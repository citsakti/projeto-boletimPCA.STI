/**
 * Script para gerenciar a funcionalidade do botão "RELATÓRIO ANALÍTICO"
 * Agora faz redirecionamento direto para DadosAnaliticos.html
 */

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o botão pelo ID
    const btnRelatorioAnalitico = document.getElementById('btnRelatorioAnalitico');
    
    // URL da página de dados analíticos
    const dadosAnaliticosUrl = './DadosAnaliticos.html';
    
    // Função para redirecionar diretamente
    function redirectToDadosAnaliticos() {
        window.location.href = dadosAnaliticosUrl;
    }
    
    // Adiciona o evento de clique ao botão
    if (btnRelatorioAnalitico) {
        btnRelatorioAnalitico.addEventListener('click', redirectToDadosAnaliticos);
    } else {
        console.error('Botão com ID "btnRelatorioAnalitico" não encontrado no HTML.');
    }
});