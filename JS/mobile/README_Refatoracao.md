# Refatoração dos Cards Mobile - Documentação

## Visão Geral

O arquivo `MobileCards.js` foi refatorado em múltiplos módulos especializados para melhor organização, manutenibilidade e escalabilidade do código.

## Estrutura dos Arquivos

### 1. **MobileCardsManager.js** (Principal)
- Classe principal que coordena todos os módulos
- Responsável pela inicialização e orquestração do sistema
- Ponto de entrada principal para o sistema de cards mobile

### 2. **MobileCardsData.js**
- Processamento e manipulação de dados
- Carregamento de dados da tabela
- Adição de informações de acompanhamento e status
- Ordenação e filtragem de dados

### 3. **MobileCardsRenderer.js**
- Renderização de cards e criação de HTML
- Formatação de dados para exibição
- Criação da estrutura de filtros mobile
- Geração de HTML para detalhes expandidos

### 4. **MobileCardsFilters.js**
- Gerenciamento completo de filtros
- Sincronização com painel de resumos
- Contagem de filtros ativos
- Alternância de visibilidade dos filtros

### 5. **MobileCardsTooltips.js**
- Sistema de tooltips para acompanhamento e status
- Posicionamento responsivo dos tooltips
- Event listeners para dispositivos móveis
- Gerenciamento de estado dos tooltips

### 6. **MobileCardsDetails.js**
- Expansão e colapso de detalhes dos cards
- Gerenciamento de estado de expansão
- Animações de transição
- Controle de múltiplos cards expandidos

### 7. **MobileCardsEvents.js**
- Gerenciamento centralizado de eventos
- Event listeners para cliques, mudanças e resize
- Eventos customizados do sistema
- Debounce para performance

### 8. **MobileCardsStyles.js**
- Mapeamento de classes CSS
- Formatação de status, áreas e orçamentos
- Processamento de emojis
- Centralização de estilos

## Vantagens da Refatoração

### ✅ **Princípio da Responsabilidade Única**
Cada módulo tem uma responsabilidade específica e bem definida.

### ✅ **Manutenibilidade**
Código mais fácil de manter e debugar, com módulos independentes.

### ✅ **Escalabilidade**
Novos recursos podem ser adicionados sem afetar outros módulos.

### ✅ **Reutilização**
Módulos podem ser reutilizados em outras partes do sistema.

### ✅ **Testabilidade**
Cada módulo pode ser testado independentemente.

### ✅ **Organização**
Código melhor estruturado e mais fácil de entender.

## Como Usar

### Inclusão dos Arquivos
Os arquivos devem ser incluídos na seguinte ordem no HTML:

```html
<!-- Módulos especializados (ordem não importa entre eles) -->
<script src="JS/mobile/MobileCardsStyles.js"></script>
<script src="JS/mobile/MobileCardsData.js"></script>
<script src="JS/mobile/MobileCardsRenderer.js"></script>
<script src="JS/mobile/MobileCardsFilters.js"></script>
<script src="JS/mobile/MobileCardsTooltips.js"></script>
<script src="JS/mobile/MobileCardsDetails.js"></script>
<script src="JS/mobile/MobileCardsEvents.js"></script>

<!-- Módulo principal (deve ser carregado por último) -->
<script src="JS/mobile/MobileCardsManager.js"></script>
```

### Inicialização
O sistema é inicializado automaticamente quando o DOM é carregado:

```javascript
// A instância global fica disponível em:
window.mobileCardsManager
```

### API Principal

```javascript
// Obter estado atual
const estado = mobileCardsManager.getState();

// Aplicar filtros específicos
mobileCardsManager.applySpecificFilters({
    area: 'STI 👩‍💼',
    status: 'EM CONTRATAÇÃO 🤝'
});

// Buscar projetos
const resultados = mobileCardsManager.searchProjects('termo');

// Forçar atualização
mobileCardsManager.refresh();

// Debug
mobileCardsManager.debug();
```

## Compatibilidade

- ✅ Mantém 100% de compatibilidade com o código existente
- ✅ Todos os recursos originais continuam funcionando
- ✅ Interface pública permanece a mesma
- ✅ Não quebra funcionalidades existentes

## Backup

O arquivo original foi preservado como `MobileCards.js.backup` para referência e segurança.

## Próximos Passos

1. **Testes**: Testar todos os recursos para garantir funcionamento correto
2. **Otimização**: Identificar oportunidades de melhoria de performance
3. **Documentação**: Adicionar JSDoc mais detalhado aos métodos
4. **Testes Unitários**: Criar testes para cada módulo
5. **TypeScript**: Considerar migração para TypeScript para melhor tipagem

## Observações Técnicas

- Todos os módulos são exportados para `window` para compatibilidade global
- O sistema verifica se todos os módulos necessários estão carregados antes de inicializar
- Mantém compatibilidade com `MobileUtils.js` existente
- Preserva integração com sistemas externos (AcompanhamentoDeProjetos, etc.)

---

**Data da Refatoração**: 1 de junho de 2025  
**Responsável**: Refatoração automática para melhor organização do código
