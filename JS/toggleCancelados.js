document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleCancelados');
    window.canceladosOcultos = true;

    /**
     * Atualiza a visibilidade das linhas da tabela que contêm o status de cancelamento "CANCELADO ❌".
     *
     * Esta função seleciona todas as linhas dentro do corpo da tabela e verifica a sexta célula de cada linha 
     * (índice 5) para identificar o texto de cancelamento. Com base na variável booleana global `canceladosOcultos`, 
     * ela oculta ou exibe essas linhas. Também atualiza o conteúdo do botão global `btnToggle` para refletir o 
     * estado atual da visibilidade dos cancelamentos.
     *
     * Após ajustar a exibição das linhas, se a função `alternaCoresLinhas` estiver definida, 
     * ela é chamada para reaplicar as cores alternadas nas linhas visíveis.
     *
     * @function updateCancelados
     */
    function updateCancelados() {
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const statusCell = row.querySelectorAll('td')[5];
            if (statusCell && statusCell.textContent.includes('CANCELADO ❌')) {
                row.style.display = window.canceladosOcultos ? 'none' : '';
            }
        });
        btnToggle.textContent = window.canceladosOcultos
            ? 'Revelar Cancelados ❌'
            : 'Ocultar Cancelados ❌';
        // Reaplica alternância de cores após ocultar/exibir linhas
        if (typeof alternaCoresLinhas === 'function') alternaCoresLinhas();
    }

    // Monitora quando a tabela for povoada pelo CSV
    const tbody = document.querySelector('table tbody');
    const observer = new MutationObserver((mutations, obs) => {
        if (tbody.querySelector('tr')) {
            updateCancelados();
            obs.disconnect();
        }
    });
    observer.observe(tbody, { childList: true });

    btnToggle.addEventListener('click', () => {
        window.canceladosOcultos = !window.canceladosOcultos;
        updateCancelados();
    });
});
