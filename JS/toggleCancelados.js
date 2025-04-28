document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleCancelados');
    window.canceladosOcultos = false;

    btnToggle.addEventListener('click', () => {
        window.canceladosOcultos = !window.canceladosOcultos;
        const rows = document.querySelectorAll('table tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            // Considera que a coluna "Status do Processo" é a 6ª (índice 5)
            if (cells[5] && cells[5].textContent.includes('CANCELADO ❌')) {
                row.style.display = window.canceladosOcultos ? 'none' : '';
            }
        });

        btnToggle.textContent = window.canceladosOcultos ? 'Revelar Cancelados ❌' : 'Ocultar Cancelados ❌';
    });
});