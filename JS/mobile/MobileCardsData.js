/**
 * MobileCardsData.js - Processamento e manipulação de dados para os cards mobile
 * 
 * Este módulo é responsável por:
 * - Carregar dados da tabela
 * - Processar informações de acompanhamento
 * - Adicionar informações de status para tooltips
 * - Ordenar dados
 */

class MobileCardsData {
    constructor() {
        // Lista de status especiais para tooltips (similar ao StatusAtrasado.js)
        this.statusList = [
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
    }

    /**
     * Carrega dados da tabela e os converte para formato de cards
     * @returns {Array} - Array de objetos com dados dos projetos
     */
    loadTableData() {
        const table = document.querySelector('table tbody');
        if (!table) return [];
        
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 10) return null;
            
            // Extrai a data para ordenação
            let contratarAteDate = null;
            const contratarAteText = cells[6]?.textContent?.trim();
            if (contratarAteText) {
                const parts = contratarAteText.split('/');
                if (parts.length === 3) {
                    contratarAteDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            let item = {
                id: index,
                idPca: cells[0]?.textContent?.trim() || '',
                area: cells[1]?.textContent?.trim() || '',
                tipo: cells[2]?.textContent?.trim() || '',
                projeto: cells[3]?.textContent?.trim() || '',
                acompanhamento: cells[4]?.textContent?.trim() || '',
                status: cells[5]?.textContent?.trim() || '',
                contratarAte: contratarAteText || '',                contratarAteDate: contratarAteDate, // Para ordenação
                valorPca: cells[7]?.getAttribute('data-valor-original') || cells[7]?.textContent?.trim() || '', // Valor total original do CSV
                orcamento: cells[8]?.textContent?.trim() || '',
                processo: cells[9]?.textContent?.replace('🔗', '').trim() || '', // Remove emoji duplicado da tabela
                row: row
            };
            
            // Adicionar informações de acompanhamento
            item = this.addAcompanhamentoInfo(item);
            
            // Adicionar informações de status para tooltips
            item = this.addStatusInfo(item);
            
            return item;
        }).filter(item => item !== null && item.status !== 'CANCELADO ❌'); // Remove cancelados
    }

    /**
     * Adiciona informações de acompanhamento aos dados do projeto
     * @param {Object} item - Item de projeto
     * @returns {Object} - Item com informações de acompanhamento adicionadas
     */
    addAcompanhamentoInfo(item) {
        // Verificar se o sistema de acompanhamento está disponível
        if (!window.AcompanhamentoDeProjetos) {
            return item;
        }
        
        // Verificar se o projeto tem acompanhamento bloqueado por status
        if (window.AcompanhamentoDeProjetos.isAcompanhamentoBloqueadoPorStatus(item.status)) {
            item.hasAcompanhamento = false;
            item.acompanhamentoData = null;
            return item;
        }
        
        // Buscar dados de acompanhamento para o projeto
        const acompanhamento = window.AcompanhamentoDeProjetos.getAcompanhamentoProjeto(item.projeto);
        
        if (acompanhamento) {
            item.hasAcompanhamento = true;
            item.acompanhamentoData = acompanhamento;
        } else {
            item.hasAcompanhamento = false;
            item.acompanhamentoData = null;
        }
        
        return item;
    }

    /**
     * Adiciona informações de status aos dados do projeto para tooltips
     * @param {Object} item - Item de projeto
     * @returns {Object} - Item com informações de status adicionadas
     */
    addStatusInfo(item) {
        if (!item.row) return item;
        
        const statusCell = item.row.querySelector('td:nth-child(6)'); // Coluna de status
        if (!statusCell) return item;
        
        const statusText = item.status;
        let tooltipText = '';
        let hasStatusTooltip = false;
        
        // Verificar se é um status especial que precisa de tooltip
        const foundStatus = this.statusList.find(status => statusText.includes(status));
        
        if (foundStatus) {
            hasStatusTooltip = true;
            
            if (statusText.includes('AUTUAÇÃO ATRASADA 💣')) {
                const detalhe = statusCell.dataset.detalheAutuacao;
                tooltipText = detalhe ? detalhe : 'Autuação Atrasada (informação adicional não disponível)';
            } 
            else if (statusText.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
                const detalhe = statusCell.dataset.detalheContratacao;
                tooltipText = detalhe ? detalhe : 'Contratação Atrasada (informação adicional não disponível)';
            }
            // Trata os status 'EM CONTRATAÇÃO' e 'EM RENOVAÇÃO'
            else if (statusText.includes('EM CONTRATAÇÃO 🤝') || statusText.includes('EM RENOVAÇÃO 🔄')) {
                const detalhe = statusCell.dataset.detalheContratacaoRenovacao; 
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
            // Para os outros status da lista, usar o data-detalhe-status-geral
            else if (this.statusList.slice(2, 8).some(s => statusText.includes(s))) { 
                const detalhe = statusCell.dataset.detalheStatusGeral; 
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
        }
        
        // Adicionar informações ao item
        item.hasStatusTooltip = hasStatusTooltip;
        item.statusTooltipText = tooltipText;
        
        return item;
    }

    /**
     * Ordena os dados priorizando projetos ativos e por data de contratação
     * @param {Array} data - Array de dados para ordenar
     * @returns {Array} - Array ordenado
     */
    sortData(data) {
        return data.sort((a, b) => {
            const statusA = a.status.toUpperCase();
            const statusB = b.status.toUpperCase();
            const isAConcluido = statusA.includes('CONTRATADO') || statusA.includes('RENOVADO') || statusA.includes('CONCLUÍDO');
            const isBConcluido = statusB.includes('CONTRATADO') || statusB.includes('RENOVADO') || statusB.includes('CONCLUÍDO');

            if (isAConcluido && !isBConcluido) {
                return 1; // Mover A para o final
            }
            if (!isAConcluido && isBConcluido) {
                return -1; // Mover B para o final
            }

            const dateA = a.contratarAteDate;
            const dateB = b.contratarAteDate;

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1; 
            if (!dateB) return -1;

            // Ordenar por data mais antiga primeiro (ascendente)
            return dateA - dateB;
        });
    }

    /**
     * Aplica filtros aos dados
     * @param {Array} data - Dados originais
     * @param {Object} filters - Objeto com filtros aplicados
     * @returns {Array} - Dados filtrados
     */
    applyFilters(data, filters) {
        return data.filter(item => {
            return (!filters.area || item.area.includes(filters.area)) &&
                   (!filters.status || item.status.includes(filters.status)) &&
                   (!filters.tipo || item.tipo.includes(filters.tipo)) &&
                   (!filters.projeto || item.projeto.toLowerCase().includes(filters.projeto.toLowerCase()));
        });
    }

    /**
     * Extrai opções únicas para filtros
     * @param {Array} data - Dados dos projetos
     * @returns {Object} - Objeto com arrays de opções para cada filtro
     */
    extractFilterOptions(data) {
        return {
            areas: [...new Set(data.map(item => item.area))].sort(),
            statuses: [...new Set(data.map(item => item.status))].sort(),
            tipos: [...new Set(data.map(item => item.tipo))].sort(),
            projetos: [...new Set(data.map(item => item.projeto))].sort()
        };
    }
}

// Exportar para uso global
window.MobileCardsData = MobileCardsData;

console.log('MobileCardsData.js carregado');
