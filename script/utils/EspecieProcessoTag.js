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

  // Extrai número do processo a partir do TR (mesmo padrão do AcompanhamentoProcessos.js)
  function obterNumeroDoTR(tr) {
    if (!tr) return '';
    let processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
    if (!processoCell) return '';
    let texto = processoCell.dataset?.processoNumero || processoCell.textContent || '';
    texto = texto.replace('🔗', '').trim();
    return normalizarNumero(texto);
  }

  // Obtém a célula da coluna "Projeto de Aquisição" para uma linha específica
  function obterCelulaProjeto(tr) {
    if (!tr) return null;
    return tr.querySelector('td[data-label="Projeto de Aquisição"]') || tr.children[3] || null;
  }

  // Obtém dados do Comprasnet da célula do processo
  function obterDadosComprasnet(tr) {
    if (!tr) return null;
    
    try {
      // Buscar na célula do processo pelos data attributes
      const processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
      if (!processoCell) return null;
      
      const dataX = processoCell.getAttribute('data-x');
      const dataY = processoCell.getAttribute('data-y');
      
      if (dataY && dataY.trim() !== '' && dataY.trim() !== '-') {
        return {
          modalidade: dataX ? dataX.trim() : '',
          numero: dataY.trim()
        };
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
      const processoCell = tr.querySelector('td[data-label="Processo"]') || tr.children[9] || tr.querySelector('td:last-child');
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
      if (!dadosProcesso || !dadosProcesso.raw) return null;
      const raw = dadosProcesso.raw;
      if (raw.especie && raw.especie.descricao) {
        return {
          descricao: raw.especie.descricao,
          id: raw.especie.id || null
        };
      }
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

  // Insere a tag da espécie na célula do projeto
  function inserirEspecieNaCelula(celulaProjeto, especieTag, comprasnetIcon = '') {
    if (!celulaProjeto) return;
    
    try {
      // Verificar se já existe um wrapper para tags
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      
      // Remover containers anteriores se existirem
      const tagExistente = wrapper.querySelector('.projeto-especie-container');
      if (tagExistente) {
        tagExistente.remove();
      }
      
      // Criar container principal para a linha de tags
      const div = document.createElement('div');
      div.className = 'projeto-especie-container';
      
      // Inserir tag de espécie se houver
      if (especieTag) {
        div.innerHTML = especieTag;
      }
      
      // Inserir ícone do Comprasnet se houver
      if (comprasnetIcon) {
        if (especieTag) {
          div.innerHTML += ' ' + comprasnetIcon;
        } else {
          div.innerHTML = comprasnetIcon;
        }
      }
      
      // Só adicionar se há conteúdo
      if (div.innerHTML.trim()) {
        wrapper.appendChild(div);
      }
      
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
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.2;
            cursor: help;
            transition: all 0.2s ease;
            white-space: nowrap;
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
      let wrapper = celulaProjeto.querySelector('.projeto-tags-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'projeto-tags-wrapper';
        celulaProjeto.appendChild(wrapper);
      }
      
      // Remover container anterior se existir
      const tagExistente = wrapper.querySelector('.projeto-especie-container');
      if (tagExistente) {
        tagExistente.remove();
      }
      
      // Inserir placeholder
      const div = document.createElement('div');
      div.className = 'projeto-especie-container';
      
      let content = '<span class="especie-processo-tag especie-loading" title="Carregando espécie...">⏳ Carregando...</span>';
      
      // Incluir ícone do Comprasnet se houver
      if (comprasnetIcon) {
        content += ' ' + comprasnetIcon;
      }
      
      div.innerHTML = content;
      wrapper.appendChild(div);
      
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
      
    } catch (error) {
      console.warn('[EspecieProcesso] Erro ao processar linha:', error);
    }
  }

  // Processa todas as linhas da tabela
  function processarTodasAsLinhas() {
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(tr => {
      processarLinha(tr);
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
    const tbody = document.querySelector('#detalhes table tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(tr => {
      const numeroTr = obterNumeroDoTR(tr);
      if (numeroTr === numero) {
        processarLinha(tr);
      }
    });
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
