// Este script gerencia a funcionalidade de impressão da página, ocultando elementos indesejados durante a impressão.

/*
 * Ao carregar o DOM, adiciona listeners para o botão de imprimir e para o atalho de teclado Ctrl+P (ou ⌘+P no Mac).
 * Quando acionados, executam a função printPage().
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
 */
function printPage() {
    // Esconde o botão de imprimir, caso esteja visível
    let btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.style.display = 'none';
    }

    // Verifica se algum filtro está aplicado na tabela ou no painel de resumo
    let filtroAplicado = false;
    document.querySelectorAll('.filter-row input[type="text"]').forEach(input => {
        if (input.value.trim() !== '') {
            filtroAplicado = true;
        }
    });
    document.querySelectorAll('.filter-row select').forEach(select => {
        if (select.value.trim() !== '') {
            filtroAplicado = true;
        }
    });
    // Verifica checkboxes do filtro de status
    document.querySelectorAll('#status-filter input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            filtroAplicado = true;
        }
    });
    // Verifica filtro aplicado no painel de resumo
    if (window.painelFilterStatus && window.painelFilterStatus !== 'TODOS') {
        filtroAplicado = true;
    }

    /*
     * Cria um elemento <style> para sobrescrever estilos durante a impressão:
     * - Remove animações
     * - Oculta botões e elementos de filtro
     * - Garante que a coluna de processos não quebre linha
     * - Oculta o painel de resumo se houver filtro aplicado
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
        .processo-link-icon {
            display: none !important;
        }
        /* Oculta o botão PCA Publicada */
        #btnPCAPublicada {
            display: none !important;
        }
        /* Impede quebra de linha na coluna Processos */
        table th:nth-child(9),
        table td:nth-child(9) {
            white-space: nowrap !important;
        }
        ${filtroAplicado ? '.painel-resumo { display: none !important; }' : ''}
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
