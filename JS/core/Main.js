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
                        // Adicionar atributo data-contrato e data-registro para coluna "Projeto de Aquisição"
                        if (colIndex === 3) { // Coluna "Projeto de Aquisição"
                            const numeroContrato = row[21]; // Coluna V do CSV (índice 21)
                            const numeroRegistro = row[22]; // Coluna W do CSV (índice 22)
                            if (numeroContrato && numeroContrato.trim() !== '') {
                                td.setAttribute('data-contrato', numeroContrato.trim());
                            }
                            if (numeroRegistro && numeroRegistro.trim() !== '') {
                                td.setAttribute('data-registro', numeroRegistro.trim());
                            }
                        }
                        // Adicionar o valor original do CSV como atributo data-valor-original na coluna Valor PCA
                        if (colIndex === 7) {
                            td.setAttribute('data-valor-original', value);
                        }
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
        console.error('Erro ao carregar dados:', err);
      });    // Modal de processo
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const modalIframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
    const tableBody = document.querySelector('#detalhes table tbody');    // Função centralizada para fechar modal
    function closeModals() {
        if (modalContent) {
            modalContent.classList.remove('show');
        }
        
        // Otimização: esconder o overlay imediatamente para melhor UX
        if (modalOverlay) {
            modalOverlay.style.opacity = '0';
            modalOverlay.style.pointerEvents = 'none';
        }
        
        setTimeout(() => {
            if (modalOverlay) {
                modalOverlay.style.display = 'none';
                // Restaurar propriedades para próxima abertura
                modalOverlay.style.opacity = '';
                modalOverlay.style.pointerEvents = '';
            }
            if (modalIframe) {
                modalIframe.src = 'about:blank';
                // Limpar também o iframe Bootstrap se existir
                const bootstrapIframe = document.getElementById('processo-iframe');
                if (bootstrapIframe) {
                    bootstrapIframe.src = 'about:blank';
                }
            }
            // Restaurar rolagem da página
            document.body.style.overflow = '';
        }, 400);
    }

    // Event listeners para botões de fechar - usando delegação de eventos
    document.addEventListener('click', function(event) {
        if (event.target.id === 'close-modal-btn' || 
            event.target.id === 'close-modal-btn-legacy' ||
            event.target.classList.contains('btn-close')) {
            event.preventDefault();
            event.stopPropagation();
            closeModals();
        }
    });

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
                    modalContent.classList.add('show');                }
            }
        });

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

            cell.textContent = cellData;

            // Adiciona classes ou atributos se necessário, por exemplo, para o ícone do processo
            if (headerText === "Processo" && cellData) {
                const icon = document.createElement('span');
                icon.classList.add('process-icon'); // Adicione uma classe para estilização
                icon.textContent = ' 📄'; // Exemplo de ícone
                icon.style.cursor = 'pointer';
                icon.title = `Abrir processo ${cellData}`;
                icon.addEventListener('click', () => {
                    // Lógica para abrir modal do processo, similar à existente
                    const modalOverlay = document.getElementById('processo-modal-overlay');
                    const modalIframe = document.getElementById('processo-iframe');
                    if (modalOverlay && modalIframe) {
                        const numeroProcesso = cellData.replace(/[^0-9]/g, '');
                        modalIframe.src = `https://sei.example.com/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=${numeroProcesso}`;
                        modalOverlay.style.display = 'flex';
                    }
                });
                cell.appendChild(icon);
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
    // Garante que as cores das linhas sejam aplicadas após a carga/atualização dos dados
    if (typeof alternaCoresLinhas === 'function') {
        alternaCoresLinhas();
    }
}
window.populateTableDOMWithData = populateTableDOMWithData;
