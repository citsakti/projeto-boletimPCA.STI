document.addEventListener('DOMContentLoaded', () => {
    // Usa o botão de imprimir já presente no HTML
    let btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', printPage);
    }

    // Escuta o atalho de teclado Ctrl+P (ou ⌘+P) para acionar também a impressão
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            printPage();
        }
    });
});

function printPage() {
    // Esconde o botão de imprimir, caso esteja visível
    let btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.style.display = 'none';
    }

    // Verifica se há algum filtro aplicado
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
    // Verifica os checkboxes do dropdown de status
    document.querySelectorAll('#status-filter input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            filtroAplicado = true;
        }
    });
    // Verifica se há algum filtro aplicado no painel de resumo
    if (window.painelFilterStatus && window.painelFilterStatus !== 'TODOS') {
        filtroAplicado = true;
    }

    // Cria o elemento de estilo para sobrescrever animações e ocultar elementos indesejados na impressão
    const printStyle = document.createElement('style');
    printStyle.id = 'printOverrides';
    printStyle.innerHTML = `
        /* Desativa todas as animações */
        * {
            animation: none !important;
        }
        /* Oculta o botão "limpar filtros", a linha de filtros, o botão de imprimir e o emoji de link */
        .btn-limpar-filtros,
        thead tr.filter-row,
        #btnPrint,
        .processo-link-icon { /* Emoji de link removido da lista original e #btnPCAPublicada movido */
            display: none !important;
        }
        /* Oculta especificamente o botão PCA Publicada */
        #btnPCAPublicada {
            display: none !important;
        }
        /* Garante que a coluna "Processos" (9ª coluna) não quebre linha durante a impressão */
        table th:nth-child(9),
        table td:nth-child(9) {
            white-space: nowrap !important;
        }
        ${filtroAplicado ? '.painel-resumo { display: none !important; }' : ''}
    `;
    document.head.appendChild(printStyle);

    // Função para restaurar o estado original da página
    function restorePage() {
        const style = document.getElementById('printOverrides');
        if (style) {
            style.remove();
        }
        if (btnPrint) {
            btnPrint.style.display = '';
        }
        // Remove os listeners para evitar múltiplas execuções
        window.removeEventListener('afterprint', restorePage);
        window.removeEventListener('focus', restorePage);
    }

    // Adiciona os eventos para restaurar a página depois da impressão/cancelamento
    window.addEventListener('afterprint', restorePage);
    window.addEventListener('focus', restorePage);

    // Executa a impressão
    window.print();
}
