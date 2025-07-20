/**
 * Configura o seletor de ano na página de dados analíticos de forma específica
 * Essa implementação complementa a do YearSelector.js para a página de dados analíticos
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Adiciona o seletor de ano na toolbar de dados analíticos
        const toolbar = document.querySelector('.toolbar');
        
        if (toolbar) {
            // Obtém o ano selecionado do localStorage
            const selectedYear = localStorage.getItem('selectedYear') || '2025';
            
            // Cria o div para o seletor de ano
            const yearSelectorDiv = document.createElement('div');
            yearSelectorDiv.className = 'year-selector';
            
            const label = document.createElement('label');
            label.textContent = 'Ano:';
            label.htmlFor = 'year-select-analytics';
            
            const select = document.createElement('select');
            select.id = 'year-select-analytics';
            select.name = 'year-select-analytics';
            select.className = 'form-select form-select-sm';
            
            const option2025 = document.createElement('option');
            option2025.value = '2025';
            option2025.textContent = '2025';
            
            const option2026 = document.createElement('option');
            option2026.value = '2026';
            option2026.textContent = '2026';
            
            select.appendChild(option2025);
            select.appendChild(option2026);
            
            // Define o valor selecionado
            select.value = selectedYear;
            
            // Adiciona evento de mudança
            select.addEventListener('change', function() {
                const newYear = this.value;
                localStorage.setItem('selectedYear', newYear);
                
                // Recarrega a página para aplicar as mudanças
                window.location.reload();
            });
            
            yearSelectorDiv.appendChild(label);
            yearSelectorDiv.appendChild(select);
            
            // Insere o seletor no início da toolbar, após o botão de voltar
            const btnVoltar = document.getElementById('btnVoltar');
            if (btnVoltar && btnVoltar.nextSibling) {
                toolbar.insertBefore(yearSelectorDiv, btnVoltar.nextSibling);
            } else {
                toolbar.appendChild(yearSelectorDiv);
            }
        }
    });
})();
