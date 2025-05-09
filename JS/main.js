// Renomeou a URL da planilha
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkrLcVYUAyDdf3XlecZ-qdperC8emYWp_5MCXXBG_SdrF5uGab5ugtebjA9iOWeDIbyC56s9jRGjcP/pub?gid=1123542137&single=true&output=csv';

// Busca dados da planilha e preenche a tabela
function fetchAndPopulate() {
    return new Promise((resolve, reject) => {
        Papa.parse(SHEET_CSV_URL, {
            download: true,
            header: false,         // <-- ler como array de arrays
            skipEmptyLines: true,  
            complete: function(results) {
                const allRows = results.data;         // [ [".", …], ["#", "PB", "ID PCA", …], [dados…], … ]
                
                // 1) Encontre a linha cujo índice 2 seja exatamente "ID PCA" (o cabeçalho real)
                const headerRowIndex = allRows.findIndex(row =>
                    row[2] && row[2].trim() === 'ID PCA'
                );
                if (headerRowIndex < 0) {
                    console.error('Cabeçalho "ID PCA" não encontrado no CSV');
                    reject('Cabeçalho "ID PCA" não encontrado no CSV');
                    return;
                }
    
                // 2) Separe a partir da próxima linha como dados
                const dataRows = allRows.slice(headerRowIndex + 1);
                
                // Determina o último índice com valor em "Projeto de Aquisição"
                // (no seu mapeamento, essa coluna vem do CSV na posição 5)
                let lastValidIndex = -1;
                dataRows.forEach((row, i) => {
                    if (row[5] && row[5].trim() !== "") {
                        lastValidIndex = i;
                    }
                });
                // Apenas linhas até o último projeto
                const validDataRows = dataRows.slice(0, lastValidIndex + 1);
                
                // 3) Monte a tabela usando apenas as colunas que importam
                const tbody = document.querySelector('table tbody');
                // Defina os cabeçalhos na ordem correta da tabela HTML final
                const headers = [
                    "ID PCA", "Área", "Tipo", "Projeto de Aquisição", 
                    "Status Início", "Status do Processo", "Contratar Até", 
                    "Valor PCA", "Orçamento", "Processo"
                ];

                validDataRows.forEach(row => {
                    const tr = document.createElement('tr');
    
                    // Atualizado array de mapeamento para refletir a nova ordem:
                    // Nova ordem:
                    // 0: CSV[2] = ID PCA
                    // 1: CSV[3] = Área
                    // 2: CSV[4] = Tipo
                    // 3: CSV[5] = Projeto de Aquisição
                    // 4: CSV[10] = Status Início
                    // 5: CSV[6] = Status do Processo
                    // 6: CSV[9] = Contratar Até
                    // 7: CSV[15] = Valor PCA
                    // 8: CSV[14] = Orçamento
                    // 9: CSV[13] = Processo
                    [2, 3, 4, 5, 10, 6, 9, 15, 14, 13].forEach((i, colIndex) => {
                        const td = document.createElement('td');
                        // Insere o data-label para uso no mobile
                        td.dataset.label = headers[colIndex];
                        let value = row[i] || '';
                        
                        if (colIndex === 4) {
                            // Coluna "Status Início"
                            value = formatStatusInicio(value);
                        } else if (colIndex === 6) {
                            // Coluna "Contratar Até"
                            value = formatContratarAte(value);
                        } else if (colIndex === 8) {
                            // Nova coluna "Orçamento": se vazio, substitui
                            if (value === '') {
                                value = '<Não Orçado>';
                            }
                        } else if (colIndex === 9) {
                            // Coluna "Processo": se vazio, substitui por "*", senão adiciona emoji de link
                            if (value.trim() === '') {
                                td.textContent = '*';
                            } else {
                                td.innerHTML = `${value} <span class="processo-link-icon" title="Abrir processo">🔗</span>`;
                            }
                            tr.appendChild(td);
                            return; // Já adicionou o td, pula para o próximo
                        } else if (colIndex === 5) {
                            // Coluna "Status do Processo"
                            const statusProcessoTexto = row[6]; // Coluna F - Status do Processo
                            td.textContent = statusProcessoTexto;

                            if (statusProcessoTexto.includes('AUTUAÇÃO ATRASADA 💣')) {
                                const detalheAutuacao = row[11]; // Coluna L do CSV
                                if (detalheAutuacao) {
                                    td.dataset.detalheAutuacao = detalheAutuacao;
                                }
                            }

                            if (statusProcessoTexto.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
                                const detalheContratacao = row[12]; // Coluna M do CSV
                                if (detalheContratacao) {
                                    td.dataset.detalheContratacao = detalheContratacao;
                                }
                            }

                            // Adicionar detalhe da coluna L do CSV para outros status relevantes
                            const outrosStatusRelevantes = [
                                'AGUARDANDO DFD ⏳',
                                'AGUARDANDO ETP ⏳',
                                'DFD ATRASADO❗',
                                'ETP ATRASADO❗',
                                'ELABORANDO TR📝',
                                'ANÁLISE DE VIABILIDADE 📝'
                            ];
                            if (outrosStatusRelevantes.some(s => statusProcessoTexto.includes(s))) {
                                const detalheStatusGeral = row[11]; // Coluna L do CSV (índice 11)
                                if (detalheStatusGeral) {
                                    td.dataset.detalheStatusGeral = detalheStatusGeral;
                                }
                            }

                            // Adicionar detalhe da coluna M do CSV para status de Contratação/Renovação
                            const statusContratacaoRenovacao = [
                                'EM CONTRATAÇÃO 🤝',
                                'EM RENOVAÇÃO 🔄'
                            ];
                            if (statusContratacaoRenovacao.some(s => statusProcessoTexto.includes(s))) {
                                const detalheColunaM = row[12]; // Coluna M do CSV (índice 12)
                                if (detalheColunaM) {
                                    td.dataset.detalheContratacaoRenovacao = detalheColunaM;
                                }
                            }
                        }
                        td.textContent = value;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                // depois de inserir todas as linhas na <tbody>
                if (window.aplicarAnimacaoBomba)      aplicarAnimacaoBomba();
                if (window.aplicarAnimacaoHourglass)  aplicarAnimacaoHourglass();
                if (window.aplicarAnimacaoExclamation) aplicarAnimacaoExclamation();

                /* NOVO: avisa que a tabela já tem dados */
                document.dispatchEvent(new Event('tabela-carregada'));
                resolve();
            },
            error: function(err) {
                console.error('Erro ao baixar/parsear CSV:', err);
                reject(err);
            }
        });
    });
}

// Função para popular o filtro "tipo" como select com as opções da tabela
function populateTipoFiltro() {
    // Seleciona o container do filtro "tipo" no HTML (certifique-se de ter um elemento com id "tipo-filter")
    const tipoFiltroContainer = document.getElementById('tipo-filter');
    if (!tipoFiltroContainer) return;
    
    // Coleta valores únicos da coluna "tipo" (neste exemplo, assume-se que é a coluna de índice 1)
    const tableRows = document.querySelectorAll('table tbody tr');
    const tipos = new Set();
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[1]) {
            const valor = cells[2].textContent.trim();
            if (valor) {
                tipos.add(valor);
            }
        }
    });
    
    // Cria o select e insere a opção "Todos"
    const select = document.createElement('select');
    select.id = 'tipo-filter-select';
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Todos";
    select.appendChild(defaultOption);

    // Adiciona as opções obtidas
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.toLowerCase();
        option.textContent = tipo;
        select.appendChild(option);
    });
    
    // Insere o select no container, substituindo o input antigo (se houver)
    tipoFiltroContainer.innerHTML = "";
    tipoFiltroContainer.appendChild(select);
    
    // Adiciona o listener para o select (utiliza a mesma função de filtragem)
    select.addEventListener('change', filterTable);
}

// Modificação da função filterTable para considerar inputs e selects
function filterTable() {
    // Seleciona todos os filtros de texto e selects
    const filterElements = document.querySelectorAll('.filter-row input[type="text"], .filter-row select');
    const filters = Array.from(filterElements).map(el => el.value.trim().toLowerCase());

    // Seleciona todas as linhas do corpo da tabela
    const tableRows = document.querySelectorAll('table tbody tr');

    // Itera por cada linha da tabela
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let showRow = true;

        // Para cada filtro, verifica se a célula equivalente inclui o valor do filtro
        filters.forEach((filterText, index) => {
            // Se houver filtro, compara com o texto da célula correspondente
            if (filterText !== "") {
                const cellText = cells[index] ? cells[index].textContent.toLowerCase() : "";
                if (!cellText.includes(filterText)) {
                    showRow = false;
                }
            }
        });
        row.style.display = showRow ? "" : "none";
    });
}

// Função para remover linhas após a última linha com conteúdo na coluna "Descrição do Objeto"
function trimTableEnding() {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  let lastIndex = -1;
  
  rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      // Coluna "Descrição do Objeto" é a 4ª coluna (índice 3)
      if (cells[3] && cells[3].textContent.trim() !== "") {
          lastIndex = index;
      }
  });
  
  // Remove todas as linhas após a última com conteúdo
  rows.slice(lastIndex + 1).forEach(row => row.remove());
}

// Atualização do DOMContentLoaded para configurar os filtros e aplicar o trim da tabela
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';

    fetchAndPopulate()
      .then(() => {
        if (overlay) overlay.style.display = 'none';
        // Configura filtros e trim como antes
        populateTipoFiltro();
        document.querySelectorAll('.filter-row input[type="text"]').forEach(input =>
          input.addEventListener('keyup', filterTable)
        );
        assignStatusClasses();
        trimTableEnding();
        aplicarEstiloStatus();
      })
      .catch(err => {
        if (overlay) overlay.style.display = 'none';
        console.error('Erro ao carregar dados:', err);
      });

    // Modal de processo
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay.querySelector('.modal-content');
    const modalIframe = document.getElementById('processo-iframe');
    const tableBody = document.querySelector('#detalhes table tbody');

    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', function() {
            modalContent.classList.remove('show');
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                modalIframe.src = 'about:blank';
            }, 400);
        });
    }

    if (tableBody && modalOverlay && modalIframe) {
        tableBody.addEventListener('click', function(event) {
            if (event.target.classList.contains('processo-link-icon')) {
                const td = event.target.closest('td');
                let processo = td ? td.textContent.replace('🔗', '').trim() : '';
                if (processo) {
                    navigator.clipboard.writeText(processo)
                        .then(() => {
                            // Monta a URL dinâmica
                            const url = `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`;
                            modalIframe.src = url;
                            modalOverlay.style.display = 'flex';
                            modalContent.classList.remove('show');
                            void modalContent.offsetWidth;
                            modalContent.classList.add('show');
                            td.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                        })
                        .catch(err => {
                            console.error('Falha ao copiar para a área de transferência:', err);
                            // Mesmo se falhar ao copiar, abre a modal com o link dinâmico
                            const url = `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`;
                            modalIframe.src = url;
                            modalOverlay.style.display = 'flex';
                            modalContent.classList.remove('show');
                            void modalContent.offsetWidth;
                            modalContent.classList.add('show');
                        });
                } else {
                    // Se não houver número de processo, pode abrir a página padrão ou mostrar aviso
                    modalIframe.src = 'https://www.tce.ce.gov.br/contexto-consulta-geral?tipo=processos';
                    modalOverlay.style.display = 'flex';
                    modalContent.classList.remove('show');
                    void modalContent.offsetWidth;
                    modalContent.classList.add('show');
                }
            }
        });

        // Função para fechar a modal
        function closeModals() {
            modalContent.classList.remove('show');
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                modalIframe.src = 'about:blank';
            }, 400);
        }

        // Fecha TUDO ao clicar fora da modal principal
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                closeModals();
            }
        });

        // Fecha TUDO ao pressionar ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modalOverlay.style.display === 'flex') {
                closeModals();
            }
        });
    } else {
        // Adiciona um log se algum elemento essencial não for encontrado
        console.error("Erro: Um ou mais elementos da modal não foram encontrados no DOM.");
    }
});

document.addEventListener('tabela-carregada', () => {
    aplicarEstiloStatus();
});

function aplicarEstiloStatus() {
    const rows = document.querySelectorAll('#detalhes table tbody tr');
    rows.forEach(row => {
        if (row.textContent.includes('CONTRATAÇÃO ATRASADA❗')) {
            row.classList.add('contratacao-atrasada');
        }
    });
}

// ------ Atualização Automática ------
// No final do arquivo main.js, adicione estas linhas:
window.SHEET_CSV_URL_GLOBAL = SHEET_CSV_URL;
window.globalFetchAndPopulate = fetchAndPopulate;

// Opcional, mas recomendado para melhor performance na atualização:
// Se você refatorar main.js para ter uma função que apenas popula o DOM com dados já processados:
function populateTableDOMWithData(processedDataRows) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; // Limpa a tabela

    const headers = [
        "ID PCA", "Área", "Tipo", "Projeto de Aquisição", 
        "Status Início", "Status do Processo", "Contratar Até", 
        "Valor PCA", "Orçamento", "Processo"
    ];

    processedDataRows.forEach(row => {
        const tr = document.createElement('tr');
        // Mapeamento dos índices do CSV para as colunas da tabela
        // CSV[2] -> ID PCA (0)
        // CSV[3] -> Área (1)
        // CSV[4] -> Tipo (2)
        // CSV[5] -> Projeto de Aquisição (3)
        // CSV[10] -> Status Início (4)
        // CSV[6] -> Status do Processo (5)
        // CSV[9] -> Contratar Até (6)
        // CSV[15] -> Valor PCA (7)
        // CSV[14] -> Orçamento (8)
        // CSV[13] -> Processo (9)
        const csvIndices = [2, 3, 4, 5, 10, 6, 9, 15, 14, 13]; 

        csvIndices.forEach((csvIndex, tableColIndex) => {
            const td = document.createElement('td');
            td.dataset.label = headers[tableColIndex];
            let value = row[csvIndex] || '';
            
            // Aplica a mesma lógica de formatação e manipulação de 'value' e 'td'
            // que existe dentro do loop de fetchAndPopulate em main.js
            // Exemplo para Status Início:
            if (tableColIndex === 4) { // Status Início
                value = formatStatusInicio(value); // Supondo que formatStatusInicio está acessível
            } else if (tableColIndex === 6) { // Contratar Até
                value = formatContratarAte(value); // Supondo que formatContratarAte está acessível
            } else if (tableColIndex === 8) { // Orçamento
                if (value === '') value = '<Não Orçado>';
            } else if (tableColIndex === 9) { // Processo
                if (value.trim() === '') {
                    td.textContent = '*';
                } else {
                    td.innerHTML = `${value} <span class="processo-link-icon" title="Abrir processo">🔗</span>`;
                }
                tr.appendChild(td);
                return; 
            } else if (tableColIndex === 5) { // Status do Processo
                const statusProcessoTexto = row[6]; // Coluna F do CSV original
                td.textContent = statusProcessoTexto;
                // Adicionar datasets conforme lógica em main.js
                if (statusProcessoTexto.includes('AUTUAÇÃO ATRASADA 💣')) {
                    if (row[11]) td.dataset.detalheAutuacao = row[11];
                }
                if (statusProcessoTexto.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
                    if (row[12]) td.dataset.detalheContratacao = row[12];
                }
                const outrosStatusRelevantes = ['AGUARDANDO DFD ⏳', 'AGUARDANDO ETP ⏳', 'DFD ATRASADO❗', 'ETP ATRASADO❗', 'ELABORANDO TR📝', 'ANÁLISE DE VIABILIDADE 📝'];
                if (outrosStatusRelevantes.some(s => statusProcessoTexto.includes(s))) {
                    if (row[11]) td.dataset.detalheStatusGeral = row[11];
                }
                const statusContratacaoRenovacao = ['EM CONTRATAÇÃO 🤝', 'EM RENOVAÇÃO 🔄'];
                if (statusContratacaoRenovacao.some(s => statusProcessoTexto.includes(s))) {
                    if (row[12]) td.dataset.detalheContratacaoRenovacao = row[12];
                }
                tr.appendChild(td);
                return;
            }
            
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Disparar eventos e funções pós-carga que estavam no final de fetchAndPopulate
    if (window.aplicarAnimacaoBomba) aplicarAnimacaoBomba();
    if (window.aplicarAnimacaoHourglass) aplicarAnimacaoHourglass();
    if (window.aplicarAnimacaoExclamation) aplicarAnimacaoExclamation();
    
    document.dispatchEvent(new Event('tabela-carregada')); // Crucial para outros scripts

    // Chamar funções que são configuradas no DOMContentLoaded após fetchAndPopulate
    if (typeof populateTipoFiltro === 'function') populateTipoFiltro();
    if (typeof assignStatusClasses === 'function') assignStatusClasses();
    if (typeof trimTableEnding === 'function') trimTableEnding();
    if (typeof aplicarEstiloStatus === 'function') aplicarEstiloStatus();
}
window.populateTableDOMWithData = populateTableDOMWithData;
