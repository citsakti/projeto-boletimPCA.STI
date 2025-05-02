const areaMapping = {
    'STI 👩‍💼': 'area-sti',
    'OPERAÇÕES 🗄️': 'area-operacoes',
    'DEV 👨‍💻': 'area-dev',
    'ANALYTICS 📊': 'area-analytics',
    'GOVERNANÇA 🌐': 'area-governanca',
};

function assignAreaClasses() {
    document.querySelectorAll('table tbody tr').forEach(row => {
        const cell = row.querySelectorAll('td')[1]; // coluna Área
        if (!cell) return;

        const txt = cell.textContent.trim();
        const base = areaMapping[txt];
        if (!base) return;

        cell.innerHTML = `<span class="${base}-highlight">${txt}</span>`;
    });
}

// chama ao carregar o DOM e também após popular a tabela
document.addEventListener('DOMContentLoaded', () => {
    // popular tabela
    assignAreaClasses();
});
document.addEventListener('tabela-carregada', assignAreaClasses);

window.assignAreaClasses = assignAreaClasses;

document.querySelectorAll('table tbody tr').forEach(row => {
    const cell = row.querySelector('td:nth-child(2)');
    console.log(`[${cell.textContent}] =>`, cell.textContent.trim() === 'ANALYTICS 📊');
});