(function() {
    const UPDATE_INTERVAL = 60 * 1000; // 60 segundos
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

    // Função para buscar e processar os dados do CSV
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

    // Função para comparar os dados antigos e novos
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

    function showUpdateNotificationModal(htmlContent) {
        const modalOverlay = document.getElementById('update-notification-overlay');
        const modalDetails = document.getElementById('update-notification-details');
        if (modalOverlay && modalDetails) {
            modalDetails.innerHTML = htmlContent;
            modalOverlay.style.display = 'flex';
        }
    }

    function hideUpdateNotificationModal() {
        const modalOverlay = document.getElementById('update-notification-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

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
        
        const closeBtn = document.getElementById('update-notification-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideUpdateNotificationModal);
        } else {
            console.warn("Atualização Automática: Botão de fechar modal 'update-notification-close-btn' não encontrado.");
        }
    });

})();