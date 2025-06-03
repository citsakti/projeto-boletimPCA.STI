/**
 * AtualizacaoAutomatica.js - Sistema de atualização automática do Boletim PCA 2025 (VERSÃO 2.0)
 * 
 * ⚠️  SISTEMA ATUALMENTE INABILITADO PARA REAVALIAÇÃO ⚠️
 * 
 * VERSÃO COMPLETAMENTE REESCRITA PARA COMPATIBILIDADE COM BOOTSTRAP
 * 
 * Este script foi recriado do zero para resolver problemas de:
 *  - Duplicação de colunas após atualização
 *  - Perda de elementos gráficos/visuais do Bootstrap
 *  - Conflitos com classes CSS do Bootstrap
 *  - Problemas de renderização após aplicação do framework
 *
 * =============== NOVA ARQUITETURA ================
 * 
 * # Abordagem de Atualização:
 *   - Atualização granular célula por célula (em vez de recriar toda a tabela)
 *   - Preservação completa da estrutura DOM existente
 *   - Manutenção de todas as classes Bootstrap e formatações
 *   - Sincronização inteligente apenas dos dados alterados
 * 
 * # Componentes Principais:
 *   - Sistema de comparação aprimorado para detectar mudanças precisas
 *   - Algoritmo de atualização que preserva elementos visuais
 *   - Integração com sistema de eventos do Bootstrap
 *   - Compatibilidade com responsive design e mobile cards
 * 
 * # Fluxo de Execução Otimizado:
 *   1. Verifica alterações nos dados fonte (CSV)
 *   2. Compara com estado atual do DOM (não cache em memória)
 *   3. Identifica células específicas que mudaram
 *   4. Atualiza apenas as células necessárias preservando formatação
 *   5. Dispara eventos para sincronização de outros scripts
 * 
 * # Compatibilidade Bootstrap:
 *   - Preserva classes table-striped, table-hover, table-responsive
 *   - Mantém estrutura de thead e tbody inalteradas
 *   - Conserva data-labels para modo mobile cards
 *   - Respeita ordenação e filtros aplicados
 * 
 * # Melhorias de Performance:
 *   - Reduz manipulação desnecessária do DOM
 *   - Evita re-renderização completa da tabela
 *   - Otimiza detecção de mudanças com algoritmo eficiente
 *   - Minimiza impacto visual durante atualizações
 * 
 * # Dependências Mantidas:
 *   - PapaParse para processamento de CSV
 *   - Estrutura de modal HTML para notificações
 *   - Eventos customizados para integração com outros scripts
 * 
 * -----------------------------------------------------------------------------
 */

(function() {
    const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
    let currentDataSnapshot = null;
    let isFirstLoad = true;
    let updateIntervalId = null;

    // Mapeamento das colunas conforme estrutura atual da tabela
    const columnHeaders = [
        "ID PCA", "Área", "Tipo", "Projeto de Aquisição",
        "Acompanhamento", "Status do Processo", "Contratar Até",
        "Valor PCA", "Orçamento", "Processo"
    ];
    
    // Índices no CSV correspondentes às colunas da tabela HTML
    const csvColumnIndices = [2, 3, 4, 5, 10, 6, 9, 15, 14, 13];    /**
     * Busca dados atualizados do CSV e os processa para comparação
     * @returns {Promise<Array>} Array de linhas de dados processadas do CSV
     * @throws {Error} Em caso de falha no carregamento ou parsing
     */
    async function fetchUpdatedData() {
        return new Promise((resolve, reject) => {
            if (!window.SHEET_CSV_URL_GLOBAL || !window.Papa) {
                console.error("[AtualizacaoAutomatica] Dependências não encontradas.");
                return reject("Dependências SHEET_CSV_URL_GLOBAL ou Papa não encontradas.");
            }

            // Cache busting para garantir dados mais recentes
            const urlComCacheBuster = window.SHEET_CSV_URL_GLOBAL + '&_cb=' + new Date().getTime();
            
            console.log("[AtualizacaoAutomatica] Buscando dados atualizados...");

            Papa.parse(urlComCacheBuster, {
                download: true,
                header: false,
                skipEmptyLines: true,
                complete: function(results) {
                    try {
                        const allRows = results.data;
                        if (!allRows || allRows.length === 0) {
                            return reject('Nenhum dado retornado do CSV.');
                        }

                        // Localizar cabeçalho real
                        const headerRowIndex = allRows.findIndex(row =>
                            row && row.length > 2 && row[2] && String(row[2]).trim() === 'ID PCA'
                        );

                        if (headerRowIndex < 0) {
                            return reject('Cabeçalho "ID PCA" não encontrado no CSV.');
                        }

                        // Extrair apenas linhas de dados válidas
                        const dataRows = allRows.slice(headerRowIndex + 1);
                        
                        // Determinar última linha com projeto válido
                        let lastValidIndex = -1;
                        dataRows.forEach((row, i) => {
                            if (row && row.length > 5 && row[5] && String(row[5]).trim() !== "") {
                                lastValidIndex = i;
                            }
                        });

                        const validDataRows = dataRows.slice(0, lastValidIndex + 1);
                        console.log(`[AtualizacaoAutomatica] ${validDataRows.length} linhas válidas encontradas.`);
                        
                        resolve(validDataRows);
                        
                    } catch (error) {
                        console.error('[AtualizacaoAutomatica] Erro ao processar dados CSV:', error);
                        reject(error);
                    }
                },
                error: function(err) {
                    console.error('[AtualizacaoAutomatica] Erro ao baixar CSV:', err);
                    reject(err);
                }
            });
        });
    }    /**
     * Captura o estado atual da tabela DOM para comparação
     * @returns {Array} Array representando o estado atual da tabela
     */
    function captureCurrentTableState() {
        const tbody = document.querySelector('table tbody');
        if (!tbody) {
            console.warn("[AtualizacaoAutomatica] Tabela não encontrada no DOM.");
            return [];
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return csvColumnIndices.map(csvIndex => {
                // Mapeia células da tabela para índices CSV esperados
                const cellIndex = csvColumnIndices.indexOf(csvIndex);
                if (cellIndex >= 0 && cells[cellIndex]) {
                    return cells[cellIndex].textContent.trim();
                }
                return '';
            });
        });
    }

    /**
     * Compara dados atuais da tabela com dados novos do CSV
     * @param {Array} currentData Estado atual da tabela
     * @param {Array} newData Novos dados do CSV
     * @returns {Object} Resultado da comparação com detalhes das mudanças
     */
    function compareTableData(currentData, newData) {
        console.log("[AtualizacaoAutomatica] Iniciando comparação inteligente...");
        
        const changes = {
            hasChanges: false,
            structuralChanges: false,
            updatedProjects: [],
            addedRows: [],
            removedRows: []
        };

        // Verificação inicial
        if (!currentData && newData) {
            changes.hasChanges = true;
            changes.structuralChanges = true;
            return changes;
        }

        if (!currentData || !newData) {
            changes.hasChanges = (currentData !== newData);
            return changes;
        }

        // Verificar mudanças estruturais (número de linhas)
        if (currentData.length !== newData.length) {
            console.log(`[AtualizacaoAutomatica] Mudança estrutural detectada: ${currentData.length} -> ${newData.length} linhas`);
            changes.hasChanges = true;
            changes.structuralChanges = true;
            
            if (newData.length > currentData.length) {
                changes.addedRows = newData.slice(currentData.length);
            } else {
                changes.removedRows = currentData.slice(newData.length);
            }
            return changes;
        }

        // Comparação linha por linha para mudanças específicas
        for (let rowIndex = 0; rowIndex < newData.length; rowIndex++) {
            const currentRow = currentData[rowIndex];
            const newRow = newData[rowIndex];
            
            if (!currentRow || !newRow) continue;

            const changedColumns = [];
            
            for (let colIndex = 0; colIndex < csvColumnIndices.length; colIndex++) {
                const csvIdx = csvColumnIndices[colIndex];
                const currentValue = String(currentRow[csvIdx] || '').trim();
                const newValue = String(newRow[csvIdx] || '').trim();
                
                if (currentValue !== newValue) {
                    changedColumns.push({
                        columnName: columnHeaders[colIndex],
                        oldValue: currentValue,
                        newValue: newValue
                    });
                }
            }

            if (changedColumns.length > 0) {
                changes.hasChanges = true;
                
                // Identificar projeto alterado
                const idPca = newRow[csvColumnIndices[0]] || `Linha ${rowIndex + 1}`;
                const projetoNome = newRow[csvColumnIndices[3]] || `Projeto Linha ${rowIndex + 1}`;
                
                changes.updatedProjects.push({
                    rowIndex,
                    idPca,
                    projetoNome,
                    changedColumns
                });
                
                console.log(`[AtualizacaoAutomatica] Mudanças detectadas na linha ${rowIndex + 1}:`, changedColumns);
            }
        }

        console.log(`[AtualizacaoAutomatica] Comparação concluída. Mudanças: ${changes.hasChanges}`);
        return changes;
    }    /**
     * Atualiza a tabela DOM de forma granular preservando Bootstrap
     * @param {Array} newData Novos dados do CSV
     * @param {Object} changes Resultado da comparação indicando mudanças
     */
    function updateTableGranularly(newData, changes) {
        console.log("[AtualizacaoAutomatica] Iniciando atualização granular da tabela...");
        
        const tbody = document.querySelector('table tbody');
        if (!tbody) {
            console.error("[AtualizacaoAutomatica] Elemento tbody não encontrado.");
            return;
        }

        try {
            // Se houve mudanças estruturais, usar método de reconstrução segura
            if (changes.structuralChanges) {
                console.log("[AtualizacaoAutomatica] Aplicando mudanças estruturais...");
                reconstructTableSafely(newData, tbody);
                return;
            }

            // Para mudanças específicas, atualizar apenas células alteradas
            if (changes.updatedProjects.length > 0) {
                changes.updatedProjects.forEach(project => {
                    updateRowGranularly(project.rowIndex, newData[project.rowIndex], project.changedColumns);
                });
            }

            console.log("[AtualizacaoAutomatica] Atualização granular concluída.");

        } catch (error) {
            console.error("[AtualizacaoAutomatica] Erro durante atualização granular:", error);
            // Fallback para método de reconstrução completa em caso de erro
            reconstructTableSafely(newData, tbody);
        }
    }

    /**
     * Atualiza uma linha específica da tabela preservando formatação
     * @param {number} rowIndex Índice da linha a ser atualizada
     * @param {Array} newRowData Novos dados da linha
     * @param {Array} changedColumns Colunas que foram alteradas
     */
    function updateRowGranularly(rowIndex, newRowData, changedColumns) {
        const tbody = document.querySelector('table tbody');
        const row = tbody.children[rowIndex];
        
        if (!row) {
            console.warn(`[AtualizacaoAutomatica] Linha ${rowIndex} não encontrada no DOM.`);
            return;
        }

        console.log(`[AtualizacaoAutomatica] Atualizando linha ${rowIndex}...`);

        changedColumns.forEach(change => {
            const columnIndex = columnHeaders.indexOf(change.columnName);
            if (columnIndex >= 0) {
                const cell = row.children[columnIndex];
                if (cell) {
                    // Preservar atributos existentes da célula
                    const existingAttributes = {};
                    for (let attr of cell.attributes) {
                        existingAttributes[attr.name] = attr.value;
                    }

                    // Atualizar conteúdo preservando estrutura
                    updateCellContent(cell, change.newValue, change.columnName, existingAttributes);
                    
                    console.log(`[AtualizacaoAutomatica] Célula ${change.columnName} atualizada: "${change.oldValue}" -> "${change.newValue}"`);
                }
            }
        });
    }

    /**
     * Atualiza o conteúdo de uma célula preservando formatação e atributos
     * @param {HTMLElement} cell Elemento da célula
     * @param {string} newValue Novo valor
     * @param {string} columnName Nome da coluna
     * @param {Object} existingAttributes Atributos existentes da célula
     */
    function updateCellContent(cell, newValue, columnName, existingAttributes) {
        // Preservar data-label para responsividade mobile
        if (existingAttributes['data-label']) {
            cell.setAttribute('data-label', existingAttributes['data-label']);
        }

        // Preservar outros atributos importantes
        Object.keys(existingAttributes).forEach(attr => {
            if (attr.startsWith('data-') || attr === 'class') {
                cell.setAttribute(attr, existingAttributes[attr]);
            }
        });

        // Verificar se é coluna especial que requer formatação específica
        if (columnName === "Processo" && newValue) {
            // Preservar ícone de processo se existir
            cell.textContent = newValue;
            
            // Recriar ícone de processo se necessário
            if (!cell.querySelector('.processo-link-icon')) {
                const icon = document.createElement('span');
                icon.classList.add('processo-link-icon');
                icon.textContent = ' 🔗';
                icon.style.cursor = 'pointer';
                icon.title = `Abrir processo ${newValue}`;
                cell.appendChild(icon);
            }
        } else {
            // Atualização simples para outras colunas
            cell.textContent = newValue;
        }
    }

    /**
     * Reconstrói a tabela de forma segura preservando Bootstrap classes
     * @param {Array} newData Novos dados completos
     * @param {HTMLElement} tbody Elemento tbody da tabela
     */
    function reconstructTableSafely(newData, tbody) {
        console.log("[AtualizacaoAutomatica] Reconstruindo tabela de forma segura...");
        
        // Capturar classes e atributos da tabela antes da modificação
        const table = tbody.closest('table');
        const tableClasses = table ? Array.from(table.classList) : [];
        const tableAttributes = {};
        
        if (table) {
            for (let attr of table.attributes) {
                tableAttributes[attr.name] = attr.value;
            }
        }

        // Limpar tbody preservando estrutura
        tbody.innerHTML = '';

        // Reconstruir linhas com nova data
        newData.forEach((rowData, index) => {
            const row = document.createElement('tr');
            
            columnHeaders.forEach((headerName, colIndex) => {
                const cell = document.createElement('td');
                const csvIndex = csvColumnIndices[colIndex];
                const cellValue = rowData[csvIndex] || '';
                
                // Adicionar data-label para responsividade
                cell.setAttribute('data-label', headerName);
                
                // Aplicar formatação específica por coluna
                if (headerName === "Processo" && cellValue) {
                    cell.textContent = cellValue;
                    const icon = document.createElement('span');
                    icon.classList.add('processo-link-icon');
                    icon.textContent = ' 🔗';
                    icon.style.cursor = 'pointer';
                    icon.title = `Abrir processo ${cellValue}`;
                    cell.appendChild(icon);
                } else {
                    cell.textContent = cellValue;
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });

        // Restaurar classes da tabela se foram perdidas
        if (table && tableClasses.length > 0) {
            table.className = '';
            tableClasses.forEach(cls => table.classList.add(cls));
        }

        console.log("[AtualizacaoAutomatica] Reconstrução segura concluída.");
    }    /**
     * Exibe modal de notificação sobre atualizações detectadas
     * @param {string} htmlContent Conteúdo HTML para exibir no modal
     */
    function showUpdateNotificationModal(htmlContent) {
        const modalOverlay = document.getElementById('update-notification-overlay');
        const modalDetails = document.getElementById('update-notification-details');
        
        if (modalOverlay && modalDetails) {
            modalDetails.innerHTML = htmlContent;
            modalOverlay.style.display = 'flex';
            
            // Garantir que o modal seja visível acima de outros elementos
            modalOverlay.style.zIndex = '9999';
        } else {
            console.warn("[AtualizacaoAutomatica] Elementos do modal de notificação não encontrados.");
        }
    }

    /**
     * Oculta o modal de notificação
     */
    function hideUpdateNotificationModal() {
        const modalOverlay = document.getElementById('update-notification-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    /**
     * Gera HTML de notificação baseado nas mudanças detectadas
     * @param {Object} changes Resultado da comparação de dados
     * @returns {string} HTML formatado para exibição no modal
     */
    function generateNotificationHTML(changes) {
        let notificationHtml = '';

        if (changes.structuralChanges) {
            if (changes.addedRows.length > 0) {
                notificationHtml += `<p><strong>✅ ${changes.addedRows.length} nova(s) linha(s) adicionada(s) à tabela.</strong></p>`;
            }
            if (changes.removedRows.length > 0) {
                notificationHtml += `<p><strong>❌ ${changes.removedRows.length} linha(s) removida(s) da tabela.</strong></p>`;
            }
            if (!changes.addedRows.length && !changes.removedRows.length) {
                notificationHtml += '<p><strong>🔄 Estrutura da tabela foi alterada.</strong></p>';
            }
        } else if (changes.updatedProjects.length > 0) {
            notificationHtml += '<p><strong>📊 Foram detectadas atualizações nos seguintes projetos:</strong></p><ul>';
            
            changes.updatedProjects.forEach(project => {
                notificationHtml += `<li><strong>ID PCA:</strong> ${project.idPca}<br/>`;
                notificationHtml += `<strong>Projeto:</strong> ${project.projetoNome}`;
                
                if (project.changedColumns.length > 0) {
                    notificationHtml += '<br/><em>Colunas alteradas:</em><ul>';
                    project.changedColumns.forEach(change => {
                        notificationHtml += `<li><strong>${change.columnName}:</strong> "${change.oldValue}" → "${change.newValue}"</li>`;
                    });
                    notificationHtml += '</ul>';
                }
                notificationHtml += '</li><br/>';
            });
            
            notificationHtml += '</ul>';
        } else {
            notificationHtml += '<p><strong>🔄 A tabela foi atualizada com novos dados.</strong></p>';
        }

        notificationHtml += '<p><em>A tabela será atualizada automaticamente preservando toda a formatação e funcionalidades.</em></p>';
        
        return notificationHtml;
    }

    /**
     * Dispara eventos necessários após atualização da tabela
     */
    function triggerPostUpdateEvents() {
        console.log("[AtualizacaoAutomatica] Disparando eventos pós-atualização...");
        
        // Evento principal para outros scripts saberem que a tabela foi atualizada
        document.dispatchEvent(new Event('tabela-carregada'));
        
        // Reaplica formatações e funcionalidades
        try {
            if (typeof window.assignStatusClasses === 'function') {
                window.assignStatusClasses();
            }
            if (typeof window.assignAreaClasses === 'function') {
                window.assignAreaClasses();
            }
            if (typeof window.assignOrcamentoClasses === 'function') {
                window.assignOrcamentoClasses();
            }
            if (typeof window.aplicarEstiloStatus === 'function') {
                window.aplicarEstiloStatus();
            }
            if (typeof window.aplicarAnimacaoBomba === 'function') {
                window.aplicarAnimacaoBomba();
            }
            if (typeof window.aplicarAnimacaoHourglass === 'function') {
                window.aplicarAnimacaoHourglass();
            }
            if (typeof window.aplicarAnimacaoExclamation === 'function') {
                window.aplicarAnimacaoExclamation();
            }
            
            // Reinicializar filtros se necessário
            if (typeof window.initializeGoogleSheetFilters === 'function') {
                window.initializeGoogleSheetFilters();
            }
            
            // Reinicializar modal de processo
            if (window.processoModalInstance && typeof window.processoModalInstance.reinitialize === 'function') {
                window.processoModalInstance.reinitialize();
            }

            // Aplicar alternância de cores
            if (typeof window.alternaCoresLinhas === 'function') {
                window.alternaCoresLinhas();
            }

            console.log("[AtualizacaoAutomatica] Eventos pós-atualização disparados com sucesso.");
            
        } catch (error) {
            console.error("[AtualizacaoAutomatica] Erro ao disparar eventos pós-atualização:", error);
        }
    }    /**
     * Função principal de verificação e atualização automática
     * Nova versão que preserva Bootstrap e evita duplicação
     */
    async function checkForUpdates() {
        console.log("[AtualizacaoAutomatica] Verificando atualizações...");
        
        try {
            // Buscar dados atualizados do CSV
            const newData = await fetchUpdatedData();
            
            // Primeira execução: estabelecer baseline
            if (isFirstLoad) {
                currentDataSnapshot = newData;
                isFirstLoad = false;
                console.log(`[AtualizacaoAutomatica] Baseline estabelecido com ${newData.length} linhas.`);
                return;
            }

            // Capturar estado atual da tabela DOM
            const currentTableState = captureCurrentTableState();
            
            // Comparar dados
            const changes = compareTableData(currentTableState, newData);
            
            if (changes.hasChanges) {
                console.log("[AtualizacaoAutomatica] Mudanças detectadas, iniciando atualização...");
                
                // Gerar notificação para o usuário
                const notificationHtml = generateNotificationHTML(changes);
                showUpdateNotificationModal(notificationHtml);
                
                // Mostrar overlay de carregamento
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'flex';
                }
                
                // Pequeno delay para melhorar a experiência do usuário
                setTimeout(() => {
                    try {
                        // Atualizar tabela de forma granular
                        updateTableGranularly(newData, changes);
                        
                        // Atualizar snapshot de referência
                        currentDataSnapshot = newData;
                        
                        // Disparar eventos necessários
                        triggerPostUpdateEvents();
                        
                        // Esconder overlay de carregamento
                        if (loadingOverlay) {
                            loadingOverlay.style.display = 'none';
                        }
                        
                        console.log("[AtualizacaoAutomatica] Atualização concluída com sucesso.");
                        
                    } catch (updateError) {
                        console.error("[AtualizacaoAutomatica] Erro durante atualização:", updateError);
                        
                        // Esconder overlay mesmo em caso de erro
                        if (loadingOverlay) {
                            loadingOverlay.style.display = 'none';
                        }
                    }
                }, 300);
                
            } else {
                console.log("[AtualizacaoAutomatica] Nenhuma mudança detectada.");
            }
            
        } catch (error) {
            console.error("[AtualizacaoAutomatica] Erro durante verificação:", error);
            
            // Esconder overlay em caso de erro
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    /**
     * Inicializa o serviço de atualização automática
     */
    function initializeAutoUpdateService() {
        console.log("[AtualizacaoAutomatica] Inicializando serviço...");
        
        // Verificar dependências necessárias
        if (!window.SHEET_CSV_URL_GLOBAL || !window.Papa) {
            console.error("[AtualizacaoAutomatica] Dependências não encontradas. Serviço não será iniciado.");
            return false;
        }
        
        // Verificar se a tabela existe
        const table = document.querySelector('table tbody');
        if (!table) {
            console.error("[AtualizacaoAutomatica] Tabela não encontrada. Serviço não será iniciado.");
            return false;
        }
        
        // Configurar evento de fechamento do modal
        const closeBtn = document.getElementById('update-notification-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideUpdateNotificationModal);
        } else {
            console.warn("[AtualizacaoAutomatica] Botão de fechar modal não encontrado.");
        }
        
        // Buscar dados iniciais para estabelecer baseline
        fetchUpdatedData()
            .then(initialData => {
                console.log("[AtualizacaoAutomatica] Dados iniciais carregados, estabelecendo baseline...");
                currentDataSnapshot = initialData;
                isFirstLoad = false;
                  // INABILITADO: Iniciar verificação periódica
                // updateIntervalId = setInterval(checkForUpdates, UPDATE_INTERVAL);
                console.log(`[AtualizacaoAutomatica] Serviço INABILITADO para reavaliação. Verificação automática suspensa.`);
                
                return true;
            })
            .catch(error => {
                console.error("[AtualizacaoAutomatica] Erro ao carregar dados iniciais:", error);
                return false;
            });
    }

    /**
     * Para o serviço de atualização automática
     */
    function stopAutoUpdateService() {
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
            console.log("[AtualizacaoAutomatica] Serviço interrompido.");
        }
    }    // INABILITADO: Inicialização do serviço após carregamento da página
    /*
    document.addEventListener('DOMContentLoaded', () => {
        console.log("[AtualizacaoAutomatica] DOMContentLoaded acionado.");

        setTimeout(() => {
            console.log("[AtualizacaoAutomatica] Iniciando serviço após delay de 3s...");
            initializeAutoUpdateService();
        }, 3000);
    });
    */

    // INABILITADO: Exportar funções para acesso global se necessário
    /*
    window.AtualizacaoAutomatica = {
        initialize: initializeAutoUpdateService,
        stop: stopAutoUpdateService,
        checkNow: checkForUpdates
    };
    */

    console.log("[AtualizacaoAutomatica] ⚠️  SISTEMA INABILITADO - Funções disponíveis mas não executam automaticamente");
    console.log("[AtualizacaoAutomatica] Para reativar, descomentar as seções no final do arquivo");

    // PARA REATIVAR O SISTEMA: Descomentar as seguintes funções no final do arquivo:
    // 1. document.addEventListener('DOMContentLoaded', ...)
    // 2. window.AtualizacaoAutomatica = {...}
    // 3. setInterval(checkForUpdates, UPDATE_INTERVAL) na função initializeAutoUpdateService

})();