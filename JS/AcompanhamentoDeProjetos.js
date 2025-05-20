/**
 * AcompanhamentoDeProjetos.js
 * 
 * Este script adiciona funcionalidade de acompanhamento aos projetos da tabela principal.
 * Ele busca informações na aba "ACOMPANHAMENTO" do CSV, identifica projetos correspondentes
 * e exibe um tooltip com as informações de acompanhamento mais recentes.
 * 
 * Funcionalidades:
 * - Recupera dados de acompanhamento do CSV
 * - Faz o matching entre os projetos da aba de acompanhamento e a tabela principal
 * - Adiciona o emoji 📩 aos projetos que possuem acompanhamento
 * - Exibe tooltip com data e detalhes do acompanhamento ao passar o mouse
 */

(function() {
    // URL para a aba de acompanhamento do CSV
    const ACOMPANHAMENTO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkrLcVYUAyDdf3XlecZ-qdperC8emYWp_5MCXXBG_SdrF5uGab5ugtebjA9iOWeDIbyC56s9jRGjcP/pub?gid=1961352255&single=true&output=csv';
    
    // Cache dos dados de acompanhamento para evitar download repetido
    let acompanhamentoData = null;
    
    // Mapa para armazenar as informações de acompanhamento por projeto
    const projetosComAcompanhamento = new Map();
    
    /**
     * Função principal que inicializa o processamento de acompanhamento
     */
    function initAcompanhamento() {
        console.log("Inicializando funcionalidade de acompanhamento de projetos...");
        
        // Criar elemento de tooltip que será reutilizado
        const tooltip = document.createElement('div');
        tooltip.className = 'status-tooltip';
        document.body.appendChild(tooltip);
        
        // Carregar dados de acompanhamento
        fetchAcompanhamentoData()
            .then(() => {
                console.log(`Dados de acompanhamento carregados. ${projetosComAcompanhamento.size} projetos encontrados.`);
                setupAcompanhamentoTooltips();
            })
            .catch(error => {
                console.error("Erro ao carregar dados de acompanhamento:", error);
            });
        
        // Adicionar listener para quando a tabela for atualizada
        document.addEventListener('tabela-carregada', () => {
            console.log("Tabela carregada, atualizando tooltips de acompanhamento...");
            setupAcompanhamentoTooltips();
        });
        
        // Observer para detectar mudanças na tabela
        const observer = new MutationObserver(() => {
            setupAcompanhamentoTooltips();
        });
        
        const tbody = document.querySelector('table tbody');
        if (tbody) {
            observer.observe(tbody, { childList: true, subtree: true });
        }
    }
    
    /**
     * Busca os dados da aba de acompanhamento e processa-os
     */
    function fetchAcompanhamentoData() {
        return new Promise((resolve, reject) => {
            if (acompanhamentoData) {
                processAcompanhamentoData(acompanhamentoData);
                resolve();
                return;
            }
            
            console.log("Buscando dados da aba de acompanhamento...");
            Papa.parse(ACOMPANHAMENTO_CSV_URL, {
                download: true,
                header: false,
                skipEmptyLines: true,
                complete: function(results) {
                    acompanhamentoData = results.data;
                    processAcompanhamentoData(acompanhamentoData);
                    resolve();
                },
                error: function(error) {
                    console.error("Erro ao baixar dados de acompanhamento:", error);
                    reject(error);
                }
            });
        });
    }
    
    /**
     * Converte uma data no formato DD/MM/AAAA para objeto Date
     * @param {string} dataStr - Data no formato DD/MM/AAAA
     * @returns {Date} - Objeto Date correspondente
     */
    function parseDataBrasileira(dataStr) {
        if (!dataStr) return new Date(0); // Data inválida
        
        // Verificar se a data está no formato brasileiro (DD/MM/AAAA)
        const regexData = /^(\d{2})\/(\d{2})\/(\d{4})/;
        const matchData = dataStr.match(regexData);
        
        if (matchData) {
            const dia = parseInt(matchData[1], 10);
            const mes = parseInt(matchData[2], 10) - 1; // Mês em JavaScript é 0-indexed
            const ano = parseInt(matchData[3], 10);
            
            if (dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11 && ano >= 1900) {
                return new Date(ano, mes, dia);
            }
        }
        
        // Tentar outros formatos comuns em sistemas brasileiros
        // Ex: "DD/MM/AAAA HH:MM:SS"
        const regexDataHora = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/;
        const matchDataHora = dataStr.match(regexDataHora);
        
        if (matchDataHora) {
            const dia = parseInt(matchDataHora[1], 10);
            const mes = parseInt(matchDataHora[2], 10) - 1;
            const ano = parseInt(matchDataHora[3], 10);
            const hora = parseInt(matchDataHora[4], 10);
            const minuto = parseInt(matchDataHora[5], 10);
            const segundo = matchDataHora[6] ? parseInt(matchDataHora[6], 10) : 0;
            
            if (dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11 && 
                ano >= 1900 && hora >= 0 && hora <= 23 && 
                minuto >= 0 && minuto <= 59 && segundo >= 0 && segundo <= 59) {
                return new Date(ano, mes, dia, hora, minuto, segundo);
            }
        }
        
        // Último recurso: tentar o parser nativo do JavaScript
        const data = new Date(dataStr);
        if (!isNaN(data.getTime())) {
            return data;
        }
        
        console.warn(`Formato de data não reconhecido: ${dataStr}`);
        return new Date(0);
    }
    
    /**
     * Processa os dados de acompanhamento, extraindo as informações relevantes
     * @param {Array} data - Dados brutos do CSV de acompanhamento
     */
    function processAcompanhamentoData(data) {
        // Limpar o mapa antes de processar novos dados
        projetosComAcompanhamento.clear();
        
        // Agrupar acompanhamentos por projeto
        const acompanhamentosPorProjeto = new Map();
        
        // Percorrer as linhas do CSV
        data.forEach((row, index) => {
            // Pular a primeira linha se for cabeçalho
            if (index === 0 && (row[0].toLowerCase().includes('data') || 
                               row[3].toLowerCase().includes('projeto'))) {
                return;
            }
            
            // Verificar se temos um nome de projeto válido na coluna D (índice 3)
            if (row.length > 6 && row[3]) {
                const nomeProjeto = cleanProjectName(row[3]);
                const dataAcompanhamento = row[0]; // Coluna A (data e hora)
                const detalhesAcompanhamento = row[6] || ""; // Coluna G (detalhes)
                
                if (nomeProjeto && dataAcompanhamento && detalhesAcompanhamento) {
                    // Adicionar ao mapa de acompanhamentos para esse projeto
                    if (!acompanhamentosPorProjeto.has(nomeProjeto)) {
                        acompanhamentosPorProjeto.set(nomeProjeto, []);
                    }
                    
                    acompanhamentosPorProjeto.get(nomeProjeto).push({
                        data: dataAcompanhamento,
                        detalhes: detalhesAcompanhamento,
                        dataObj: parseDataBrasileira(dataAcompanhamento) // Pré-calcular o objeto Date
                    });
                }
            }
        });
        
        // Para cada projeto, pegar o acompanhamento mais recente
        for (const [projeto, acompanhamentos] of acompanhamentosPorProjeto.entries()) {
            if (acompanhamentos.length > 0) {
                // Ordenar por data decrescente para pegar o mais recente
                acompanhamentos.sort((a, b) => {
                    // Usar os objetos Date pré-calculados para comparação
                    return b.dataObj.getTime() - a.dataObj.getTime();
                });
                
                // Log para debug
                console.log(`Projeto: ${projeto}, ${acompanhamentos.length} acompanhamentos encontrados`);
                console.log(`Mais recente: ${acompanhamentos[0].data} (${acompanhamentos[0].dataObj})`);
                
                // Adicionar o acompanhamento mais recente ao mapa final
                projetosComAcompanhamento.set(projeto, {
                    data: acompanhamentos[0].data,
                    detalhes: acompanhamentos[0].detalhes
                });
            }
        }
        
        console.log(`Total de projetos com acompanhamento: ${projetosComAcompanhamento.size}`);
    }
    
    /**
     * Limpa o nome do projeto removendo prefixos numéricos como "12.", "1.", "Novo", "1 ", "99 ", "101 "
     * @param {string} projetoName - Nome do projeto com prefixo
     * @returns {string} - Nome do projeto sem o prefixo
     */
    function cleanProjectName(projetoName) {
        if (!projetoName) return "";
        
        // Remover prefixos como "12.", "1." ou "Novo" ou "1 ", "99 ", "101 "
        return projetoName.replace(/^(\d+\.|\d+ |Novo\s+)/i, '').trim();
    }
    
    /**
     * Configura os tooltips de acompanhamento nas células da tabela
     */
    function setupAcompanhamentoTooltips() {
        // Selecionar todas as células da coluna "Projeto de Aquisição" (coluna 4)
        // e a coluna "Acompanhamento" (coluna 5) para cada linha
        const rows = document.querySelectorAll('table tbody tr');
        
        rows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(6)'); // Coluna de status (coluna 6)
            const projetoCell = row.querySelector('td:nth-child(4)'); // Coluna de projeto
            const acompanhamentoCell = row.querySelector('td:nth-child(5)'); // Coluna de acompanhamento
            
            if (!projetoCell || !acompanhamentoCell || !statusCell) return;
            
            // Verificar se o status é "CONTRATADO ✅" ou "RENOVADO ✅"
            const statusText = statusCell.textContent.trim();
            if (statusText.includes("CONTRATADO ✅") || statusText.includes("RENOVADO ✅")) {
                // Remover qualquer indicador de acompanhamento e tooltip
                if (acompanhamentoCell.textContent.includes('📩')) {
                    // Remover emoji de acompanhamento
                    acompanhamentoCell.innerHTML = acompanhamentoCell.innerHTML.replace('📩', '').trim();
                }
                
                // Remover classe e event listeners
                acompanhamentoCell.classList.remove('has-acompanhamento');
                acompanhamentoCell.removeEventListener('mouseenter', showAcompanhamentoTooltip);
                acompanhamentoCell.removeEventListener('mouseleave', hideAcompanhamentoTooltip);
                
                // Limpar atributos de dados
                delete acompanhamentoCell.dataset.acompanhamentoData;
                delete acompanhamentoCell.dataset.acompanhamentoDetalhes;
                
                return; // Pular o restante da lógica para esta linha
            }
            
            const nomeProjeto = projetoCell.textContent.trim();
            const projetoLimpo = cleanProjectName(nomeProjeto);
            
            // Verificar se este projeto tem acompanhamento
            if (projetosComAcompanhamento.has(projetoLimpo)) {
                const acompanhamento = projetosComAcompanhamento.get(projetoLimpo);
                
                // Adicionar emoji ao acompanhamento se ainda não tiver
                if (!acompanhamentoCell.textContent.includes('📩')) {
                    acompanhamentoCell.innerHTML += ' 📩';
                }
                
                // Configurar atributos data para usar no tooltip
                acompanhamentoCell.dataset.acompanhamentoData = acompanhamento.data;
                acompanhamentoCell.dataset.acompanhamentoDetalhes = acompanhamento.detalhes;
                
                // Adicionar classe para indicar que tem tooltip
                acompanhamentoCell.classList.add('has-acompanhamento');
                
                // Remover event listeners antigos (para evitar duplicação)
                acompanhamentoCell.removeEventListener('mouseenter', showAcompanhamentoTooltip);
                acompanhamentoCell.removeEventListener('mouseleave', hideAcompanhamentoTooltip);
                
                // Adicionar novos event listeners
                acompanhamentoCell.addEventListener('mouseenter', showAcompanhamentoTooltip);
                acompanhamentoCell.addEventListener('mouseleave', hideAcompanhamentoTooltip);
            } else {
                // Se não tem acompanhamento, garantir que não tem emoji ou classe
                if (acompanhamentoCell.textContent.includes('📩')) {
                    acompanhamentoCell.innerHTML = acompanhamentoCell.innerHTML.replace('📩', '').trim();
                }
                acompanhamentoCell.classList.remove('has-acompanhamento');
                acompanhamentoCell.removeEventListener('mouseenter', showAcompanhamentoTooltip);
                acompanhamentoCell.removeEventListener('mouseleave', hideAcompanhamentoTooltip);
            }
        });
    }
    
    /**
     * Mostra o tooltip com informações de acompanhamento
     * @param {Event} event - Evento de mouseenter
     */
    function showAcompanhamentoTooltip(event) {
        const cell = event.target;
        const data = cell.dataset.acompanhamentoData;
        const detalhes = cell.dataset.acompanhamentoDetalhes;
        
        if (data && detalhes) {
            // Extrair apenas a parte da data (DD/MM/AAAA) da string completa
            let dataFormatada = data;
            let diaDaSemana = "";
            let dataObj = null;
            
            // Usar regex para extrair apenas o formato DD/MM/AAAA
            const regexData = /(\d{2})\/(\d{2})\/(\d{4})/;
            const match = data.match(regexData);
            
            if (match) {
                // Se encontrou o padrão DD/MM/AAAA, use apenas essa parte
                dataFormatada = match[0]; // Mantém apenas DD/MM/AAAA
                
                // Criar objeto de data a partir da string DD/MM/AAAA
                const dia = parseInt(match[1], 10);
                const mes = parseInt(match[2], 10) - 1; // Mês em JavaScript é 0-indexed
                const ano = parseInt(match[3], 10);
                dataObj = new Date(ano, mes, dia);
            } else {
                // Se não encontrar o padrão, tenta converter para o formato desejado
                try {
                    dataObj = parseDataBrasileira(data);
                    if (!isNaN(dataObj.getTime())) {
                        dataFormatada = `${dataObj.getDate().toString().padStart(2, '0')}/${
                            (dataObj.getMonth()+1).toString().padStart(2, '0')}/${
                            dataObj.getFullYear()}`;
                    }
                } catch (e) {
                    console.warn("Erro ao formatar data:", e);
                }
            }
            
            // Obter o dia da semana se temos um objeto de data válido
            if (dataObj && !isNaN(dataObj.getTime())) {
                const diasDaSemana = [
                    "Domingo",
                    "Segunda-feira",
                    "Terça-feira",
                    "Quarta-feira",
                    "Quinta-feira",
                    "Sexta-feira",
                    "Sábado"
                ];
                diaDaSemana = diasDaSemana[dataObj.getDay()];
                dataFormatada = `${diaDaSemana}, ${dataFormatada}`;
            }
            
            const tooltip = document.querySelector('.status-tooltip');
            tooltip.textContent = `${dataFormatada}: ${detalhes}`;
            tooltip.style.opacity = '1';
            
            // Posicionar o tooltip acima do elemento
            const rect = cell.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
            
            tooltip.style.top = (rect.top + scrollTop - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + scrollLeft + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        }
    }
    
    /**
     * Esconde o tooltip de acompanhamento
     */
    function hideAcompanhamentoTooltip() {
        const tooltip = document.querySelector('.status-tooltip');
        tooltip.style.opacity = '0';
    }
    
    // Inicializar quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', initAcompanhamento);
})();