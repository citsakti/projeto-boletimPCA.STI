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
        'EM CONTRATAÇÃO 🤝',
        'EM RENOVAÇÃO 🔄'
    ];

    // Observa mudanças no corpo da tabela para manter as tags atualizadas
    const observer = new MutationObserver(function() {
        renderStatusTags();
    });

    // Calcula o texto detalhado (antes usado no tooltip) com base nos data-*
    function getDetalheTexto(cell, statusText) {
        let texto = '';

        if (statusText.includes('AUTUAÇÃO ATRASADA 💣')) {
            const detalhe = cell.dataset.detalheAutuacao;
            texto = detalhe ? detalhe : 'Autuação Atrasada (informação adicional não disponível)';
        }
        else if (statusText.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
            const detalhe = cell.dataset.detalheContratacao;
            texto = detalhe ? detalhe : 'Contratação Atrasada (informação adicional não disponível)';
        }
        else if (statusText.includes('EM CONTRATAÇÃO 🤝') || statusText.includes('EM RENOVAÇÃO 🔄')) {
            const detalhe = cell.dataset.detalheContratacaoRenovacao;
            if (detalhe) {
                if (statusText.includes('EM RENOVAÇÃO 🔄')) {
                    if (/^\d+$/.test(detalhe)) {
                        texto = `${detalhe} dias para o Vencimento da Renovação.`;
                    } else {
                        texto = detalhe;
                    }
                } else if (statusText.includes('EM CONTRATAÇÃO 🤝')) {
                    if (/^\d+$/.test(detalhe)) {
                        texto = `${detalhe} dias para a Contratação.`;
                    } else {
                        texto = detalhe;
                    }
                }
            } else {
                texto = 'Informação adicional não disponível (detalheContratacaoRenovacao ausente).';
            }
        }
        else if (statusList.slice(2, 8).some(s => statusText.includes(s))) {
            const detalhe = cell.dataset.detalheStatusGeral;
            if (detalhe) {
                if (/^\d+$/.test(detalhe)) {
                    texto = `${detalhe} dias para a Autuação do Processo.`;
                } else {
                    texto = detalhe;
                }
            } else {
                texto = 'Informação adicional não disponível (detalheStatusGeral ausente).';
            }
        }

        return texto;
    }

    // Garante inserção idempotente da tag na célula (abaixo do conteúdo)
    function applyTagToCell(cell, texto, highlightSpan) {
        const oldContainer = cell.querySelector('.status-detalhe-container');

        // Captura cores do highlight para aplicar na tag
        let bg = '', fg = '';
        if (highlightSpan && window.getComputedStyle) {
            const cs = window.getComputedStyle(highlightSpan);
            bg = cs && cs.backgroundColor || '';
            fg = cs && cs.color || '';
        }

        // Se não há texto a exibir, remova o container (se existir) e encerre
        if (!texto) {
            if (oldContainer) oldContainer.remove();
            return;
        }

        // Se já existir com o mesmo conteúdo, não faça nada (idempotente)
        if (oldContainer) {
            const oldTag = oldContainer.querySelector('.status-detalhe-tag');
            if (oldTag && oldTag.textContent === texto) {
                // Atualiza somente cores se necessário
                if (bg) {
                    oldTag.style.background = bg;
                    oldTag.style.borderColor = bg;
                }
                if (fg) oldTag.style.color = fg;
                return; // nada mais a atualizar
            }
            // Atualiza apenas o texto existente e as cores para evitar childList mutations
            if (oldTag) {
                oldTag.textContent = texto;
                if (bg) {
                    oldTag.style.background = bg;
                    oldTag.style.borderColor = bg;
                }
                if (fg) oldTag.style.color = fg;
                return;
            }
            // Se não houver a tag interna, remove para recriar corretamente
            oldContainer.remove();
        }

        // Criar um span container para garantir quebra de linha e evitar duplicação
        const container = document.createElement('span');
        container.className = 'status-detalhe-container';
        // Força a ficar abaixo do conteúdo sem alterar estilos do status original
        container.style.display = 'block';
        container.style.marginTop = '4px';

        // Criar a tag azul reutilizando o estilo existente
        const tag = document.createElement('span');
        tag.className = 'tempo-acompanhamento-tag tempo-padrao status-detalhe-tag';
        tag.textContent = texto;
        // Aplica cores herdadas do highlight do status
        if (bg) {
            tag.style.background = bg;
            tag.style.borderColor = bg;
        }
        if (fg) tag.style.color = fg;

        container.appendChild(tag);
        cell.appendChild(container);
    }

    // Renderiza as tags nas células de Status do Processo
    function renderStatusTags() {
        // Desconecta o observer durante a renderização para evitar loop por mutações próprias
        const tbodyEl = document.querySelector('table tbody');
        if (tbodyEl) observer.disconnect();

        try {
            const statusCells = document.querySelectorAll('table tbody tr td:nth-child(6)');

            statusCells.forEach(cell => {
                // Aguarda a aplicação de highlight pelo StatusClasses.js para não afetar o mapeamento
                const highlightSpan = cell.querySelector('[class$="-highlight"]');
                const statusText = (highlightSpan ? highlightSpan.textContent : cell.textContent).trim();
                const foundStatus = statusList.find(status => statusText.includes(status));

                if (foundStatus) {
                    cell.classList.add('status-atrasado');
                    // Só injeta a tag após o highlight existir, evitando quebrar o mapeamento de estilos
                    if (highlightSpan) {
                        const detalheTexto = getDetalheTexto(cell, statusText);
                        applyTagToCell(cell, detalheTexto, highlightSpan);
                    }
                } else {
                    cell.classList.remove('status-atrasado');
                    // Remove qualquer tag previamente inserida se não for mais aplicável
                    const oldContainer = cell.querySelector('.status-detalhe-container');
                    if (oldContainer) oldContainer.remove();
                }
            });
        } finally {
            // Reativa a observação
            if (tbodyEl) observer.observe(tbodyEl, { childList: true, subtree: true });
        }
    }

    // Iniciar observação da tabela
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        observer.observe(tbody, { childList: true, subtree: true });
    }

    // Reagir ao evento customizado de montagem da tabela
    document.addEventListener('tabela-carregada', () => {
        renderStatusTags();
    });

    // Sem render inicial para não interferir no mapeamento de estilos de StatusClasses.js
});