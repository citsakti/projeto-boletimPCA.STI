function aplicarCssHeritageStatusDoProcesso() {
    // Seleciona todas as linhas da tabela
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        // Considera que a coluna "Status do Processo" está na 5ª coluna (índice 4)
        const statusCell = row.cells[4];
        if (statusCell) {
            const statusText = statusCell.textContent.trim();
            // Verifica se o objeto statusMapping existe e possui a classe para o status
            if (typeof statusMapping !== 'undefined' && statusMapping[statusText]) {
                const className = statusMapping[statusText];
                row.classList.add(className);
            }
        }
    });
}

// Escuta o evento customizado "tabela-carregada"
document.addEventListener('tabela-carregada', aplicarCssHeritageStatusDoProcesso);