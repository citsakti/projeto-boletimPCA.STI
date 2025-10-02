/**
 * EspecieProcessoTag.js
 *
 * Objetivo: Adicionar uma tag com a espécie do processo nas células da coluna "Projeto de Aquisição"
 * exibindo a informação obtida da API de processos (campo especie.descricao).
 *
 * Fluxo:
 *  1. Escuta o evento 'tabela-carregada' (disparado após montar a tabela)
 *  2. Coleta todos os números de processo da coluna "Processo" (última coluna)
 *  3. Utiliza o cache compartilhado ou faz requisições à API de processos
 *  4. Extrai a espécie do processo dos dados retornados
 *  5. Insere uma div com a tag da espécie abaixo do conteúdo da célula na coluna "Projeto de Aquisição"
 *
 * Observações:
 *  - Reutiliza o cache compartilhado do módulo AcompanhamentoProcessos.js
 *  - Segue o mesmo padrão visual das tags de tempo existentes
 *  - Funciona de forma independente mas complementar aos outros módulos
 */

(function(){
  // Cache compartilhado entre módulos
  function getSharedProcessCache() {
    if (!window._processoPorNumeroCache) {
      window._processoPorNumeroCache = new Map();
    }
    return window._processoPorNumeroCache;
  }

  // Acessa o módulo de acompanhamento para reutilizar funcionalidades
  function getAcompanhamentoModule() {
    return window.debugAcompanhamentoProcessos || null;
  }

  // Normalização de número (mesmo padrão dos outros módulos)
  function normalizarNumero(raw) {
    if (!raw) return '';
    return String(raw).replace(/[^0-9./-]/g,'').trim();
  }

  // Tenta obter a célula de processo tanto na tabela principal (#detalhes) quanto nas analíticas (.project-details-table)
  function obterCelulaProcesso(tr) {
    if (!tr) return null;
    // Layout clássico (index.html)
    let processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    // Layout Analytics (.project-details-table): a última coluna também é Processo, mas tem HTML estruturado
    const isAnalyticsRow = tr.closest('table') && tr.closest('table').classList.contains('project-details-table');
    if (isAnalyticsRow) {
      const tds = tr.querySelectorAll('td');
      if (tds.length > 0) processoCell = tds[tds.length - 1];
    }
    return processoCell || null;
  }

  // Extrai número do processo a partir do TR para ambos layouts
  function obterNumeroDoTR(tr) {
    if (!tr) return '';
    const processoCell = obterCelulaProcesso(tr);
    if (!processoCell) return '';
    // No layout Analytics, o número está dentro de .processo-tag[data-proc]
    const tag = processoCell.querySelector('.processo-tag');
    if (tag && tag.getAttribute('data-proc')) {
      return normalizarNumero(tag.getAttribute('data-proc'));
    }
    let texto = processoCell.dataset?.processoNumero || processoCell.textContent || '';
    texto = texto.replace('🔗', '').trim();
    return normalizarNumero(texto);
  }

  // Obtém a célula da coluna "Projeto" para uma linha específica (index.html e analytics)
  function obterCelulaProjeto(tr) {
    if (!tr) return null;
    // index.html (tabela principal): coluna com data-label
    let cel = tr.querySelector('td[data-label="Projeto de Aquisição"]') || tr.children[3] || null;
    // analytics: terceira coluna é "Projeto" nas tabelas .project-details-table
    const isAnalyticsRow = tr.closest('table') && tr.closest('table').classList.contains('project-details-table');
    if (isAnalyticsRow) {
      try {
        const table = tr.closest('table');
        const ths = table ? Array.from(table.querySelectorAll('thead th')) : [];
        let projetoIdx = -1;
        if (ths.length) {
          projetoIdx = ths.findIndex(th => /\bprojeto\b/i.test(th.textContent || ''));
        }
        const tds = tr.querySelectorAll('td');
        if (projetoIdx >= 0 && projetoIdx < tds.length) {
          cel = tds[projetoIdx];
        } else if (tds.length >= 3) {
          // Fallback para a 3ª coluna caso não encontre o cabeçalho
          cel = tds[2];
        }
      } catch(_err) {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) cel = tds[2];
      }
    }
    return cel;
  }

  // Obtém dados do Comprasnet da célula do processo (suporta layout analytics)
  function obterDadosComprasnet(tr) {
    if (!tr) return null;
    try {
      const processoCell = obterCelulaProcesso(tr);
      if (!processoCell) return null;
      // No analytics, o ícone possui .comprasgov-link-icon com data-x/data-y
      const icon = processoCell.querySelector('.comprasgov-link-icon');
      if (icon) {
        const dataX = icon.getAttribute('data-x') || '';
        const dataY = icon.getAttribute('data-y') || '';
        if (dataY && dataY.trim() !== '' && dataY.trim() !== '-') {
          return { modalidade: dataX.trim(), numero: dataY.trim() };
        }
      }
      // Fallback adicional: caso o ícone já tenha sido movido para a célula de Projeto
      const projetoCell = obterCelulaProjeto(tr);
      if (projetoCell) {
        const iconProj = projetoCell.querySelector('.comprasgov-link-icon');
        if (iconProj) {
          const dataX = iconProj.getAttribute('data-x') || '';
          const dataY = iconProj.getAttribute('data-y') || '';
          if (dataY && dataY.trim() !== '' && dataY.trim() !== '-') {
            return { modalidade: dataX.trim(), numero: dataY.trim() };
          }
        }
      }
      // Fallback para layout antigo com data-x/data-y no TD
      const dataX = processoCell.getAttribute('data-x');
      const dataY = processoCell.getAttribute('data-y');
      if (dataY && dataY.trim() !== '' && dataY.trim() !== '-') {
        return { modalidade: dataX ? dataX.trim() : '', numero: dataY.trim() };
      }
      return null;
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao obter dados Comprasnet:', error);
      return null;
    }
  }

  // Renderiza o ícone do Comprasnet
  function renderComprasnetIcon(dadosComprasnet) {
    if (!dadosComprasnet || !dadosComprasnet.numero) return '';
    
    return `<span class="comprasgov-link-icon projeto-comprasgov-icon" 
                  data-x="${dadosComprasnet.modalidade}" 
                  data-y="${dadosComprasnet.numero}"
                  title="Abrir acompanhamento no Comprasnet">🛍️</span>`;
  }

  // Remove o ícone do Comprasnet da célula de processo para evitar duplicação
  function removeComprasnetIconFromProcessCell(tr) {
    try {
      const processoCell = obterCelulaProcesso(tr);
      if (processoCell) {
        const icon = processoCell.querySelector('.comprasgov-link-icon');
        if (icon && icon.parentNode) {
          icon.parentNode.removeChild(icon);
        }
      }
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao remover ícone do processo:', error);
    }
  }

  // Extrai a espécie do processo dos dados da API
  function extrairEspecieProcesso(dadosProcesso) {
    try {
      if (!dadosProcesso) return null;
      const raw = dadosProcesso.raw || dadosProcesso;
      if (!raw) return null;

      // 1) Formato esperado: raw.especie.descricao
      if (raw.especie && (raw.especie.descricao || raw.especie.nome || raw.especie.label)) {
        const desc = raw.especie.descricao || raw.especie.nome || raw.especie.label;
        return { descricao: String(desc), id: raw.especie.id || null };
      }

      // 2) Alternativas comuns de campo direto
      const candidates = [
        raw.especieDescricao,
        raw.descricaoEspecie,
        raw.tipoEspecie,
        raw.especie, // caso venha string simples
        raw.modalidade && (raw.modalidade.descricao || raw.modalidade.nome) // fallback aproximado
      ].filter(Boolean);
      if (candidates.length) {
        return { descricao: String(candidates[0]).trim(), id: null };
      }

      // 3) Busca por chave contendo 'especie' genericamente
      try {
        for (const k of Object.keys(raw)) {
          if (/esp(e|é)cie/i.test(k) && raw[k]) {
            const val = raw[k];
            if (typeof val === 'string' && val.trim()) return { descricao: val.trim(), id: null };
            if (typeof val === 'object' && (val.descricao || val.nome || val.label)) {
              return { descricao: String(val.descricao || val.nome || val.label), id: val.id || null };
            }
          }
        }
      } catch(_){}

      return null;
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao extrair espécie:', error);
      return null;
    }
  }

  // Renderiza a tag da espécie do processo
  function renderEspecieTag(especie) {
    if (!especie || !especie.descricao) return '';
    
    const descricao = especie.descricao.trim();
    const tooltip = `Espécie do processo: ${descricao}`;
    
    // Todas as tags usam a classe padrão (cor azul)
    const classeEspecie = 'especie-padrao';
    
    return `<span class="especie-processo-tag ${classeEspecie}" title="${tooltip}">${descricao}</span>`;
  }

  // Insere/atualiza a tag da espécie na célula do projeto sem remover outros elementos (ex.: ícone 🛍️, contrato-tag)
  function inserirEspecieNaCelula(celulaProjeto, especieTag, comprasnetIcon = '') {
    if (!celulaProjeto) return;
    try {
      // 1) Garantir wrapper e container
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      let container = wrapper.querySelector('.projeto-especie-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'projeto-especie-container';
        wrapper.appendChild(container);
      }

      // 2) Atualizar/Inserir a tag de espécie (APÓS tag de parecer jurídico, se existir)
      const existingEspecie = container.querySelector('.especie-processo-tag');
      const parecerTag = container.querySelector('.parecer-juridico-tag');
      
      if (especieTag) {
        // Criar nó a partir do HTML fornecido
        const temp = document.createElement('div');
        temp.innerHTML = especieTag.trim();
        const newTag = temp.firstElementChild;
        if (existingEspecie) {
          existingEspecie.replaceWith(newTag);
        } else {
          // Inserir DEPOIS da tag de parecer jurídico (se existir)
          if (parecerTag && parecerTag.nextSibling) {
            container.insertBefore(newTag, parecerTag.nextSibling);
          } else if (parecerTag) {
            container.appendChild(newTag);
          } else {
            container.insertBefore(newTag, container.firstChild);
          }
        }
      } else {
        // Sem espécie: se houver placeholder, removê-lo; manter demais itens (como 🛍️ e contrato-tag)
        if (existingEspecie) existingEspecie.remove();
      }

      // 3) Garantir/Preservar ícone do Comprasnet
      // Verificar se já existe ícone na célula inteira (não só no container)
      const projetoCell = tr.querySelector('td[data-label="Projeto de Aquisição"], td[data-label*="Projeto"]');
      const existingIconInCell = projetoCell ? projetoCell.querySelector('.comprasgov-link-icon') : null;
      
      if (comprasnetIcon) {
        if (!existingIconInCell) {
          // Não existe ícone na célula: adicionar ao container
          const tempIcon = document.createElement('div');
          tempIcon.innerHTML = comprasnetIcon.trim();
          const iconEl = tempIcon.firstElementChild;
          container.appendChild(iconEl);
        } else if (container.contains(existingIconInCell)) {
          // Ícone já existe no container: atualizar data-x/data-y se necessário
          const tempIcon = document.createElement('div');
          tempIcon.innerHTML = comprasnetIcon.trim();
          const newIcon = tempIcon.firstElementChild;
          if (newIcon) {
            const dx = newIcon.getAttribute('data-x') || '';
            const dy = newIcon.getAttribute('data-y') || '';
            if (dx) existingIconInCell.setAttribute('data-x', dx);
            if (dy) existingIconInCell.setAttribute('data-y', dy);
          }
        }
        // Se ícone existe mas não está no container: deixar onde está (foi criado inline)
      }
      // Se comprasnetIcon não foi fornecido nesta chamada, preservamos o existente (não removemos)

    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao inserir tag na célula:', error);
    }
  }

  // Aplica estilização CSS para as tags de espécie
  function aplicarEstilosEspecie() {
    if (document.querySelector('#especie-processo-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'especie-processo-styles';
    style.textContent = `
        /* Container para as tags do projeto */
        .projeto-tags-wrapper {
            margin-top: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .projeto-especie-container {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* Estilo para o ícone do Comprasnet na nova localização */
        .projeto-comprasgov-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 4px;
            border-radius: 3px;
            background: linear-gradient(135deg, #fff8e1 0%, #ffcc02 100%);
            border: 1px solid #ffa000;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            line-height: 1;
            min-width: 20px;
            height: 20px;
        }
        
        .projeto-comprasgov-icon:hover {
            background: linear-gradient(135deg, #ffcc02 0%, #ff8f00 100%);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        /* Estilo base para tags de espécie */
    .especie-processo-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700; /* negrito conforme solicitado */
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.2;
            cursor: default; /* revertido: usar seta padrão (sem '?', sem mão) */
            transition: all 0.2s ease;
            white-space: normal;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Variações por tipo de espécie - TODAS COM COR PADRÃO CINZA */
        .especie-processo-tag.especie-dispensa {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            color: #424242;
            border: 1px solid #bdbdbd;
        }
        
        .especie-processo-tag.especie-inexigibilidade {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            color: #424242;
            border: 1px solid #bdbdbd;
        }
        
        .especie-processo-tag.especie-licitacao {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            color: #424242;
            border: 1px solid #bdbdbd;
        }
        
        .especie-processo-tag.especie-adesao {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            color: #424242;
            border: 1px solid #bdbdbd;
        }
        
        .especie-processo-tag.especie-padrao {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            color: #424242;
            border: 1px solid #bdbdbd;
        }
        
        .especie-processo-tag.especie-loading {
            background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
            color: #64748b;
            border: 1px solid #cbd5e1;
            animation: especie-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes especie-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        /* Efeitos hover - TODOS COM COR PADRÃO CINZA */
        .especie-processo-tag:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .especie-processo-tag.especie-dispensa:hover {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
        }
        
        .especie-processo-tag.especie-inexigibilidade:hover {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
        }
        
        .especie-processo-tag.especie-licitacao:hover {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
        }
        
        .especie-processo-tag.especie-adesao:hover {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
        }
        
        .especie-processo-tag.especie-padrao:hover {
            background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
        }
        
        .especie-processo-tag.especie-loading:hover {
            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
            .projeto-tags-wrapper {
                margin-top: 4px;
                gap: 3px;
            }
            
            .projeto-especie-container {
                gap: 4px;
            }
            
            .especie-processo-tag {
                font-size: 10px;
                padding: 2px 6px;
                letter-spacing: 0.2px;
            }
            
            .projeto-comprasgov-icon {
                font-size: 12px;
                min-width: 18px;
                height: 18px;
                padding: 1px 3px;
            }
        }
        
        /* Ajustes para telas muito pequenas */
        @media (max-width: 480px) {
            .especie-processo-tag {
                font-size: 9px;
                padding: 1px 4px;
                max-width: 120px;
            }
            
            .projeto-comprasgov-icon {
                font-size: 11px;
                min-width: 16px;
                height: 16px;
                padding: 1px 2px;
            }
            
            .projeto-especie-container {
                gap: 3px;
            }
        }
    `;
    
    document.head.appendChild(style);
  }

  // Insere placeholder enquanto aguarda dados da API
  function inserirPlaceholderEspecie(celulaProjeto, comprasnetIcon = '') {
    if (!celulaProjeto) return;
    try {
      // Garantir wrapper e container
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      let container = wrapper.querySelector('.projeto-especie-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'projeto-especie-container';
        wrapper.appendChild(container);
      }

      // Atualizar/Inserir placeholder de espécie (preserva outros elementos, APÓS tag de parecer)
      const existingEspecie = container.querySelector('.especie-processo-tag');
      const parecerTag = container.querySelector('.parecer-juridico-tag');
      const placeholderHtml = '<span class="especie-processo-tag especie-loading" title="Carregando espécie...">⏳ Carregando...</span>';
      const temp = document.createElement('div');
      temp.innerHTML = placeholderHtml;
      const placeholderEl = temp.firstElementChild;
      if (existingEspecie) {
        existingEspecie.replaceWith(placeholderEl);
      } else {
        // Inserir DEPOIS da tag de parecer jurídico (se existir)
        if (parecerTag && parecerTag.nextSibling) {
          container.insertBefore(placeholderEl, parecerTag.nextSibling);
        } else if (parecerTag) {
          container.appendChild(placeholderEl);
        } else {
          container.insertBefore(placeholderEl, container.firstChild);
        }
      }

      // Garantir/Adicionar ícone do Comprasnet se fornecido e ainda não presente
      // Verificar se já existe ícone na célula inteira (não só no container)
      if (comprasnetIcon) {
        const projetoCell = tr.querySelector('td[data-label="Projeto de Aquisição"], td[data-label*="Projeto"]');
        const hasIconInCell = projetoCell ? projetoCell.querySelector('.comprasgov-link-icon') : false;
        if (!hasIconInCell) {
          const tempIcon = document.createElement('div');
          tempIcon.innerHTML = comprasnetIcon.trim();
          const iconEl = tempIcon.firstElementChild;
          if (iconEl) container.appendChild(iconEl);
        }
      }

    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao inserir placeholder:', error);
    }
  }

  // Processa uma linha individual para adicionar a tag de espécie
  function processarLinha(tr) {
    if (!tr) return;
    
    const numero = obterNumeroDoTR(tr);
    if (!numero) return;
    
    const celulaProjeto = obterCelulaProjeto(tr);
    if (!celulaProjeto) return;
    
    try {
      const cache = getSharedProcessCache();
      
      // Obter dados do Comprasnet desta linha
      const dadosComprasnet = obterDadosComprasnet(tr);
      const comprasnetIcon = dadosComprasnet ? renderComprasnetIcon(dadosComprasnet) : '';
      
      // Remover ícone da célula de processo (evitar duplicação)
      if (dadosComprasnet) {
        removeComprasnetIconFromProcessCell(tr);
      }
      
      // Mover ícone inline existente para dentro do container (se houver)
      moverIconeInlineParaContainer(celulaProjeto);
      
      // Verificar se os dados já estão no cache
      if (cache.has(numero)) {
        const dadosProcesso = cache.get(numero);
        const especie = extrairEspecieProcesso(dadosProcesso);
        
        if (especie) {
          const especieTag = renderEspecieTag(especie);
          inserirEspecieNaCelula(celulaProjeto, especieTag, comprasnetIcon);
        } else if (comprasnetIcon) {
          // Se não há espécie mas há Comprasnet, inserir só o ícone
          inserirEspecieNaCelula(celulaProjeto, '', comprasnetIcon);
        } else {
          // Se não há espécie nem Comprasnet, remover qualquer placeholder
          const wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
          if (wrapper) {
            const container = wrapper.querySelector('.projeto-especie-container');
            if (container) container.remove();
          }
        }
        return;
      }
      
      // Se não estiver no cache, inserir placeholder
      inserirPlaceholderEspecie(celulaProjeto, comprasnetIcon);

      // Retry direcionado aguardando cache (limitado)
      iniciarAguardoCache(numero, celulaProjeto, comprasnetIcon);
      
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao processar linha:', error);
    }
  }

  // Move ícone do Comprasnet que foi criado inline (fora do container) para dentro do container
  function moverIconeInlineParaContainer(celulaProjeto) {
    try {
      // Procurar por ícones do Comprasgov que estão fora do container
      const icons = celulaProjeto.querySelectorAll('.comprasgov-link-icon');
      if (!icons || !icons.length) return;
      
      // Garantir que existe wrapper e container
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      
      let container = wrapper.querySelector('.projeto-especie-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'projeto-especie-container';
        wrapper.appendChild(container);
      }
      
      // Mover cada ícone para o container (se não estiver dentro dele)
      icons.forEach(icon => {
        if (!container.contains(icon)) {
          // Adicionar classe projeto-comprasgov-icon se não tiver
          if (!icon.classList.contains('projeto-comprasgov-icon')) {
            icon.classList.add('projeto-comprasgov-icon');
          }
          // Remover do local atual e adicionar ao container
          icon.parentNode.removeChild(icon);
          container.appendChild(icon);
        }
      });
      
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao mover ícone inline:', error);
    }
  }

  // Controle de retries por número para evitar múltiplos timers
  const _aguardos = new Map(); // numero -> { tries, timer }
  function atualizarTodasLinhasComNumero(num){
    const cache = getSharedProcessCache();
    const dados = cache.get(num);
    const especie = extrairEspecieProcesso(dados);
    const updateInContainer = (container) => {
      if (!container) return;
      container.querySelectorAll('tr').forEach(tr => {
        const nTr = obterNumeroDoTR(tr);
        if (nTr === num) {
          const celProj = obterCelulaProjeto(tr);
          if (!celProj) return;
          // recomputar comprasnet por linha
          const dadosComprasnet = obterDadosComprasnet(tr);
          const icon = dadosComprasnet ? renderComprasnetIcon(dadosComprasnet) : '';
          if (dadosComprasnet) removeComprasnetIconFromProcessCell(tr);
          if (especie) {
            const tag = renderEspecieTag(especie);
            inserirEspecieNaCelula(celProj, tag, icon);
          } else if (icon) {
            inserirEspecieNaCelula(celProj, '', icon);
          } else {
            const wrapper = celProj.querySelector('.projeto-tags-wrapper');
            if (wrapper) {
              const container = wrapper.querySelector('.projeto-especie-container');
              if (container) container.remove();
            }
          }
        }
      });
    };
    atualizarTodasLinhasNoDOM(num, updateInContainer);
  }

  function atualizarTodasLinhasNoDOM(num, cb){
    const tbMain = document.querySelector('#detalhes table tbody');
    if (tbMain) cb(tbMain);
    document.querySelectorAll('table.project-details-table tbody').forEach(tb => cb(tb));
  }
  function iniciarAguardoCache(numero, celulaProjeto, comprasnetIcon){
    const num = normalizarNumero(numero);
    if (!num) return;
    if (_aguardos.has(num)) return; // já aguardando
    const cache = getSharedProcessCache();
    const maxTries = 60; // ~12s @200ms
    const intervalMs = 200;
    const state = { tries: 0, timer: null };
    const tick = () => {
      try {
        state.tries++;
        if (cache.has(num)) {
          // Atualiza todas as linhas que possuem esse número
          atualizarTodasLinhasComNumero(num);
          clearInterval(state.timer);
          _aguardos.delete(num);
          return;
        }
        if (state.tries >= maxTries) {
          // Timeout: substitui placeholder por apenas o ícone (se houver) ou limpa
          atualizarTodasLinhasNoDOM(num, (tb)=>{
            tb.querySelectorAll('tr').forEach(tr=>{
              const nTr = obterNumeroDoTR(tr);
              if (nTr !== num) return;
              const celProj = obterCelulaProjeto(tr);
              if (!celProj) return;
              const dadosComprasnet = obterDadosComprasnet(tr);
              const icon = dadosComprasnet ? renderComprasnetIcon(dadosComprasnet) : '';
              if (icon) inserirEspecieNaCelula(celProj, '', icon);
              else {
                const wrapper = celProj.querySelector('.projeto-tags-wrapper');
                if (wrapper) {
                  const container = wrapper.querySelector('.projeto-especie-container');
                  if (container) container.remove();
                }
              }
            });
          });
          clearInterval(state.timer);
          _aguardos.delete(num);
        }
      } catch (e) {
        clearInterval(state.timer);
        _aguardos.delete(num);
      }
    };
    state.timer = setInterval(tick, intervalMs);
    _aguardos.set(num, state);
  }

  // Processa todas as linhas da tabela
  function processarTodasAsLinhas() {
    // 1) Tabela principal no index.html
    const tbodyMain = document.querySelector('#detalhes table tbody');
    if (tbodyMain) {
      tbodyMain.querySelectorAll('tr').forEach(tr => processarLinha(tr));
    }
    // 2) Tabelas analíticas (.project-details-table)
    document.querySelectorAll('table.project-details-table tbody').forEach(tb => {
      tb.querySelectorAll('tr').forEach(tr => processarLinha(tr));
    });
  }

  // Sistema de debounce para evitar processamento excessivo
  let debounceId = null;
  function scheduleUpdate(delay = 400) {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      processarTodasAsLinhas();
    }, delay);
  }

  // Processa apenas uma linha específica por número (para atualizações parciais)
  function processarLinhaPorNumero(numero) {
    if (!numero) return;
    const tryProcess = (container) => {
      if (!container) return;
      container.querySelectorAll('tr').forEach(tr => {
        const numeroTr = obterNumeroDoTR(tr);
        if (numeroTr === numero) processarLinha(tr);
      });
    };
    tryProcess(document.querySelector('#detalhes table tbody'));
    document.querySelectorAll('table.project-details-table tbody').forEach(tb => tryProcess(tb));
  }

  // Função principal que é executada quando a tabela é carregada
  function inicializarEspecieProcesso() {
    try {
      aplicarEstilosEspecie();
      scheduleUpdate(600); // Usar schedule em vez de processar imediatamente
      
      if (window._especieProcessoDebug) {
        console.log('[EspecieProcesso] Módulo inicializado com sucesso');
      }
    } catch (error) {
      console.error('[EspecieProcesso] Erro na inicialização:', error);
    }
  }

  // Função para atualizar uma linha específica (para uso externo)
  function atualizarEspecieLinha(tr) {
    processarLinha(tr);
  }

  // Função para reprocessar toda a tabela (para uso externo)
  function atualizarTodasEspecies() {
    scheduleUpdate(300);
  }

  // Escutar o evento de tabela carregada
  document.addEventListener('tabela-carregada', inicializarEspecieProcesso);

  // Eventos de integração com outros módulos (seguindo padrão do DocumentosDoProcessso.js)
  document.addEventListener('DOMContentLoaded', () => {
    aplicarEstilosEspecie();
    scheduleUpdate(800);
  });

  // Quando o acompanhamento for atualizado, reprocessar as espécies
  document.addEventListener('acompanhamento-atualizado', () => scheduleUpdate(300));
  
  // Quando iniciar o loading das células, inserir placeholders imediatamente
  document.addEventListener('acompanhamento-loading', () => scheduleUpdate(0));
  
  // Quando tabelas de pareceres jurídicos forem expandidas
  document.addEventListener('pareceres-tabela-expandida', () => scheduleUpdate(200));
  
  // Atualizações parciais por número: atualizar espécie apenas daquela(s) linha(s)
  document.addEventListener('acompanhamento-atualizado-parcial', (ev) => {
    try {
      const numero = ev.detail && ev.detail.numero ? ev.detail.numero : null;
      if (numero) {
        processarLinhaPorNumero(numero);
      } else {
        scheduleUpdate(300);
      }
    } catch (error) {
      console.warn('[EspecieProcesso] Erro no evento parcial:', error);
      scheduleUpdate(300);
    }
  });

  // Quando o cache de processos for atualizado pelo AnalyticsProcessoAPI, reprocessar rapidamente
  document.addEventListener('processo-cache-atualizado', (ev) => {
    try {
      const nums = (ev && ev.detail && Array.isArray(ev.detail.numeros)) ? ev.detail.numeros : [];
      if (nums.length === 1) {
        processarLinhaPorNumero(nums[0]);
      } else {
        scheduleUpdate(150);
      }
    } catch (_) {
      scheduleUpdate(200);
    }
  });

  // Observar inserções no DOM para detectar tabelas analíticas renderizadas depois
  try {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (
              node.matches?.('table.project-details-table') ||
              node.querySelector?.('table.project-details-table') ||
              node.matches?.('#detalhes table') ||
              node.querySelector?.('#detalhes table')
            ) {
              shouldUpdate = true;
            }
          });
        }
      }
      if (shouldUpdate) scheduleUpdate(200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (errObs) {
    console.warn('[EspecieProcesso] MutationObserver não pôde ser iniciado:', errObs);
  }

  // Também tentar executar se a tabela já estiver carregada
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(inicializarEspecieProcesso, 1000);
    });
  } else {
    setTimeout(inicializarEspecieProcesso, 1000);
  }

  // Expor funções globais para debug e uso externo
  window.debugEspecieProcesso = {
    inicializar: inicializarEspecieProcesso,
    atualizarLinha: atualizarEspecieLinha,
    atualizarTodas: atualizarTodasEspecies,
    processarLinha: processarLinha,
    processarPorNumero: processarLinhaPorNumero,
    scheduleUpdate: scheduleUpdate,
    extrairEspecie: extrairEspecieProcesso,
    renderTag: renderEspecieTag,
    obterDadosComprasnet: obterDadosComprasnet,
    renderComprasnetIcon: renderComprasnetIcon,
    removeComprasnetIcon: removeComprasnetIconFromProcessCell
  };

  if (window._especieProcessoDebug) {
    console.log('[EspecieProcesso] Módulo carregado. Use window.debugEspecieProcesso para debug.');
  }

})();
