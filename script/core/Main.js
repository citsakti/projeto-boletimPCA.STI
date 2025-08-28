/**
 * main.js - Script principal do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Buscar os dados da planilha Google Sheets (CSV público)
 *  - Processar e montar a tabela HTML principal do boletim
 *  - Aplicar filtros dinâmicos, animações, estilos e funcionalidades de modal
 *  - Gerenciar eventos de carregamento, atualização e interação do usuário
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Dados:
 *   - CSV da planilha: Fonte primária de dados em formato tabular
 *   - Tabela HTML: Apresentação formatada e interativa dos dados
 * 
 * # Funções Principais:
 *   - fetchAndPopulate(): Busca dados do CSV e monta a tabela HTML
 *   - populateTipoFiltro(): Preenche filtros com valores únicos da tabela
 *   - filterTable(): Filtra as linhas conforme valores nos filtros
 *   - trimTableEnding(): Remove linhas em branco no final da tabela
 *   - aplicarEstiloStatus(): Destaca visualmente linhas com status específicos
 * 
 * # Fluxo de Execução:
 *   1. Carrega biblioteca PapaParse para processamento de CSV
 *   2. Busca os dados da planilha e identifica cabeçalho correto
 *   3. Processa e filtra apenas as linhas válidas
 *   4. Monta as linhas da tabela na ordem correta
 *   5. Aplica formatações específicas para cada coluna
 *   6. Dispara o evento "tabela-carregada" ao finalizar
 * 
 * # Dependências:
 *   - PapaParse: Para processamento de CSV
 *   - Funções de formatação (em outros arquivos)
 *   - Manipulação de modal para visualização de processos
 *
 *      Permite abrir um modal ao clicar no ícone de processo, copiando o número do processo
 *      e abrindo o iframe com a consulta correspondente.
 *
 * - Eventos DOMContentLoaded:
 *      Inicializa o carregamento dos dados, filtros, listeners e modais ao carregar a página.
 *
 * - Atualização automática:
 *      Expõe funções globais para permitir atualização automática dos dados sem recarregar a página.
 *
 * Observações:
 * - O mapeamento das colunas do CSV para a tabela HTML é feito explicitamente, garantindo a ordem correta.
 * - Funções auxiliares como formatStatusInicio e formatContratarAte são usadas para formatação de valores específicos.
 * - O evento customizado "tabela-carregada" é disparado para integração com outros scripts.
 * - O código está preparado para lidar com animações e detalhes extras em status específicos.
 * -----------------------------------------------------------------------------
 */

// Definindo a URL da planilha como variável global (será atribuída dinamicamente pelo YearSelector)
let SHEET_CSV_URL = 'about:blank';

// Busca dados da planilha e preenche a tabela
function fetchAndPopulate() {
    if (window.getYearUrls && typeof window.getYearUrls === 'function') {
        const urls = window.getYearUrls();
        SHEET_CSV_URL = urls.main;
        const backup = urls.mainBackup;
        const papaBaseOptions = { header: false, skipEmptyLines: true };
        const useFallback = window.fetchCsvWithFallback ?
            window.fetchCsvWithFallback(urls.main, backup, papaBaseOptions) :
            new Promise((resolve, reject) => {
                Papa.parse(urls.main, { download: true, ...papaBaseOptions, complete: r=>resolve({ urlUsed: urls.main, results: r }), error: reject });
            });
        return useFallback.then(({ results, urlUsed }) => {
            const allRows = results.data || [];
            const headerRowIndex = allRows.findIndex(row => row && row[2] && row[2].trim() === 'ID PCA');
            if (headerRowIndex < 0) throw new Error('Cabeçalho "ID PCA" não encontrado');
            const dataRows = allRows.slice(headerRowIndex + 1);
            let lastValidIndex = -1;
            dataRows.forEach((row, i) => { if (row && row[5] && row[5].trim() !== '') lastValidIndex = i; });
            const validDataRows = dataRows.slice(0, lastValidIndex + 1);
            const tbody = document.querySelector('table tbody');
            if (!tbody) throw new Error('tbody da tabela principal não encontrado');
            tbody.innerHTML = '';
            const headers = ["ID PCA", "Área", "Tipo", "Projeto de Aquisição", "Status Início", "Status do Processo", "Contratar Até", "Valor PCA", "Orçamento", "Processo"];
            validDataRows.forEach(row => {
                const tr = document.createElement('tr');
                [2, 3, 4, 5, 10, 6, 9, 15, 14, 13].forEach((i, colIndex) => {
                    const td = document.createElement('td');
                    td.dataset.label = headers[colIndex];
                    let value = row[i] || '';
                    if (colIndex === 3) { // Projeto de Aquisição
                        const numeroContrato = row[21];
                        const numeroRegistro = row[22];
                        if (numeroContrato) td.setAttribute('data-contrato', numeroContrato.trim());
                        if (numeroRegistro) td.setAttribute('data-registro', numeroRegistro.trim());
                    }
                    if (colIndex === 7) td.setAttribute('data-valor-original', value);
                    if (colIndex === 4) value = formatStatusInicio(value);
                    else if (colIndex === 6) value = formatContratarAte(value);
                    else if (colIndex === 8 && value === '') value = '<Não Orçado>';
                    else if (colIndex === 9) {
                        if (value.trim() === '') td.textContent = '*'; else {
                            td.innerHTML = `${value} <span class="processo-link-icon" title="Abrir processo">🔗</span>`;
                            const modalidadeX = row[23] || '';
                            const numeroY = row[24] || '';
                            if (numeroY && String(numeroY).trim() !== '-' ) {
                                td.setAttribute('data-x', String(modalidadeX).trim());
                                td.setAttribute('data-y', String(numeroY).trim());
                                const span = document.createElement('span');
                                span.className = 'comprasgov-link-icon';
                                span.title = 'Abrir acompanhamento no Comprasnet';
                                span.textContent = ' 🛍️';
                                span.style.cursor = 'pointer';
                                span.setAttribute('data-x', String(modalidadeX).trim());
                                span.setAttribute('data-y', String(numeroY).trim());
                                td.appendChild(span);
                            }
                        }
                        tr.appendChild(td);
                        return;
                    } else if (colIndex === 5) {
                        const statusProcessoTexto = row[6];
                        td.textContent = statusProcessoTexto;
                        if (statusProcessoTexto.includes('AUTUAÇÃO ATRASADA 💣')) {
                            const detalheAutuacao = row[11];
                            if (detalheAutuacao) td.dataset.detalheAutuacao = detalheAutuacao;
                        }
                        if (statusProcessoTexto.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
                            const detalheContratacao = row[12];
                            if (detalheContratacao) td.dataset.detalheContratacao = detalheContratacao;
                        }
                        const outrosStatusRelevantes = ['AGUARDANDO DFD ⏳','AGUARDANDO ETP ⏳','DFD ATRASADO❗','ETP ATRASADO❗','ELABORANDO TR📝','ANÁLISE DE VIABILIDADE 📝'];
                        if (outrosStatusRelevantes.some(s => statusProcessoTexto.includes(s))) {
                            const detalheStatusGeral = row[11];
                            if (detalheStatusGeral) td.dataset.detalheStatusGeral = detalheStatusGeral;
                        }
                        const statusContratacaoRenovacao = ['EM CONTRATAÇÃO 🤝','EM RENOVAÇÃO 🔄'];
                        if (statusContratacaoRenovacao.some(s => statusProcessoTexto.includes(s))) {
                            const detalheColunaM = row[12];
                            if (detalheColunaM) td.dataset.detalheContratacaoRenovacao = detalheColunaM;
                        }
                        tr.appendChild(td);
                        return;
                    }
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            if (window.aplicarAnimacaoBomba) aplicarAnimacaoBomba();
            if (window.aplicarAnimacaoHourglass) aplicarAnimacaoHourglass();
            if (window.aplicarAnimacaoExclamation) aplicarAnimacaoExclamation();
            document.dispatchEvent(new Event('tabela-carregada'));
            console.info('Tabela carregada via', urlUsed.includes('script.google') ? 'backup' : 'primário');
        })
        .catch(err => {
            console.error('Erro ao carregar dados com fallback:', err);
            throw err;
        });
    }
    return Promise.reject(new Error('getYearUrls indisponível'));
}

// Função para popular o filtro "tipo" como select com as opções da tabela
function populateTipoFiltro() {
    // Esta função pode não ser mais necessária se os filtros são populados dinamicamente
    // pelo novo sistema google-sheet-filters.js ao clicar no botão de filtro da coluna.
    // Comente ou remova se for o caso.
    /*
    const tipoFiltroContainer = document.getElementById('tipo-filter');
    if (!tipoFiltroContainer) return;
    
    const tableRows = document.querySelectorAll('table tbody tr');
    const tipos = new Set();
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[1]) { // Ajuste o índice da coluna se necessário
            const tipoText = cells[1].textContent.trim();
            if (tipoText) tipos.add(tipoText);
        }
    });
    
    const select = document.createElement('select');
    select.id = 'tipo-filter-select'; // Mantenha ou ajuste o ID conforme necessário
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Todos";
    select.appendChild(defaultOption);

    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.toLowerCase();
        option.textContent = tipo;
        select.appendChild(option);
    });
    
    tipoFiltroContainer.innerHTML = "";
    tipoFiltroContainer.appendChild(select);
    
    // A filtragem agora é tratada pelo novo sistema, então o listener abaixo pode não ser necessário aqui.
    // select.addEventListener('change', filterTable);
    */
}

// Modificação da função filterTable para considerar inputs e selects
function filterTable() {
    // Esta função é provavelmente substituída pela masterFilterFunction em google-sheet-filters.js
    // Comente ou remova se for o caso.
    /*
    const filterElements = document.querySelectorAll('.filter-row input[type="text"], .filter-row select');
    const filters = Array.from(filterElements).map(el => el.value.trim().toLowerCase());

    const tableRows = document.querySelectorAll('table tbody tr');

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let showRow = true;

        filters.forEach((filterText, index) => {
            // Esta lógica de correspondência de índice precisa ser robusta
            // ou os data-attributes nos inputs de filtro precisam ser usados para mapear para as colunas corretas.
            if (cells[index] && filterText) {
                if (!cells[index].textContent.toLowerCase().includes(filterText)) {
                    showRow = false;
                }
            }
        });
        row.style.display = showRow ? "" : "none";
    });
    // Se alternaCoresLinhas for mantida, chame-a aqui ou na função de filtro mestre.
    */
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
        if (overlay) overlay.style.display = 'none'; // Esconde o overlay após o carregamento
        // Configura filtros e trim como antes
        // populateTipoFiltro(); // Comentado - o novo sistema lida com isso
        
        // Os listeners para inputs de texto na filter-row são removidos pois os inputs foram substituídos por botões.
        // document.querySelectorAll('.filter-row input[type="text"]').forEach(input =>
        //   input.addEventListener('keyup', filterTable)
        // );
        
        // A inicialização dos novos filtros estilo Google Sheets deve ser chamada aqui ou no google-sheet-filters.js
        if (typeof initializeGoogleSheetFilters === 'function') {
            initializeGoogleSheetFilters();
        }

        assignStatusClasses();
        trimTableEnding();
        aplicarEstiloStatus();
      })
      .catch(err => {
        if (overlay) overlay.style.display = 'none'; // Esconde o overlay mesmo em caso de erro
        console.error('Erro ao carregar dados:', err);      });
    
    // Modal de processo - funcionalidade movida para ProcessoModal.js
    // O modal é inicializado automaticamente pelo módulo ProcessoModal
});

document.addEventListener('tabela-carregada', () => {
    aplicarEstiloStatus();
});

function aplicarEstiloStatus() {
    const rows = document.querySelectorAll('#detalhes table tbody tr');
    rows.forEach(row => {
        if (row.textContent.includes('CONTRATAÇÃO ATRASADA')) {
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
    if (!tbody) return; // Adiciona verificação de segurança
    tbody.innerHTML = '';
    const headers = [
        "ID PCA", "Área", "Tipo", "Projeto de Aquisição", 
        "Status Início", "Status do Processo", "Contratar Até", 
        "Valor PCA", "Orçamento", "Processo"
    ];

    processedDataRows.forEach(row => { // row aqui deve ser um array de valores na ordem correta
        const tr = tbody.insertRow();
        headers.forEach((headerText, index) => {
            const cell = tr.insertCell();
            let cellData = row[index] !== undefined && row[index] !== null ? row[index] : '';
            
            // Aplica a mesma lógica de formatação e manipulação de 'value' e 'td'
            // que existe dentro do loop de fetchAndPopulate em main.js
            if (headerText === "Status Início") {
                // cellData = formatStatusInicio(cellData); // Supondo que você tenha essa função
            } else if (headerText === "Contratar Até") {
                // cellData = formatContratarAte(cellData); // Supondo que você tenha essa função
            }
            // Adicione mais formatações conforme necessário

            cell.textContent = cellData;            // Adiciona classes ou atributos se necessário, por exemplo, para o ícone do processo
            if (headerText === "Processo" && cellData) {
                const icon = document.createElement('span');
                icon.classList.add('processo-link-icon'); // Usa a mesma classe que o ProcessoModal.js espera
                icon.textContent = ' 🔗'; // Usa o mesmo ícone
                icon.style.cursor = 'pointer';
                icon.title = `Abrir processo ${cellData}`;
                // A lógica de click agora é tratada pelo ProcessoModal.js através da classe 'processo-link-icon'
                cell.appendChild(icon);

                // Tentativa de manter compatibilidade: adicionar 🛍️ se data-x/y estiverem no tr ou dataRow
                const modalidadeX = tr.getAttribute('data-x') || '';
                const numeroY = tr.getAttribute('data-y') || '';
                if (numeroY) {
                    const comprasIcon = document.createElement('span');
                    comprasIcon.className = 'comprasgov-link-icon';
                    comprasIcon.textContent = ' 🛍️';
                    comprasIcon.title = 'Abrir acompanhamento no Comprasnet';
                    comprasIcon.style.cursor = 'pointer';
                    comprasIcon.setAttribute('data-x', modalidadeX);
                    comprasIcon.setAttribute('data-y', numeroY);
                    cell.appendChild(comprasIcon);
                }
            }
        });
    });

    // Disparar eventos e funções pós-carga que estavam no final de fetchAndPopulate
    if (window.aplicarAnimacaoBomba) window.aplicarAnimacaoBomba();
    if (window.aplicarAnimacaoHourglass) window.aplicarAnimacaoHourglass();
    if (window.aplicarAnimacaoExclamation) window.aplicarAnimacaoExclamation();
    
    document.dispatchEvent(new Event('tabela-carregada')); // Essencial para que outros scripts (como filtros) saibam que a tabela foi atualizada
    
    // Chamar funções que são configuradas no DOMContentLoaded após fetchAndPopulate
    // if (typeof populateTipoFiltro === 'function') populateTipoFiltro(); // Comentado
    if (typeof assignStatusClasses === 'function') assignStatusClasses();
    if (typeof trimTableEnding === 'function') trimTableEnding();
    if (typeof aplicarEstiloStatus === 'function') aplicarEstiloStatus();    
    // Reinitialize os novos filtros do Google Sheets se a tabela for repopulada dinamicamente
    if (typeof initializeGoogleSheetFilters === 'function') {
        initializeGoogleSheetFilters();
    }
    
    // Reinicializa o ProcessoModal para capturar novos elementos da tabela
    if (window.processoModalInstance && typeof window.processoModalInstance.reinitialize === 'function') {
        window.processoModalInstance.reinitialize();
    }
    // Garante que as cores das linhas sejam aplicadas após a carga/atualização dos dados
    if (typeof alternaCoresLinhas === 'function') {
        alternaCoresLinhas();
    }
}
window.populateTableDOMWithData = populateTableDOMWithData;
