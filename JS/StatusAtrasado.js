document.addEventListener('DOMContentLoaded', function() {
    console.log('StatusAtrasado.js carregado'); // Log para debug

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
        console.log('Tabela atualizada, aplicando tooltips'); // Log para debug
    });

    // Configuração inicial do tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'status-tooltip';
    document.body.appendChild(tooltip);

    // Função para configurar os tooltips
    function setupTooltips() {
        // Selecionar todas as células da coluna "Status do Processo" (coluna 6, índice 5 na tabela HTML)
        const statusCells = document.querySelectorAll('table tbody tr td:nth-child(6)');
        console.log('Células de status encontradas:', statusCells.length); // Log para debug

        statusCells.forEach(cell => {
            // Verificar se contém algum dos status definidos
            const foundStatus = statusList.find(status => cell.textContent.includes(status));
            if (foundStatus) {
                console.log('Status especial encontrado:', cell.textContent); // Log para debug

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
        console.log('--- handleMouseEnter ---');
        console.log('Célula atual:', statusText);

        if (statusText.includes('AUTUAÇÃO ATRASADA 💣')) {
            console.log('Status: AUTUAÇÃO ATRASADA 💣');
            const detalhe = cell.dataset.detalheAutuacao;
            tooltipText = detalhe ? detalhe : 'Autuação Atrasada (informação adicional não disponível)';
            console.log('Detalhe Autuação:', detalhe, 'Tooltip:', tooltipText);
        } 
        else if (statusText.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
            console.log('Status: CONTRATAÇÃO ATRASADA ⚠️');
            const detalhe = cell.dataset.detalheContratacao;
            tooltipText = detalhe ? detalhe : 'Contratação Atrasada (informação adicional não disponível)';
            console.log('Detalhe Contratação:', detalhe, 'Tooltip:', tooltipText);
        }
        // Trata os novos status 'EM CONTRATAÇÃO' e 'EM RENOVAÇÃO'
        else if (statusText.includes('EM CONTRATAÇÃO 🤝') || statusText.includes('EM RENOVAÇÃO 🔄')) {
            console.log('Status: EM CONTRATAÇÃO/RENOVAÇÃO (tentando data-detalhe-contratacao-renovacao)');
            const detalhe = cell.dataset.detalheContratacaoRenovacao; 
            if (detalhe) {
                if (/^\d+$/.test(detalhe)) {
                    tooltipText = `Faltam ${detalhe} dias para a Contratação.`;
                } else {
                    tooltipText = detalhe;
                }
            } else {
                tooltipText = 'Informação adicional não disponível (detalheContratacaoRenovacao ausente).';
            }
            console.log('Detalhe Contratação/Renovação:', detalhe, 'Tooltip:', tooltipText);
        }
        // Para os outros status da lista (que usam coluna L), usar o data-detalhe-status-geral
        // Ajustado o slice para pegar os status de índice 2 a 7 da statusList
        else if (statusList.slice(2, 8).some(s => statusText.includes(s))) { 
            console.log('Status: Outro relevante (tentando data-detalhe-status-geral)');
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
            console.log('Detalhe Status Geral:', detalhe, 'Tooltip:', tooltipText);
        }
        else {
            // Para status não mapeados na statusList, não mostrar tooltip específico
            console.log('Status não especial ou não mapeado para tooltip detalhado.');
            // tooltipText = ''; // Garante que nenhum tooltip seja mostrado
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
        console.log('--- Fim handleMouseEnter ---');
    }

    function handleMouseLeave() {
        tooltip.style.opacity = '0';
    }

    // Iniciar observação da tabela
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        observer.observe(tbody, { childList: true, subtree: true });
        console.log('Observer configurado para a tabela'); // Log para debug
    }

    // Escutar o evento customizado 'tabela-carregada' disparado por main.js
    document.addEventListener('tabela-carregada', () => {
        console.log('Evento tabela-carregada recebido, aplicando tooltips em StatusAtrasado.js');
        setupTooltips();
    });

    // Chamada inicial para o caso de a tabela já estar populada no DOMContentLoaded (improvável com fetch)
    setupTooltips(); 
});