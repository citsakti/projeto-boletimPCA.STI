/**
 * StatusAtrasado.js
 * 
 * Este script adiciona tooltips (dicas de contexto) e destaque visual para células da tabela
 * que possuem determinados status de processo, facilitando a visualização de atrasos e etapas importantes.
 * 
 * Funcionamento:
 * - Destaca células da coluna "Status do Processo" (6ª coluna) que contenham status definidos na lista.
 * - Exibe um tooltip ao passar o mouse sobre a célula, mostrando detalhes adicionais (quando disponíveis).
 * - Observa alterações dinâmicas na tabela para manter o comportamento mesmo após atualizações via JavaScript.
 * 
 * Como funciona:
 * 1. Define uma lista de status especiais a serem destacados.
 * 2. Cria um observer para monitorar mudanças na tabela e reaplicar tooltips quando necessário.
 * 3. Cria dinamicamente um elemento de tooltip no body da página.
 * 4. Para cada célula da coluna de status, verifica se o texto corresponde a algum status da lista:
 *    - Se sim, adiciona classe de destaque e listeners para mostrar/ocultar o tooltip.
 *    - Se não, remove destaque e listeners.
 * 5. O conteúdo do tooltip é definido conforme o status e os atributos data-* presentes na célula.
 * 6. O script escuta o evento customizado 'tabela-carregada' para reaplicar tooltips após carregamento dinâmico.
 * 
 * Observações:
 * - Os detalhes exibidos nos tooltips dependem dos atributos data-* presentes nas células.
 * - O script é executado automaticamente ao carregar o DOM.
 * 
 * Dependências:
 * - A tabela deve possuir um <tbody> e a coluna de status deve ser a sexta (índice 5).
 * - As células podem conter atributos data-detalhe-autuacao, data-detalhe-contratacao, data-detalhe-contratacao-renovacao ou data-detalhe-status-geral.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Lista de status a serem destacados
    const statusList = [
        'AUTUAÇÃO ATRASADA 💣',
        'CONTRATAÇÃO ATRASADA ⚠️',
        'AGUARDANDO DFD ⏳',
        'AGUARDANDO ETP ⏳',
        'DFD ATRASADO❗',
        'ETP ATRASADO❗',
        'ELABORANDO TR📝',
        'ANÁLISE DE VIABILIDADE 📝',
        'EM CONTRATAÇÃO 🤝', // Novo
        'EM RENOVAÇÃO 🔄'    // Novo
    ];

    // Configurar observer para detectar mudanças na tabela
    const observer = new MutationObserver(function(mutations) {
        setupTooltips();
    });

    // Configuração inicial do tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip';
    document.body.appendChild(tooltip);

    // Função para configurar os tooltips
    function setupTooltips() {
        // Selecionar todas as células da coluna "Status do Processo" (coluna 6, índice 5 na tabela HTML)
        const statusCells = document.querySelectorAll('table tbody tr td:nth-child(6)');

        statusCells.forEach(cell => {
            // Verificar se contém algum dos status definidos
            const foundStatus = statusList.find(status => cell.textContent.includes(status));
            if (foundStatus) {
                // Adicionar classe para marcação visual
                cell.classList.add('status-atrasado');

                // Remover event listeners antigos (para evitar duplicação)
                cell.removeEventListener('mouseenter', handleMouseEnter);
                cell.removeEventListener('mouseleave', handleMouseLeave);

                // Adicionar novos event listeners
                cell.addEventListener('mouseenter', handleMouseEnter);
                cell.addEventListener('mouseleave', handleMouseLeave);
            } else {
                // Remove a classe e listeners se o status não for mais especial
                cell.classList.remove('status-atrasado');
                cell.removeEventListener('mouseenter', handleMouseEnter);
                cell.removeEventListener('mouseleave', handleMouseLeave);
            }
        });
    }

    // Manipuladores de eventos separados (para poder removê-los facilmente)
    function handleMouseEnter(event) {
        const cell = this; // Esta é a célula <td> da coluna "Status do Processo"
        let tooltipText = '';
        const statusText = cell.textContent.trim();

        if (statusText.includes('AUTUAÇÃO ATRASADA 💣')) {
            const detalhe = cell.dataset.detalheAutuacao;
            tooltipText = detalhe ? detalhe : 'Autuação Atrasada (informação adicional não disponível)';
        } 
        else if (statusText.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
            const detalhe = cell.dataset.detalheContratacao;
            tooltipText = detalhe ? detalhe : 'Contratação Atrasada (informação adicional não disponível)';
        }
        // Trata os novos status 'EM CONTRATAÇÃO' e 'EM RENOVAÇÃO'
        else if (statusText.includes('EM CONTRATAÇÃO 🤝') || statusText.includes('EM RENOVAÇÃO 🔄')) {
            const detalhe = cell.dataset.detalheContratacaoRenovacao; 
            if (detalhe) {
                if (statusText.includes('EM RENOVAÇÃO 🔄')) {
                    if (/^\d+$/.test(detalhe)) {
                        tooltipText = `Faltam ${detalhe} dias para o Vencimento da Renovação.`;
                    } else {
                        tooltipText = detalhe;
                    }
                } else if (statusText.includes('EM CONTRATAÇÃO 🤝')) {
                    if (/^\d+$/.test(detalhe)) {
                        tooltipText = `Faltam ${detalhe} dias para a Contratação.`;
                    } else {
                        tooltipText = detalhe;
                    }
                }
            } else {
                tooltipText = 'Informação adicional não disponível (detalheContratacaoRenovacao ausente).';
            }
        }
        // Para os outros status da lista (que usam coluna L), usar o data-detalhe-status-geral
        else if (statusList.slice(2, 8).some(s => statusText.includes(s))) { 
            const detalhe = cell.dataset.detalheStatusGeral; 
            if (detalhe) {
                if (/^\d+$/.test(detalhe)) {
                    tooltipText = `Faltam ${detalhe} dias para a Autuação do Processo.`;
                } else {
                    tooltipText = detalhe;
                }
            } else {
                tooltipText = 'Informação adicional não disponível (detalheStatusGeral ausente).';
            }
        }

        if (tooltipText) {
            tooltip.textContent = tooltipText;
            tooltip.style.opacity = '1';

            const rect = cell.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            tooltip.style.top = (rect.top + scrollTop - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + scrollLeft + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        } else {
            tooltip.style.opacity = '0';
        }
    }

    function handleMouseLeave() {
        tooltip.style.opacity = '0';
    }

    // Iniciar observação da tabela
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        observer.observe(tbody, { childList: true, subtree: true });
    }

    // Escutar o evento customizado 'tabela-carregada' disparado por main.js
    document.addEventListener('tabela-carregada', () => {
        setupTooltips();
    });

    // Chamada inicial para o caso de a tabela já estar populada no DOMContentLoaded (improvável com fetch)
    setupTooltips(); 
});