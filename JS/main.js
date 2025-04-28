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
                            // Coluna "Processo": se vazio, substitui por "*"
                            if (value.trim() === '') {
                                value = '*';
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
fetchAndPopulate()
  .then(() => {
    // Configura o filtro "tipo" como select
    populateTipoFiltro();
    
    // Configura os demais filtros de texto
    const filterInputs = document.querySelectorAll('.filter-row input[type="text"]');
    filterInputs.forEach(input => {
      input.addEventListener('keyup', filterTable);
    });
    
    // Aplica as classes de status (definidas em funcoes2.js)
    assignStatusClasses();
    
    // Remove as linhas após a última linha com conteúdo na coluna "Descrição do Objeto"
    trimTableEnding();

    // Aplica estilo para status
    aplicarEstiloStatus();
  })
  .catch(err => console.error('Erro ao processar a tabela:', err));
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