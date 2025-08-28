/**
 * AcompanhamentoDeProjetos.js - Sistema de acompanhamento de projetos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Buscar informações da aba "ACOMPANHAMENTO" do CSV para projetos na tabela principal
 *  - Exibir tooltips com informações de acompanhamento ao passar o mouse sobre os projetos
 *  - Identificar visualmente projetos que possuem acompanhamento com um indicador (📩)
 *  - Integrar dados de acompanhamento com a interface do usuário
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Dados:
 *   - URL CSV: Endereço da aba de acompanhamento na planilha Google Sheets
 *   - Cache: Armazena dados de acompanhamento para evitar download repetido
 *   - Mapa: Relaciona identificadores de projeto às informações de acompanhamento
 * 
 * # Funções Principais:
 *   - initAcompanhamento(): Inicializa o processamento de acompanhamento
 *   - fetchAcompanhamentoData(): Busca os dados da aba de acompanhamento
 *   - processarAcompanhamento(): Processa os dados e marca os projetos correspondentes
 *   - adicionarTooltips(): Configura tooltips nas células marcadas
 * 
 * # Fluxo de Execução:
 *   1. Inicia após o carregamento do DOM
 *   2. Busca dados de acompanhamento do CSV
 *   3. Faz o matching entre os projetos da tabela e os dados de acompanhamento
 *   4. Adiciona o emoji 📩 aos projetos que possuem acompanhamento
 *   5. Configura tooltips para exibir detalhes ao passar o mouse
 * 
 * # Dependências:
 *   - PapaParse para processamento de CSV
 *   - Estrutura da tabela principal para identificação de projetos
 *   - Evento 'tabela-carregada' para aplicação em atualizações dinâmicas
 */

(function() {
    // URL inicial (será atualizada dinamicamente pelo YearSelector via getYearUrls)
    // Mantemos valor placeholder para evitar chamadas prematuras antes do seletor carregar
    let ACOMPANHAMENTO_CSV_URL = 'about:blank';
    // Backup atual (atualizado a cada seleção de ano)
    let ACOMPANHAMENTO_CSV_URL_BACKUP = null;

    // Expor globalmente (principal e backup) para referência externa/debug
    window.ACOMPANHAMENTO_CSV_URL = ACOMPANHAMENTO_CSV_URL;
    window.ACOMPANHAMENTO_CSV_URL_BACKUP = ACOMPANHAMENTO_CSV_URL_BACKUP;
    // Cache dos dados de acompanhamento para evitar download repetido
    let acompanhamentoData = null;
    
    // Mapa para armazenar as informações de acompanhamento por projeto
    const projetosComAcompanhamento = new Map();
    
    // Mapa para guardar o estado anterior para comparação de notificações
    let dadosAcompanhamentoAnterioresParaNotificacao = new Map();
    let isFirstLoadAcompanhamento = true; // Sinalizador para a primeira carga
    
    // Intervalo para atualização automática do acompanhamento (em milissegundos). Ex: 3 minutos.
    const INTERVALO_ATUALIZACAO_ACOMPANHAMENTO = 3 * 60 * 1000;

    /**
     * Função principal que inicializa o processamento de acompanhamento
     */
    function initAcompanhamento() {
        console.log("Inicializando funcionalidade de acompanhamento de projetos...");
        
        // Criar elemento de tooltip que será reutilizado
        const tooltip = document.createElement('div');
        tooltip.className = 'status-tooltip';
        document.body.appendChild(tooltip);
        
        // Função para buscar e aplicar atualizações de acompanhamento
        async function verificarAtualizacoesAcompanhamento() {
            console.log("Verificando atualizações de dados de acompanhamento...");

            if (isFirstLoadAcompanhamento) {
                try {
                    await fetchAcompanhamentoData(true); // Carrega os dados iniciais
                    // Após a primeira carga bem-sucedida, copia os dados para 'dadosAcompanhamentoAnterioresParaNotificacao'
                    // para que a próxima verificação tenha uma base de comparação.
                    dadosAcompanhamentoAnterioresParaNotificacao = new Map(projetosComAcompanhamento);
                    isFirstLoadAcompanhamento = false; // Marca que a primeira carga foi concluída
                    console.log("Dados de acompanhamento iniciais carregados. Notificações de mudança ativadas para verificações futuras.");
                    setupAcompanhamentoTooltips(); // Aplica tooltips com os dados iniciais
                } catch (error) {
                    console.error("Erro ao carregar dados de acompanhamento iniciais:", error);
                }
                return; // Não compara nem notifica na primeira carga
            }
        
            // Lógica para verificações subsequentes (não é a primeira carga)
            // Usa o estado da última verificação/carga bem-sucedida como base para comparação.
            const dadosAnteriores = new Map(dadosAcompanhamentoAnterioresParaNotificacao); 

            try {
                await fetchAcompanhamentoData(true); // Força o refresh, atualiza \'projetosComAcompanhamento\' internamente

                // \'projetosComAcompanhamento\' agora tem os dados mais recentes.
                // \'dadosAnteriores\' tem os dados de antes desta chamada.
                const mudancas = compararDadosAcompanhamento(dadosAnteriores, projetosComAcompanhamento);

                if (mudancas.length > 0) {
                    const mensagemHtml = formatarMensagemMudancasAcompanhamento(mudancas);
                    
                    const modalOverlay = document.getElementById('update-notification-overlay');
                    const modalDetails = document.getElementById('update-notification-details');
                    
                    if (modalOverlay && modalDetails) {
                        modalDetails.innerHTML = "<h2>Atualizações de Acompanhamento de Projetos</h2>" + mensagemHtml;
                        modalOverlay.style.display = 'flex';
                    } else {
                         const alertText = mensagemHtml.replace(/<[^>]*>?/gm, '\\n').replace(/\\n\\n+/g, '\\n').trim();
                         alert("Atualizações de Acompanhamento:\\n" + alertText);
                    }
                    console.log(`Dados de acompanhamento atualizados. ${mudancas.length} alterações encontradas e notificadas.`);
                } else {
                    console.log("Nenhuma nova atualização de acompanhamento detectada desde a última verificação.");
                }

                // Atualiza o 'dadosAcompanhamentoAnterioresParaNotificacao' com os dados mais recentes para a próxima comparação.
                dadosAcompanhamentoAnterioresParaNotificacao = new Map(projetosComAcompanhamento);
                setupAcompanhamentoTooltips(); // Reaplicar tooltips e ícones
            } catch (error) {
                console.error("Erro ao atualizar dados de acompanhamento subsequente:", error);
            }
        }

        // Carregar dados de acompanhamento inicialmente
        verificarAtualizacoesAcompanhamento();
        
        // Configurar atualização automática periódica para o acompanhamento
        setInterval(verificarAtualizacoesAcompanhamento, INTERVALO_ATUALIZACAO_ACOMPANHAMENTO);

        // Adicionar listener para quando a tabela for atualizada por outros scripts
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
     * @param {boolean} forceRefresh - Se true, ignora o cache e busca os dados novamente.
     */
    function fetchAcompanhamentoData(forceRefresh = false) {
        return new Promise((resolve, reject) => {
            // Atualiza URLs conforme ano selecionado
            if (window.getYearUrls && typeof window.getYearUrls === 'function') {
                const urls = window.getYearUrls();
                ACOMPANHAMENTO_CSV_URL = urls.acompanhamento;
                ACOMPANHAMENTO_CSV_URL_BACKUP = urls.acompanhamentoBackup;
                window.ACOMPANHAMENTO_CSV_URL = ACOMPANHAMENTO_CSV_URL;
                window.ACOMPANHAMENTO_CSV_URL_BACKUP = ACOMPANHAMENTO_CSV_URL_BACKUP;
            }

            if (acompanhamentoData && !forceRefresh) {
                processAcompanhamentoData(acompanhamentoData);
                resolve();
                return;
            }

            console.log("Buscando dados da aba de acompanhamento (" + (forceRefresh ? 'refresh forçado' : 'primeira carga') + ")...");

            const papaBase = { header: false, skipEmptyLines: true };
            const exec = (typeof window.fetchCsvWithFallback === 'function')
                ? window.fetchCsvWithFallback(ACOMPANHAMENTO_CSV_URL, ACOMPANHAMENTO_CSV_URL_BACKUP, papaBase)
                : new Promise((res, rej) => {
                    Papa.parse(ACOMPANHAMENTO_CSV_URL, { download: true, ...papaBase, complete: r=>res({urlUsed: ACOMPANHAMENTO_CSV_URL, results: r}), error: rej });
                });

            exec.then(({ results, urlUsed }) => {
                acompanhamentoData = results.data || [];
                console.info('Acompanhamento carregado via', urlUsed && urlUsed.includes('script.google') ? 'backup' : 'primário');
                processAcompanhamentoData(acompanhamentoData);
                resolve();
            }).catch(error => {
                console.error('Erro ao baixar dados de acompanhamento (incluindo fallback):', error);
                reject(error);
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
        
        // Disparar evento para notificar que os dados de acompanhamento foram atualizados
        document.dispatchEvent(new CustomEvent('acompanhamento-updated', {
            detail: {
                totalProjetos: projetosComAcompanhamento.size,
                timestamp: new Date()
            }
        }));
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
        
        // Data atual para comparação
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Normaliza para início do dia
        
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
                
                // Verificar se o acompanhamento é de até 6 dias atrás
                const dataAcompanhamento = parseDataBrasileira(acompanhamento.data);
                dataAcompanhamento.setHours(0, 0, 0, 0); // Normaliza para início do dia
                
                // Calcular a diferença em dias
                const diferencaDias = Math.floor((hoje - dataAcompanhamento) / (1000 * 60 * 60 * 24));
                
                // Só mostrar se for até 6 dias atrás
                if (diferencaDias <= 6) {
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
                    // Acompanhamento tem mais de 6 dias, remover o emoji e listeners
                    if (acompanhamentoCell.textContent.includes('📩')) {
                        acompanhamentoCell.innerHTML = acompanhamentoCell.innerHTML.replace('📩', '').trim();
                    }
                    acompanhamentoCell.classList.remove('has-acompanhamento');
                    acompanhamentoCell.removeEventListener('mouseenter', showAcompanhamentoTooltip);
                    acompanhamentoCell.removeEventListener('mouseleave', hideAcompanhamentoTooltip);
                }
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
        
        // Após modificar o DOM, reaplica a alternância de cores
        if (typeof window.alternaCoresLinhas === 'function') {
            window.alternaCoresLinhas();
        }
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
    
    /**
     * Compara os dados de acompanhamento antigos e novos para detectar mudanças.
     * @param {Map} mapaAntigo - Mapa com os dados de acompanhamento anteriores.
     * @param {Map} mapaNovo - Mapa com os dados de acompanhamento atuais.
     * @returns {Array} - Array de objetos descrevendo as mudanças.
     */
    function compararDadosAcompanhamento(mapaAntigo, mapaNovo) {
        const mudancasDetectadas = [];

        // Verificar novos acompanhamentos ou atualizados
        for (const [projeto, novoAcomp] of mapaNovo.entries()) {
            const antigoAcomp = mapaAntigo.get(projeto);
            if (!antigoAcomp) {
                // Verifica se o acompanhamento é recente (até 6 dias) antes de notificar como novo
                const dataAcompanhamento = parseDataBrasileira(novoAcomp.data);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                dataAcompanhamento.setHours(0, 0, 0, 0);
                const diferencaDias = Math.floor((hoje - dataAcompanhamento) / (1000 * 60 * 60 * 24));

                if (diferencaDias <= 6) {
                    mudancasDetectadas.push({ tipo: 'novo', projeto, acompanhamento: novoAcomp });
                }
            } else {
                if (antigoAcomp.data !== novoAcomp.data || antigoAcomp.detalhes !== novoAcomp.detalhes) {
                    // Verifica se o acompanhamento atualizado é recente
                    const dataAcompanhamento = parseDataBrasileira(novoAcomp.data);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    dataAcompanhamento.setHours(0, 0, 0, 0);
                    const diferencaDias = Math.floor((hoje - dataAcompanhamento) / (1000 * 60 * 60 * 24));

                    if (diferencaDias <= 6) {
                         mudancasDetectadas.push({ tipo: 'atualizado', projeto, acompanhamento: novoAcomp, anterior: antigoAcomp });
                    }
                }
            }
        }
        return mudancasDetectadas;
    }

    /**
     * Formata as mudanças detectadas em HTML para exibição.
     * @param {Array} mudancas - Array de objetos de mudança.
     * @returns {string} - String HTML formatada.
     */
    function formatarMensagemMudancasAcompanhamento(mudancas) {
        if (mudancas.length === 0) return "";

        let html = "<ul>";
        mudancas.forEach(m => {
            const detalhesLimpos = m.acompanhamento.detalhes.replace(/<[^>]*>?/gm, ''); // Sanitiza detalhes
            switch (m.tipo) {
                case 'novo':
                    html += `<li><strong>Novo Acompanhamento:</strong> Projeto "${m.projeto}"<br/><em>Data:</em> ${m.acompanhamento.data}<br/><em>Detalhes:</em> ${detalhesLimpos}</li>`;
                    break;
                case 'atualizado':
                    html += `<li><strong>Acompanhamento Atualizado:</strong> Projeto "${m.projeto}"<br/><em>Nova Data:</em> ${m.acompanhamento.data}<br/><em>Novos Detalhes:</em> ${detalhesLimpos}</li>`;
                    break;
            }
        });
        html += "</ul>";
        return html;
    }    /**
     * Função pública para verificar se um projeto possui acompanhamento
     * @param {string} nomeProjeto - Nome do projeto para verificar
     * @returns {Object|null} - Dados de acompanhamento ou null se não houver
     */
    function getAcompanhamentoProjeto(nomeProjeto) {
        if (!nomeProjeto) return null;
        
        const projetoLimpo = cleanProjectName(nomeProjeto);
        
        if (projetosComAcompanhamento.has(projetoLimpo)) {
            const acompanhamento = projetosComAcompanhamento.get(projetoLimpo);
            
            // Verificar se o acompanhamento é de até 6 dias atrás
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataAcompanhamento = parseDataBrasileira(acompanhamento.data);
            dataAcompanhamento.setHours(0, 0, 0, 0);
            
            const diferencaDias = Math.floor((hoje - dataAcompanhamento) / (1000 * 60 * 60 * 24));
            
            // Só retorna se for até 6 dias atrás
            if (diferencaDias <= 6) {
                return {
                    data: acompanhamento.data,
                    detalhes: acompanhamento.detalhes,
                    diasAtras: diferencaDias
                };
            }
        }
        
        return null;
    }
    
    /**
     * Função pública para verificar se um projeto deve ter acompanhamento bloqueado por status
     * @param {string} status - Status do projeto
     * @returns {boolean} - True se o acompanhamento deve ser bloqueado
     */
    function isAcompanhamentoBloqueadoPorStatus(status) {
        return status && (status.includes("CONTRATADO ✅") || status.includes("RENOVADO ✅"));
    }
    
    // Expor funções para uso externo
    window.AcompanhamentoDeProjetos = {
        getAcompanhamentoProjeto: getAcompanhamentoProjeto,
        isAcompanhamentoBloqueadoPorStatus: isAcompanhamentoBloqueadoPorStatus,
        parseDataBrasileira: parseDataBrasileira
    };

    // Inicializar quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', initAcompanhamento);
})();