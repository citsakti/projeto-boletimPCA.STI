/**
 * AtualizacaoAutomatica.js - Sistema de atualização automática do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Verificar periodicamente se houve atualizações nos dados da planilha Google Sheets
 *  - Comparar os dados atuais com os mais recentes para detectar alterações
 *  - Notificar o usuário sobre mudanças através de um modal interativo
 *  - Atualizar a tabela dinamicamente sem necessidade de recarregar a página
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Dados:
 *   - Dados originais: Estado atual da tabela no DOM
 *   - Dados novos: Obtidos do CSV em tempo real
 *   - Intervalo de verificação: 5 minutos (300.000ms)
 * 
 * # Funções Principais:
 *   - fetchRawData(): Busca os dados brutos do CSV e processa
 *   - compareData(): Compara dados antigos e novos, identificando mudanças
 *   - showUpdateModal(): Exibe modal com detalhes das alterações detectadas
 *   - updateTable(): Atualiza a tabela no DOM com os novos dados
 *   - initAutoUpdate(): Inicia o ciclo de verificação automática
 * 
 * # Fluxo de Execução:
 *   1. Inicia após o carregamento completo da tabela
 *   2. A cada 5 minutos, verifica se há alterações na fonte de dados
 *   3. Se detectar alterações, notifica o usuário com detalhes das mudanças
 *   4. Permite atualização manual ou automática dos dados
 *   5. Reinicia o ciclo de verificação após cada atualização
 * 
 * # Lógica de Negócio:
 *   - Análise linha a linha e célula a célula para detectar alterações precisas
 *   - Categorização de mudanças (projetos novos, alterados, etc.)
 *   - Manipulação do DOM para atualização sem reload da página
 * 
 * # Dependências:
 *   - PapaParse para processamento de CSV
 *   - fetchAndPopulate (definida em main.js) para atualização da tabela
 *   - Modal HTML para exibição de notificações
 *
 * - showUpdateNotificationModal(htmlContent) / hideUpdateNotificationModal():
 *      Exibe ou oculta o modal de notificação de atualização para o usuário.
 *      Insere conteúdo HTML dinâmico descrevendo as mudanças detectadas.
 *
 * - checkForUpdates():
 *      Função principal chamada periodicamente pelo setInterval.
 *      Busca os dados atualizados, compara com os atuais e, se houver mudanças,
 *      exibe notificação e atualiza a tabela usando populateTableDOMWithData().
 *      Atualiza a referência de dados após cada mudança detectada.
 *
 * - DOMContentLoaded:
 *      Inicializa o serviço de atualização automática após o carregamento da página e dependências.
 *      Configura o intervalo de verificação e tratamento de eventos do modal.
 *
 * # Estrutura de dados:
 * - columnHeaders: Array com nomes das colunas na ordem da tabela HTML
 * - csvColumnIndices: Array com índices correspondentes no CSV para cada coluna
 * - currentProcessedData: Armazena os dados atuais para comparação
 * - comparison.updatedProjects: Array de objetos detalhando mudanças por projeto
 *
 * # Manipulação de eventos:
 * - Listener para DOMContentLoaded: Inicia o serviço após carregamento da página
 * - Listener para clique no botão de fechar o modal de notificação
 * - Timer setInterval: Executa checkForUpdates() periodicamente (5 minutos)
 *
 * # Tratamento de erros:
 * - Verificação de dependências (SHEET_CSV_URL_GLOBAL e Papa)
 * - Verificação da presença do cabeçalho correto no CSV
 * - Logs detalhados para facilitar debug em diferentes cenários
 * - Fallbacks para situações onde elementos do DOM não são encontrados
 *
 * # Observações:
 * - O script é encapsulado em IIFE para evitar poluição do escopo global
 * - O script depende das variáveis globais SHEET_CSV_URL_GLOBAL e Papa (biblioteca PapaParse)
 * - A função window.populateTableDOMWithData deve estar disponível para repopular a tabela no DOM
 * - O modal de notificação deve estar presente no HTML com os IDs esperados:
 *   - update-notification-overlay: Container do modal
 *   - update-notification-details: Elemento para inserir detalhes das mudanças
 *   - update-notification-close-btn: Botão para fechar o modal
 * - O serviço só inicia se todas as dependências estiverem carregadas corretamente
 * -----------------------------------------------------------------------------
 */

(function() {
    const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
    let currentProcessedData = null;
    let isFirstLoad = true;

    // Nomes das colunas e seus índices correspondentes no CSV bruto (após o cabeçalho)
    // Ordem conforme a tabela HTML e a solicitação do usuário
    const columnHeaders = [
        "ID PCA", "Área", "Tipo", "Projeto de Aquisição",
        "Status Início", "Status do Processo", "Contratar Até",
        "Valor PCA", "Orçamento", "Processo"
    ];
    // Índices correspondentes no array da linha do CSV (row[i])
    const csvColumnIndices = [2, 3, 4, 5, 10, 6, 9, 15, 14, 13];

    /**
     * Busca e processa os dados brutos do CSV da planilha
     * @returns {Promise<Array>} Promise com os dados processados do CSV
     * @throws {Error} Caso ocorra falha no carregamento ou parsing do CSV
     */
    async function fetchRawData() {
        return new Promise((resolve, reject) => {
            if (!window.SHEET_CSV_URL_GLOBAL || !window.Papa) {
                console.error("[AtualizacaoAutomatica] Dependências (SHEET_CSV_URL_GLOBAL ou Papa) não encontradas em fetchRawData.");
                return reject("Dependências não encontradas para fetchRawData.");
            }

            const urlComCacheBuster = window.SHEET_CSV_URL_GLOBAL + '&_cb=' + new Date().getTime();

            console.log("[AtualizacaoAutomatica - fetchRawData] Buscando dados de:", urlComCacheBuster);

            Papa.parse(urlComCacheBuster, {
                download: true,
                header: false, // Ler como array de arrays
                skipEmptyLines: true, // PapaParse vai pular linhas completamente vazias
                complete: function(results) {
                    const allRows = results.data;
                    if (!allRows || allRows.length === 0) {
                        console.error('[AtualizacaoAutomatica - fetchRawData] Nenhum dado retornado do CSV.');
                        return reject('Nenhum dado retornado do CSV.');
                    }

                    // 1) Encontre a linha cujo índice 2 seja exatamente "ID PCA" (o cabeçalho real)
                    const headerRowIndex = allRows.findIndex(row =>
                        row && row.length > 2 && row[2] && String(row[2]).trim() === 'ID PCA'
                    );

                    if (headerRowIndex < 0) {
                        console.error('[AtualizacaoAutomatica - fetchRawData] Cabeçalho "ID PCA" não encontrado no CSV.');
                        return reject('Cabeçalho "ID PCA" não encontrado no CSV em fetchRawData.');
                    }

                    // 2) Separe a partir da próxima linha como dados
                    const dataRows = allRows.slice(headerRowIndex + 1);

                    // 3) Determina o último índice com valor em "Projeto de Aquisição"
                    // (no seu mapeamento, essa coluna vem do CSV na posição 5)
                    let lastValidIndex = -1;
                    dataRows.forEach((row, i) => {
                        if (row && row.length > 5 && row[5] && String(row[5]).trim() !== "") {
                            lastValidIndex = i;
                        }
                    });

                    // Apenas linhas até o último projeto
                    const validDataRows = dataRows.slice(0, lastValidIndex + 1);
                    
                    resolve(validDataRows);
                },
                error: function(err) {
                    console.error('[AtualizacaoAutomatica - fetchRawData] Erro ao baixar/parsear CSV:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Compara dados antigos e novos para detectar mudanças
     * @param {Array} oldData Array com os dados atuais
     * @param {Array} newData Array com os dados recém-baixados
     * @returns {Object} Objeto detalhando mudanças encontradas
     */
    function compareData(oldData, newData) {
        console.log("[compareData] Iniciando comparação.");
        const changes = {
            hasChanges: false,
            updatedProjects: []
        };

        if (!oldData && newData) {
            console.log("[compareData] oldData é nulo, newData existe. Mudança detectada.");
            changes.hasChanges = true;
            return changes;
        }
        if (!oldData || !newData) {
             console.log("[compareData] oldData ou newData (ou ambos) são nulos. Mudança detectada se diferentes:", (oldData !== newData));
             changes.hasChanges = (oldData !== newData);
             return changes;
        }

        console.log(`[compareData] oldData.length=${oldData.length}, newData.length=${newData.length}`);

        if (oldData.length !== newData.length) {
            console.log("[compareData] Comprimento dos dados diferente. Mudança estrutural detectada.");
            changes.hasChanges = true;
            changes.updatedProjects.push({
                idPca: "N/A",
                projetoNome: "Estrutura da tabela alterada (linhas adicionadas/removidas).",
                colunasAlteradas: []
            });
            return changes;
        }

        console.log("[compareData] Comparando linha a linha...");
        for (let i = 0; i < newData.length; i++) {
            const oldRow = oldData[i];
            const newRow = newData[i];
            let rowChanged = false;
            const colunasAlteradasNestaLinha = [];

            if (JSON.stringify(oldRow) !== JSON.stringify(newRow)) {
                rowChanged = true;
                csvColumnIndices.forEach((csvIdx, headerIdx) => {
                    const oldValue = oldRow ? oldRow[csvIdx] : undefined;
                    const newValue = newRow ? newRow[csvIdx] : undefined;
                    
                    const oldValTrimmed = String(oldValue).trim();
                    const newValTrimmed = String(newValue).trim();

                    if (oldValTrimmed !== newValTrimmed) {
                        console.log(`[compareData] Linha ${i}, Coluna '${columnHeaders[headerIdx]}' MUDOU. Old: "${oldValTrimmed}" (original: "${oldValue}"), New: "${newValTrimmed}" (original: "${newValue}")`);
                        colunasAlteradasNestaLinha.push(columnHeaders[headerIdx]);
                    }
                });
            }

            if (rowChanged) {
                changes.hasChanges = true;
                const idPca = newRow[csvColumnIndices[columnHeaders.indexOf("ID PCA")]] || `Linha ${i+1} ID Desconhecido`;
                const projetoNome = newRow[csvColumnIndices[columnHeaders.indexOf("Projeto de Aquisição")]] || `Linha ${i+1} Projeto Desconhecido`;
                changes.updatedProjects.push({ idPca, projetoNome, colunasAlteradas: colunasAlteradasNestaLinha });
            }
        }

        if (!changes.hasChanges) {
            console.log("[compareData] Nenhuma mudança detectada após comparação linha a linha.");
        } else {
            console.log("[compareData] Mudanças foram detectadas:", JSON.stringify(changes.updatedProjects));
        }
        return changes;
    }

    /**
     * Exibe o modal de notificação com detalhes das atualizações
     * @param {string} htmlContent Conteúdo HTML a ser exibido no modal
     */
    function showUpdateNotificationModal(htmlContent) {
        const modalOverlay = document.getElementById('update-notification-overlay');
        const modalDetails = document.getElementById('update-notification-details');
        if (modalOverlay && modalDetails) {
            modalDetails.innerHTML = htmlContent;
            modalOverlay.style.display = 'flex';
        }
    }

    /**
     * Oculta o modal de notificação de atualizações
     */
    function hideUpdateNotificationModal() {
        const modalOverlay = document.getElementById('update-notification-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    /**
     * Função principal que verifica e processa atualizações
     * Busca novos dados, compara com os atuais e atualiza a interface se necessário
     */
    async function checkForUpdates() {
        console.log("Atualização Automática: Verificando atualizações...");
        try {
            const newRawData = await fetchRawData();

            if (isFirstLoad && currentProcessedData === null) { 
                currentProcessedData = newRawData;
                isFirstLoad = false; 
                console.log("Atualização Automática: Dados de referência iniciais carregados para comparação futura. Linhas:", currentProcessedData ? currentProcessedData.length : 0);
                return; 
            }

            const comparison = compareData(currentProcessedData, newRawData);

            if (comparison.hasChanges) {
                currentProcessedData = newRawData; // Atualiza os dados de referência

                let notificationHtml = '';
                if (comparison.updatedProjects.length > 0) {
                    const structuralChange = comparison.updatedProjects.find(p => p.projetoNome === "Estrutura da tabela alterada (linhas adicionadas/removidas).");

                    if (structuralChange) {
                        notificationHtml = `<p><strong>${structuralChange.projetoNome}</strong></p>`;
                    } else {
                        const projectSpecificChanges = comparison.updatedProjects.filter(p => p.colunasAlteradas && p.colunasAlteradas.length > 0);
                        if (projectSpecificChanges.length > 0) {
                            notificationHtml = '<p>Foram detectadas atualizações nos seguintes projetos:</p><ul>';
                            projectSpecificChanges.forEach(p => {
                                notificationHtml += `<li><strong>ID PCA:</strong> ${p.idPca}, <strong>Projeto:</strong> ${p.projetoNome}`;
                                if (p.colunasAlteradas.length > 0) {
                                    notificationHtml += `<br/>&nbsp;&nbsp;<em>Colunas alteradas: ${p.colunasAlteradas.join(', ')}</em>`;
                                }
                                notificationHtml += '</li>';
                            });
                            notificationHtml += '</ul>';
                        } else {
                            notificationHtml = '<p>A tabela foi atualizada com novos dados (mudanças gerais detectadas).</p>';
                        }
                    }
                } else {
                     notificationHtml = '<p>A tabela foi atualizada com novos dados.</p>';
                }

                if (notificationHtml) {
                    showUpdateNotificationModal(notificationHtml + "<p>A tabela será recarregada com as novas informações.</p>");
                }

                console.log("Atualização Automática: Mudanças detectadas. Atualizando tabela...");

                const overlay = document.getElementById('loading-overlay');
                if (typeof window.populateTableDOMWithData === 'function') {
                    window.populateTableDOMWithData(newRawData);
                     if (overlay) overlay.style.display = 'none';
                    console.log("Atualização Automática: Tabela repopulada com populateTableDOMWithData.");
                } 
            } else {
                console.log("Atualização Automática: Sem mudanças detectadas.");
            }
        } catch (error) {
            console.error("Atualização Automática: Erro durante a verificação:", error);
        }
    }

    // Inicialização do serviço após carregamento da página
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Atualização Automática: DOMContentLoaded acionado.");

        setTimeout(() => {
            console.log("Atualização Automática: Timeout de 3s para iniciar serviço.");

            if (window.SHEET_CSV_URL_GLOBAL && window.Papa) {
                console.log("Atualização Automática: Dependências (SHEET_CSV_URL_GLOBAL, Papa) encontradas.");

                fetchRawData().then(initialData => {
                    console.log("Atualização Automática: Dados iniciais (pré-verificação) buscados com sucesso.");
                    
                    setInterval(checkForUpdates, UPDATE_INTERVAL);
                    console.log("Atualização Automática: Serviço de verificação periódica INICIADO.");
                }).catch(error => {
                    console.error("Atualização Automática: ERRO ao buscar dados iniciais para o serviço. O serviço NÃO será iniciado.", error);
                });
            } else {
                console.error("Atualização Automática: Dependências (SHEET_CSV_URL_GLOBAL ou Papa) NÃO encontradas. O serviço NÃO será iniciado.");
            }
        }, 3000);
        
        // Configuração do botão de fechamento do modal
        const closeBtn = document.getElementById('update-notification-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideUpdateNotificationModal);
        } else {
            console.warn("Atualização Automática: Botão de fechar modal 'update-notification-close-btn' não encontrado.");
        }
    });

})();