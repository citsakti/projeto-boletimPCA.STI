/**
 * StatusAtrasado.js - Sistema de Tooltips e Alertas Visuais do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Adicionar tooltips informativos aos status de processo
 *  - Destacar visualmente células da tabela com status de atraso ou especiais
 *  - Reagir dinamicamente a alterações na tabela
 *  - Exibir detalhes contextuais sobre cada status ao passar o mouse
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Elemento tooltip: Exibição flutuante com informações detalhadas
 *   - Marcação visual: Classe CSS aplicada às células com status especiais
 *   - Observer: Monitora mudanças na tabela para manter tooltips atualizados
 * 
 * # Funções Principais:
 *   - setupTooltips(): Configura tooltips para células de status especiais
 *   - handleMouseEnter(): Exibe tooltip com detalhes específicos do status
 *   - handleMouseLeave(): Oculta o tooltip quando o mouse sai da célula
 * 
 * # Fluxo de Execução:
 *   1. Define uma lista de status especiais a serem destacados
 *   2. Cria um observer para monitorar mudanças na tabela
 *   3. Cria dinamicamente um elemento de tooltip no body da página
 *   4. Para cada célula da coluna de status, aplica classes e listeners quando necessário
 *   5. O conteúdo do tooltip é definido conforme o status e atributos data-*
 *   6. O script responde ao evento customizado 'tabela-carregada'
 * 
 * # Personalização de Tooltips:
 *   - AUTUAÇÃO ATRASADA: Usa data-detalhe-autuacao
 *   - CONTRATAÇÃO ATRASADA: Usa data-detalhe-contratacao
 *   - EM CONTRATAÇÃO/RENOVAÇÃO: Usa data-detalhe-contratacao-renovacao
 *   - Outros status: Usa data-detalhe-status-geral
 * 
 * # Dependências:
 *   - Tabela DOM com <tbody> e coluna de status (6ª coluna, índice 5)
 *   - Atributos data-* nas células para informações detalhadas
 *   - Evento customizado 'tabela-carregada' disparado por main.js
 *   - CSS para a classe 'status-atrasado' e 'status-tooltip'
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