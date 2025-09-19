(function(){
  function normalizeText(el){
    if(!el) return '';
    return (el.textContent || '').trim();
  }

  function detectType(values){
    // values: array of strings (first non-empty samples)
    for(const v of values){
      if(!v) continue;
      // Date dd/mm/yyyy or d/m/yy
      if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) return 'date';
      // Currency/number with Brazilian format
      const numLike = v.replace(/[^0-9,\-.]/g, '');
      if(numLike && /[0-9]/.test(numLike)){
        // If it contains comma as decimal or dot as thousand, call it number
        return 'number';
      }
    }
    return 'string';
  }

  function parseValue(v, type){
    if(!v) return {type, value: null, str: ''};
    switch(type){
      case 'number':{
        // Remove currency and spaces, keep digits, comma and dot, minus
        let s = v.replace(/[^0-9,\-.]/g, '').trim();
        if(!s) return {type, value: null, str: v};
        // Convert Brazilian format: thousands '.' and decimal ','
        // Heuristic: if there is both '.' and ',', assume ',' is decimal
        if(s.indexOf(',') !== -1){
          s = s.replace(/\./g, '').replace(',', '.');
        }
        const n = Number(s);
        return {type, value: isNaN(n) ? null : n, str: v};
      }
      case 'date':{
        // dd/mm/yyyy
        const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if(!m) return {type, value: null, str: v};
        let [_, d, mth, y] = m; // eslint-disable-line no-unused-vars
        if(y.length === 2){
          const yy = parseInt(y,10);
          y = (yy >= 70 ? '19' : '20') + y;
        }
        const iso = `${y.padStart(4,'0')}-${mth.padStart(2,'0')}-${d.padStart(2,'0')}`;
        const t = Date.parse(iso);
        return {type, value: isNaN(t) ? null : t, str: v};
      }
      default:
        return {type: 'string', value: v.toLocaleLowerCase(), str: v};
    }
  }

  function getColumnValues(rows, colIndex){
    const vals = [];
    for(const tr of rows){
      const cells = tr.children;
      if(colIndex >= cells.length) continue;
      const txt = normalizeText(cells[colIndex]);
      if(txt){
        vals.push(txt);
        if(vals.length >= 5) break; // sample a few
      }
    }
    return vals;
  }

  function sortTable(table, colIndex, dir){
    const tbody = table.tBodies[0];
    if(!tbody) return;

    // If table has expandable pattern, skip to avoid breaking layout
    if(table.querySelector('tr.expandable-row, tr.details-row')){
      console.info('[TableSorter] Tabela com linhas expansíveis detectada; ordenação ignorada para evitar quebra.');
      return;
    }

    // Collect rows
    const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
    if(rows.length <= 1) return;

    const headerRow = table.tHead ? table.tHead.rows[0] : null;
    const th = headerRow ? headerRow.cells[colIndex] : null;

    // Determine type by sampling column values
    const sampleVals = getColumnValues(rows, colIndex);
    const type = detectType(sampleVals);

    // Decorate
    const decorated = rows.map((tr, idx)=>{
      const cell = tr.children[colIndex];
      const valText = normalizeText(cell);
      const parsed = parseValue(valText, type);
      return {tr, idx, parsed};
    });

    decorated.sort((a,b)=>{
      const av = a.parsed.value;
      const bv = b.parsed.value;
      const aNull = (av === null || av === undefined || av === '');
      const bNull = (bv === null || bv === undefined || bv === '');
      if(aNull && bNull) return a.idx - b.idx; // stable
      if(aNull) return 1; // nulls last
      if(bNull) return -1;
      if(av < bv) return dir === 'asc' ? -1 : 1;
      if(av > bv) return dir === 'asc' ? 1 : -1;
      return a.idx - b.idx;
    });

    // Apply
    const frag = document.createDocumentFragment();
    decorated.forEach(d=>frag.appendChild(d.tr));
    tbody.appendChild(frag);

    // Update header classes
    if(th){
      Array.from(headerRow.cells).forEach(c=>{
        c.classList.remove('th-sort-asc','th-sort-desc');
        c.removeAttribute('aria-sort');
      });
      th.classList.add(dir === 'asc' ? 'th-sort-asc' : 'th-sort-desc');
      th.dataset.sortDir = dir;
      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
    }
  }

  function onHeaderClick(e){
    const th = e.target.closest('th');
    if(!th) return;
    const thead = th.closest('thead');
    if(!thead) return;
    const table = th.closest('table');
    if(!table) return;

    // Apenas tabelas de detalhes (linhas simples) por segurança
    if(!table.classList.contains('project-details-table')) return;

    // Ignore empty header
    const headerText = normalizeText(th);
    if(!headerText) return;

    const row = th.parentElement;
    const colIndex = Array.prototype.indexOf.call(row.children, th);
    const current = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
    sortTable(table, colIndex, current);
  }

  function enableTableSorting(root){
    const container = root || document;
    const dash = container.getElementById ? container.getElementById('analytics-dashboard') : document.getElementById('analytics-dashboard');
    const target = dash || container;
    if(!target) return;

    // Use event delegation once
    if(!target.__tableSorterBound){
      target.addEventListener('click', onHeaderClick);
      target.__tableSorterBound = true;
    }
  }

  // =====================
  // Formatação de Moeda BRL (Coluna "Valor PCA")
  // =====================
  function parseNumeric(text){
    if(!text) return null;
    let s = text.replace(/[^0-9,.-]/g,'').trim();
    if(!s) return null;
    if(s.indexOf(',') !== -1){
      s = s.replace(/\./g,'').replace(',', '.');
    }
    const n = Number(s);
    return isNaN(n) ? null : n;
  }

  function formatBRL(n){
    return 'R$ ' + n.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function findColumnIndexByHeader(table, headerMatch){
    const thead = table.tHead;
    if(!thead || !thead.rows.length) return -1;
    // Primeira linha de cabeçalho sem considerar linha de filtros
    const headerRow = thead.rows[0];
    for(let i=0;i<headerRow.cells.length;i++){
      const txt = normalizeText(headerRow.cells[i]).toLowerCase();
      if(txt === headerMatch.toLowerCase()) return i;
    }
    return -1;
  }

  function formatCurrencyCell(cell){
    if(!cell || cell.dataset.currencyFormatted) return;
    const raw = normalizeText(cell);
    const n = parseNumeric(raw);
    if(n === null) return; // mantém como está
    const formatted = formatBRL(n);
    // Se já existe span padronizado, apenas atualiza
    const existing = cell.querySelector('.cell-content');
    if (existing) {
      existing.textContent = formatted;
    } else {
      // Caso tenha sido criada antes sem span, padroniza agora
      cell.innerHTML = '<span class="cell-content col-valor-pca">'+formatted+'</span>';
    }
    cell.dataset.currencyFormatted = '1';
  }

  function formatCurrencyColumn(table, headerText){
    if(!table) return;
    const colIndex = findColumnIndexByHeader(table, headerText || 'Valor PCA');
    if(colIndex === -1) return;
    const tbody = table.tBodies[0];
    if(!tbody) return;
    // Formata linhas existentes
    Array.from(tbody.rows).forEach(tr => {
      if(colIndex < tr.cells.length){
        formatCurrencyCell(tr.cells[colIndex]);
      }
    });
    // Observa novas linhas adicionadas
    if(!tbody.__currencyObserver){
      const obs = new MutationObserver(muts => {
        muts.forEach(m => {
          m.addedNodes && m.addedNodes.forEach(node => {
            if(node.nodeType === 1 && node.tagName === 'TR'){
              if(colIndex < node.cells.length){
                formatCurrencyCell(node.cells[colIndex]);
              }
            }
          });
        });
      });
      obs.observe(tbody, {childList:true});
      tbody.__currencyObserver = obs;
    }
  }

  function autoInitCurrencyFormatting(){
    // Tenta várias vezes pois os dados podem chegar assincronamente
    let attempts = 0;
    const maxAttempts = 40; // ~20s se intervalo 500ms
    const interval = setInterval(()=>{
      attempts++;
      const tables = document.querySelectorAll('table');
      let applied = false;
      tables.forEach(tbl => {
        if(findColumnIndexByHeader(tbl, 'Valor PCA') !== -1){
          formatCurrencyColumn(tbl, 'Valor PCA');
          applied = true;
        }
      });
      if(applied || attempts >= maxAttempts){
        clearInterval(interval);
      }
    }, 500);
  }

  // Expose
  window.TableSorter = { 
    sortTable, 
    enableTableSorting,
    formatCurrencyColumn
  };

  // Auto-enable after DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    enableTableSorting(document);
    autoInitCurrencyFormatting();
  });
})();
