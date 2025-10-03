# Renderizadores de Tabelas Analíticas

Esta pasta contém os arquivos de renderização específicos para cada tipo de tabela da página de **Dados Analíticos**.

## 📋 Estrutura

Cada arquivo é responsável por renderizar **APENAS UM TIPO ESPECÍFICO** de tabela, evitando o reaproveitamento que causava conflitos quando uma tabela era modificada.

### Arquivos:

1. **AnalyticsRenderStatus.js**
   - Renderiza tabelas de projetos filtrados por STATUS
   - Função: `renderStatusDetailsTable(status)`
   - Usado em: Seção 1.1 - Status dos Processos

2. **AnalyticsRenderTipo.js**
   - Renderiza tabelas de projetos filtrados por TIPO DE CONTRATAÇÃO (Aquisição/Renovação)
   - Função: `renderTipoDetailsTable(tipo)`
   - Usado em: Seção 1.2 - Tipo de Contratação

3. **AnalyticsRenderOrcamento.js**
   - Renderiza tabelas de projetos filtrados por ORÇAMENTO
   - Função: `renderOrcamentoDetailsTable(categoria)`
   - Usado em: Seção 2.1 - Valores por Orçamento e Tipo
   - Categorias: custeio, investimento, custoAquisicao, custoRenovacao, investimentoAquisicao, investimentoRenovacao

4. **AnalyticsRenderSituacional.js**
   - Renderiza tabelas de projetos filtrados por SITUAÇÃO
   - Função: `renderSituacionalDetailsTable(categoria)`
   - Usado em: Seção 3.1 - Análise Situacional
   - Categorias: contratacaoForaSTI, autuacaoAtrasada, elaboracaoInterna, contratacaoAtrasadaForaSTI, processosConcluidos, processosSuspensos, processosAIniciar

5. **AnalyticsRenderArea.js**
   - Renderiza tabelas de projetos filtrados por ÁREA ORGANIZACIONAL
   - Função: `renderAreaDetailsTable(area)`
   - Usado em: Seção 1.3 - Projetos por Área

6. **AnalyticsRenderAreaValor.js**
   - Renderiza tabelas de valores por ÁREA e TIPO DE ORÇAMENTO
   - Função: `renderAreaValorDetailsTable(projetos)`
   - Usado em: Seção 2.2 - Valores por Área e Tipo

7. **AnalyticsRenderProdutividade.js**
   - Renderiza tabelas de PRODUTIVIDADE
   - Função: `renderProdutividadeProjetosTable(projetos)`
   - Usado em: Seção 4.1 - Índice de Produtividade

## 🎯 Vantagens desta Estrutura

### ✅ Isolamento Completo
Cada tipo de tabela tem sua própria função de renderização independente.

### ✅ Manutenção Facilitada
Modificar uma tabela não afeta as outras, pois cada uma está em seu próprio arquivo.

### ✅ Clareza
Fica claro qual arquivo modificar para alterar uma tabela específica.

### ✅ Reutilização Segura
Funções auxiliares (como `formatAreaWithClasses`, `formatStatusWithClasses`, `renderProcessCell`, `renderProjectCellWithCompras`) continuam sendo compartilhadas, mas as tabelas são independentes.

## 🔧 Como Modificar uma Tabela

### Exemplo: Adicionar uma coluna à tabela de STATUS

1. Abra `AnalyticsRenderStatus.js`
2. Localize a função `renderStatusDetailsTable(status)`
3. Adicione a nova coluna no `<thead>`:
   ```javascript
   <th>Nova Coluna</th>
   ```
4. Adicione os dados correspondentes no `<tbody>`:
   ```javascript
   <td>${projeto.novosCampo}</td>
   ```
5. Salve o arquivo

**IMPORTANTE**: Esta modificação afetará APENAS as tabelas de STATUS, sem impactar outras tabelas.

## 📦 Dependências

Todos os arquivos dependem de:
- `analyticData` (objeto global com dados processados - de Analytics.js)
- `formatCurrency()` (função global para formatação monetária)
- `formatAreaWithClasses()` (função de formatação de áreas)
- `formatStatusWithClasses()` (função de formatação de status)
- `renderProcessCell()` (helper para renderizar células de processo)
- `renderProjectCellWithCompras()` (helper para renderizar células de projeto)

## 🔗 Integração

Os arquivos são carregados no `DadosAnaliticos.html` ANTES dos arquivos que os utilizam:

```html
<!-- Analytics Renders -->
<script src="./script/analytics/renders/AnalyticsRenderStatus.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderTipo.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderOrcamento.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderSituacional.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderArea.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderAreaValor.js"></script>
<script src="./script/analytics/renders/AnalyticsRenderProdutividade.js"></script>

<!-- Outros Analytics -->
<script src="./script/analytics/AnalyticsDetails.js"></script>
<script src="./script/analytics/AnalyticsRender.js"></script>
<script src="./script/analytics/Analytics.js"></script>
```

## 🚀 Migração Concluída

A migração das funções de renderização foi concluída com sucesso:

- ✅ Todas as funções de renderização foram separadas em arquivos específicos
- ✅ `AnalyticsRender.js` foi atualizado para usar as novas funções
- ✅ `AnalyticsDetails.js` mantém as funções auxiliares compartilhadas
- ✅ Funções duplicadas foram removidas
- ✅ HTML atualizado com os novos imports

**Resultado**: Agora você pode modificar cada tabela individualmente sem afetar as outras! 🎉
