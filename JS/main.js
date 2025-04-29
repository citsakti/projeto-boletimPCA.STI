document.addEventListener('DOMContentLoaded', initFiltros);
document.addEventListener('tabela-carregada', initFiltros); // NOVO

function initFiltros() {
    const tabela = document.querySelector("#detalhes table");
    if (!tabela) return; // segurança
    if (!tabela.querySelector('tbody tr')) return; // ainda sem linhas? sai

    // Listener para o filtro mobile "Projeto de Aquisição"
    const mobileProjetoInput = document.getElementById('filtroProjeto');
    if (mobileProjetoInput) {
        mobileProjetoInput.addEventListener('keyup', filterTable);
    }

    // Função para obter valores únicos de uma coluna
    function getValoresUnicos(colIdx) {
        const valores = new Set();
        tabela.querySelectorAll('tbody tr').forEach(tr => {
            const td = tr.children[colIdx];
            if (td) valores.add(td.textContent.trim());
        });
        return Array.from(valores).sort();
    }

    // Preencher filtro Área (coluna 1) sem valores vazios
    const selectArea = document.getElementById('filter-area');
    if (selectArea) {
        selectArea.innerHTML = '<option value="">Todas as Áreas</option>';
        getValoresUnicos(1)
            .filter(valor => valor.trim() !== '')
            .forEach(valor => {
                const opt = document.createElement('option');
                opt.value = valor;
                opt.textContent = valor;
                selectArea.appendChild(opt);
            });
        selectArea.onchange = filterTable;
    }

    // Corrigindo o filtro Tipo (coluna 2) para se adequar ao novo HTML sem valores vazios
    const selectTipo = document.querySelector('.filter-row th:nth-child(3) select');
    if (selectTipo) {
        selectTipo.innerHTML = '<option value="">Todos</option>';
        getValoresUnicos(2)
            .filter(valor => valor.trim() !== '')
            .forEach(valor => {
                const opt = document.createElement('option');
                opt.value = valor;
                opt.textContent = valor;
                selectTipo.appendChild(opt);
            });
        selectTipo.onchange = filterTable;
    }

    // Preencher filtro Orçamento (coluna 8)
    const selectOrcamento = document.getElementById('filter-orcamento');
    if (selectOrcamento) {
        selectOrcamento.innerHTML = '<option value="">Todos os Orçamentos</option>';
        getValoresUnicos(8)
            .filter(valor => valor.trim() !== '')
            .forEach(valor => {
                const opt = document.createElement('option');
                opt.value = valor;
                opt.textContent = valor;
                selectOrcamento.appendChild(opt);
            });
        selectOrcamento.onchange = filterTable;
    }

    // Configurar o botão de limpar filtros
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) {
        limparBtn.onclick = function() {
            // Limpar inputs de texto e selects existentes da filter-row
            document.querySelectorAll(".filter-row input[type='text']").forEach(input => input.value = "");
            document.querySelectorAll(".filter-row select").forEach(select => {
                if (select) select.value = "";
            });
            // Limpar o filtro mobile "Projeto de Aquisição"
            const mobileProjetoInput = document.getElementById('filtroProjeto');
            if (mobileProjetoInput) {
                mobileProjetoInput.value = "";
            }
            // Limpa o dropdown de status via a função auxiliar
            clearStatusDropdown();
            
            // Reset do toggle "cancelados" para revelar todos
            window.canceladosOcultos = false;
            let btnToggle = document.getElementById('btnToggleCancelados');
            if (btnToggle) {
                btnToggle.textContent = 'Ocultar Cancelados ❌';
            }
            // Garante que todas as linhas com "CANCELADO ❌" sejam exibidas
            document.querySelectorAll('table tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[5] && cells[5].textContent.includes('CANCELADO ❌')) {
                    row.style.display = '';
                }
            });
            
            // Aplica os filtros atualizados (que agora estarão limpos)
            filterTable();
        };
    }

    // NOVO: Adiciona listener para inputs de texto (filtro de escrever)
    document.querySelectorAll(".filter-row input[type='text']").forEach(input => {
        input.addEventListener('keyup', filterTable);
    });

    // Chama filterTable para aplicar filtros combinados
    filterTable();

    // Ao final de initFiltros(), depois de confirmar que a tabela contém linhas:
    criaDropdownMulti(5, 'status-filter');     // 5 = índice da coluna “Status do Processo”

    /* =========  CONSTRUTOR DO DROPDOWN  =========== */
    function criaDropdownMulti(colIdx, dropdownId) {
        const root = document.getElementById(dropdownId); // ex.: "status-filter"
        const lista  = root.querySelector('.options');
        // Se já existir opções, não recria o dropdown para evitar duplicação
        if (lista && lista.children.length > 0) return;
        
        const toggle = root.querySelector('.filter-toggle');
        const painel = root.querySelector('.filter-panel');
        const campoBusca = root.querySelector('.search');
        const lblContador = root.querySelector('.count');
        const linkSelTudo = root.querySelector('.select-all');
        const linkLimpar  = root.querySelector('.clear');

        // --- preenche opções ---
        getValoresUnicos(colIdx).forEach(valor => {
            const li = document.createElement('li');
            li.innerHTML =
              `<label><input type="checkbox" value="${valor}">
                 <span>${valor}</span></label>`;
            lista.appendChild(li);
        });

        // --- abre/fecha painel ---
        toggle.addEventListener('click', () => {
            painel.style.display = painel.style.display === 'block' ? 'none' : 'block';
        });
        // fecha se clicar fora
        document.addEventListener('click', e => {
            if (!root.contains(e.target)) painel.style.display = 'none';
        });

        // --- BUSCA instantânea ---
        campoBusca.addEventListener('keyup', () => {
            const termo = campoBusca.value.toLowerCase();
            lista.querySelectorAll('li').forEach(li => {
                li.style.display = li.textContent.toLowerCase().includes(termo) ? '' : 'none';
            });
        });

        // --- selecionar / des-selecionar clique no item inteiro ---
        lista.addEventListener('click', e => {
            const li = e.target.closest('li');
            if (!li) return;
            const cb = li.querySelector('input[type="checkbox"]');
            // Se o clique foi diretamente no checkbox, apenas atualiza a classe
            if (e.target.tagName.toLowerCase() === 'input') {
                li.classList.toggle('selected', cb.checked);
                atualizar();
                return;
            }
            // Previne o comportamento padrão (evita dupla alteração do estado)
            e.preventDefault();
            // Clique no li (fora do checkbox): inverte o estado
            cb.checked = !cb.checked;
            li.classList.toggle('selected', cb.checked);
            atualizar();
        });

        // --- links “Selecionar tudo / Limpar” ---
        linkSelTudo.addEventListener('click', e => {
            e.preventDefault();
            lista.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
            lista.querySelectorAll('li').forEach(li => {
               const cb = li.querySelector('input');
               li.classList.toggle('selected', cb.checked);
            });
            atualizar();
        });

        linkLimpar.addEventListener('click', e => {
            e.preventDefault();
            lista.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            lista.querySelectorAll('li').forEach(li => {
               const cb = li.querySelector('input');
               li.classList.toggle('selected', cb.checked);
            });
            atualizar();
        });

        // --- função que realmente filtra ---
        function atualizar(){
            // contador visível
            const marcados = lista.querySelectorAll('input:checked');
            lblContador.textContent = marcados.length ? `Mostrando ${marcados.length}` : '';

            // Atualiza os filtros combinados
            filterTable();
        }
    }

    // Função auxiliar para limpar o dropdown de status
    function clearStatusDropdown() {
        const dropdown = document.getElementById('status-filter');
        if (!dropdown) return;
        const lista = dropdown.querySelector('.options');
        if (!lista) return;
        // Limpa os checkboxes e atualiza a classe 'selected' em cada li:
        lista.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        lista.querySelectorAll('li').forEach(li => {
            const cb = li.querySelector('input');
            li.classList.toggle('selected', cb.checked);
        });
        // Reinicia o contador do dropdown
        const lblContador = dropdown.querySelector('.count');
        if (lblContador) lblContador.textContent = '';
        // Reinicia o filtro do painel de resumo
        window.painelFilterStatus = 'TODOS';
    }
}

// Filtragem combinada de Área, Tipo, Status e Texto
function filterTable(){
    const tabela = document.querySelector("#detalhes table");
    if (!tabela) return;
    
    // Filtros dos selects já existentes
    const selectArea = document.getElementById('filter-area');
    const selectTipo = document.querySelector('.filter-row th:nth-child(3) select');
    const selectOrcamento = document.getElementById('filter-orcamento');

    const areaValue = selectArea ? selectArea.value : '';
    const tipoValue = selectTipo ? selectTipo.value : '';
    const orcamentoValue = selectOrcamento ? selectOrcamento.value : '';

    // Filtro de texto dos inputs na filter-row
    const textFilters = {};
    document.querySelectorAll(".filter-row input[type='text'][data-col-index]").forEach(input => {
         const col = input.getAttribute('data-col-index');
         const val = input.value.trim().toLowerCase();
         if (val) textFilters[col] = val;
    });
    
    // Filtro mobile para "Projeto de Aquisição" (coluna 3)
    const filtroProjeto = document.getElementById('filtroProjeto') ? 
                            document.getElementById('filtroProjeto').value.trim().toLowerCase() : '';

    tabela.querySelectorAll('tbody tr').forEach(tr => {
         const areaText   = tr.children[1]?.textContent.trim() || '';
         const tipoText   = tr.children[2]?.textContent.trim() || '';
         const projetoText = tr.children[3]?.textContent.trim() || '';
         const statusText = tr.children[5]?.textContent.trim() || '';
         const orcamentoText = tr.children[8]?.textContent.trim() || '';
         
         let mostrar = true;
         if (areaValue && areaText !== areaValue) mostrar = false;
         if (tipoValue && tipoText !== tipoValue) mostrar = false;
         if (filtroProjeto && !projetoText.toLowerCase().includes(filtroProjeto)) mostrar = false;
         if (orcamentoValue && orcamentoText !== orcamentoValue) mostrar = false;
         
         // Aplica os demais filtros de texto
         for (const col in textFilters) {
             const cellText = tr.children[col]?.textContent.toLowerCase() || '';
             if (!cellText.includes(textFilters[col])) {
                 mostrar = false;
                 break;
             }
         }
         
         // Filtragem para Status (dropdown ou painel)
         const checkedStatus = Array.from(
             document.querySelectorAll('#status-filter input[type="checkbox"]:checked')
         ).map(cb => cb.value);
    
         if (checkedStatus.length > 0) {
             window.painelFilterStatus = 'TODOS';
             if (!checkedStatus.some(val => statusText.toLowerCase().includes(val.toLowerCase())))
                 mostrar = false;
         } else if (window.painelFilterStatus && window.painelFilterStatus !== 'TODOS') {
             if (!statusText.toLowerCase().includes(window.painelFilterStatus.toLowerCase()))
                 mostrar = false;
         }
         
         tr.style.display = mostrar ? '' : 'none';
    });

    // Recalcular as linhas visíveis para aplicar o padrão de linhas alternadas
    const visibleRows = Array.from(tabela.querySelectorAll('tbody tr'))
                             .filter(tr => tr.style.display !== 'none');
    visibleRows.forEach((tr, index) => {
        tr.classList.remove('row-even', 'row-odd');
        if (index % 2 === 0) {
            tr.classList.add('row-even');
        } else {
            tr.classList.add('row-odd');
        }
    });
}
