function updatePainelResumo() {
    const resumoContainer = document.querySelector('.painel-resumo');
    if (!resumoContainer) return;
    
    // Seleciona todas as linhas da tabela (tbody)
    const rows = document.querySelectorAll('table tbody tr');
    const statusCounts = {};

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Considerando que "Status do Processo" é a 6ª coluna (índice 5)
        const status = cells[5] ? cells[5].textContent.trim() : '';
        if (status !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });

    // Constrói o HTML do painel com elementos clicáveis
    // Remove o text-decoration: underline dos elementos
    let html = `<div class="status-option" data-status="TODOS" style="cursor:pointer; margin-bottom: 5px;">TODOS: ${rows.length}</div>`;
    for (const status in statusCounts) {
        html += `<div class="status-option" data-status="${status}" style="cursor:pointer; margin-bottom: 5px;">${status}: ${statusCounts[status]}</div>`;
    }
    resumoContainer.innerHTML = html;

    // Adiciona o evento de clique para cada status
    const statusElements = resumoContainer.querySelectorAll('.status-option');
    statusElements.forEach(el => {
        el.addEventListener('click', () => {
            const statusSelecionado = el.getAttribute('data-status');
            window.painelFilterStatus = statusSelecionado;
            filterTable();
            // 4) Recolhe o painel de Resumo no mobile após seleção
            const detalhes = document.getElementById('painel-resumo-details');
            if (detalhes) detalhes.removeAttribute('open');
        });
    });
}

// Função para filtrar a tabela conforme o status clicado
function filterTableByStatus(statusSelecionado) {
    // Seleciona todas as linhas da tabela (tbody)
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        if (statusSelecionado === 'TODOS') {
            row.style.display = '';
        } else {
            const cells = row.querySelectorAll('td');
            const status = cells[5] ? cells[5].textContent.trim() : '';
            row.style.display = (status === statusSelecionado) ? '' : 'none';
        }
    });
}

// Atualiza o painel quando o DOM carregar e quando a tabela for preenchida
document.addEventListener('DOMContentLoaded', () => {
    // 0) Fecha o painel de resumo por default no mobile
    if (window.innerWidth <= 768) {
        const detalhes = document.getElementById('painel-resumo-details');
        if (detalhes) detalhes.removeAttribute('open');
    }
    updatePainelResumo();
});

// Mantém este listener para quando a tabela for carregada dinamicamente
document.addEventListener('tabela-carregada', updatePainelResumo);
