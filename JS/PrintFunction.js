/**
 * PrintFunction.js - Sistema de Impressão do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Gerenciar a impressão otimizada das páginas do Boletim
 *  - Ocultar elementos desnecessários durante a impressão
 *  - Aplicar estilos específicos para versão impressa
 *  - Restaurar a visualização normal após impressão
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Botão de impressão: Identificado pelo ID 'btnPrint'
 *   - Elementos ocultáveis: Botões, filtros, e itens não relevantes para versão impressa
 *   - Estilos dinâmicos: Regras CSS específicas aplicadas somente durante impressão
 * 
 * # Funções Principais:
 *   - printPage(): Prepara a página e inicia a impressão pelo navegador
 *   - hideElementsForPrint(): Oculta elementos desnecessários
 *   - applyPrintStyles(): Aplica estilos específicos para impressão
 *   - restorePageAfterPrint(): Restaura a visualização normal
 * 
 * # Fluxo de Execução:
 *   1. Event listener é configurado para o botão de impressão
 *   2. Ao acionar a impressão, elementos desnecessários são ocultados
 *   3. Estilos específicos são aplicados (remoção de animações, ajustes de layout)
 *   4. Após impressão ou cancelamento, a visualização normal é restaurada
 *  * # Lógica Condicional:
 *   - Elementos de interface são sempre ocultados na impressão
 *   - Painel de resumos e linha decorativa são sempre removidos
 *   - Diferentes áreas da página recebem tratamentos específicos
 *   - Breaks de página são otimizados para melhor resultado em papel
 * 
 * # Dependências:
 *   - Botão com ID 'btnPrint' no HTML
 *   - Estrutura DOM específica para identificar elementos a ocultar
 *   - CSS base da aplicação (para sobrescrever propriedades específicas)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Obtém o botão de imprimir pelo ID
    let btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', printPage);
    }

    // Adiciona suporte ao atalho de teclado Ctrl+P ou ⌘+P
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            printPage();
        }
    });
});

/*
 * Função principal de impressão.
 * Oculta elementos desnecessários, aplica estilos específicos para impressão e restaura o estado original após imprimir.
 * 
 * Elementos ocultados na impressão:
 * - Botões de ação (imprimir, fonte de dados, relatório analítico, PCA publicada)
 * - Filtros e linha de filtros da tabela
 * - Painel de resumos completo (independente de filtros aplicados)
 * - Linha decorativa
 * - Containers da toolbar e controles móveis (para eliminar espaçamento)
 * - Ícones de processo
 */
function printPage() {    // Esconde o botão de imprimir, caso esteja visível
    let btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.style.display = 'none';
    }/*
     * Cria um elemento <style> para sobrescrever estilos durante a impressão:
     * - Remove animações
     * - Oculta botões e elementos de filtro
     * - Garante que a coluna de processos não quebre linha
     * - Oculta o painel de resumo e linha decorativa
     */
    const printStyle = document.createElement('style');
    printStyle.id = 'printOverrides';
    printStyle.innerHTML = `
        /* Desativa todas as animações */
        * {
            animation: none !important;
        }
        /* Oculta botões e filtros */
        .btn-limpar-filtros,
        thead tr.filter-row,
        #btnPrint,
        #btnFonteDeDados,
        #btnRelatorioAnalitico,
        .processo-link-icon {
            display: none !important;
        }
        /* Oculta o botão PCA Publicada */
        #btnPCAPublicada {
            display: none !important;
        }        /* Oculta o painel de resumos e linha decorativa */
        .painel-resumo,
        .painel-resumo-container,
        #painel-resumo-container,
        .linha-decorativa,
        .painel-toggle-btn {
            display: none !important;
        }
        /* Oculta containers que podem causar espaçamento */
        .toolbar,
        #toolbar,
        .mobile-controls-container,
        #mobile-filters {
            display: none !important;
        }
        /* Impede quebra de linha na coluna Processos */
        table th:nth-child(9),
        table td:nth-child(9) {
            white-space: nowrap !important;
        }
    `;
    document.head.appendChild(printStyle);

    /*
     * Função para restaurar o estado original da página após a impressão ou cancelamento:
     * - Remove o estilo de impressão
     * - Restaura a exibição do botão de imprimir
     * - Remove os listeners de restauração
     */
    function restorePage() {
        const style = document.getElementById('printOverrides');
        if (style) {
            style.remove();
        }
        if (btnPrint) {
            btnPrint.style.display = '';
        }
        window.removeEventListener('afterprint', restorePage);
        window.removeEventListener('focus', restorePage);
    }

    // Adiciona eventos para restaurar a página após imprimir ou cancelar
    window.addEventListener('afterprint', restorePage);
    window.addEventListener('focus', restorePage);

    // Executa a impressão
    window.print();
}
