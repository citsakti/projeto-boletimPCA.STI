document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleCancelados');
    window.canceladosOcultos = true;

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
