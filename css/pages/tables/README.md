# CSS de Tabelas Analíticas - Arquitetura Isolada

Esta pasta contém os arquivos CSS específicos para cada tipo de tabela da página de **Dados Analíticos**.

## 🎯 Problema Resolvido

Anteriormente, o arquivo `Analytics-Tables.css` continha estilos globais que afetavam TODAS as tabelas simultaneamente. Quando você modificava o CSS de uma tabela (por exemplo, adicionando uma coluna), TODAS as outras tabelas eram afetadas, causando problemas de layout.

## 📁 Nova Estrutura

Cada arquivo CSS é responsável por estilizar **APENAS UM TIPO ESPECÍFICO** de tabela:

### Arquivos CSS:

1. **AnalyticsTableStatus.css**
   - Tabelas de projetos filtrados por STATUS
   - Seletor: `.status-details-row .project-details-table`
   - Usado em: Seção 1.1 - Status dos Processos

2. **AnalyticsTableTipo.css**
   - Tabelas de projetos filtrados por TIPO (Aquisição/Renovação)
   - Seletor: `.tipo-details-row .project-details-table`
   - Usado em: Seção 1.2 - Tipo de Contratação

3. **AnalyticsTableOrcamento.css**
   - Tabelas de projetos filtrados por ORÇAMENTO
   - Seletor: `.details-row .project-details-table`
   - Usado em: Seção 2.1 - Valores por Orçamento e Tipo

4. **AnalyticsTableSituacional.css**
   - Tabelas de projetos filtrados por SITUAÇÃO
   - Seletores: `#situacional-details-* .project-details-table`
   - Usado em: Seção 3.1 - Análise Situacional

5. **AnalyticsTableArea.css**
   - Tabelas de projetos filtrados por ÁREA
   - Seletor: `.area-details .project-details-table`
   - Usado em: Seção 1.3 - Projetos por Área

6. **AnalyticsTableAreaValor.css**
   - Tabelas de valores por ÁREA e TIPO
   - Seletor: `.details-row[id^="details-area-"] .project-details-table`
   - Usado em: Seção 2.2 - Valores por Área e Tipo

7. **AnalyticsTableProdutividade.css**
   - Tabelas de PRODUTIVIDADE
   - Seletor: `.detalhes-produtividade .project-details-table`
   - Usado em: Seção 4.1 - Índice de Produtividade

## ✨ Vantagens

### ✅ Isolamento Total de Estilos
Cada tabela tem seu próprio arquivo CSS com seletores específicos.

### ✅ Sem Conflitos de Layout
Modificar o CSS de uma tabela não afeta as outras.

### ✅ Manutenção Facilitada
Você sabe exatamente qual arquivo CSS modificar para cada tabela.

### ✅ Especificidade Garantida
Cada arquivo usa seletores específicos para evitar que estilos globais interfiram.

## 🔧 Como Modificar o Layout de uma Tabela

### Exemplo: Adicionar uma nova coluna à tabela de STATUS

1. **Abra o arquivo JS correspondente** (`AnalyticsRenderStatus.js`)
2. **Adicione a nova coluna no HTML** (thead e tbody)
3. **Abra o arquivo CSS correspondente** (`AnalyticsTableStatus.css`)
4. **Adicione os estilos para a nova coluna**:
   ```css
   /* Nova Coluna (exemplo: 7ª coluna) */
   .status-details-row .project-details-table th:nth-child(7),
   .status-details-row .project-details-table td:nth-child(7) {
       white-space: nowrap !important;
       width: 1% !important;
       min-width: max-content !important;
   }
   ```
5. **Salve ambos os arquivos**

**IMPORTANTE**: Esta modificação afetará APENAS as tabelas de STATUS.

## 📦 Integração

Os arquivos são carregados no `DadosAnaliticos.html` APÓS os estilos base:

```html
<!-- Estilos base de Analytics -->
<link rel="stylesheet" href="./css/pages/Analytics.css">
<link rel="stylesheet" href="./css/pages/Analytics-Bootstrap.css">

<!-- Estilos específicos de tabelas (isolados) -->
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableStatus.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableTipo.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableOrcamento.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableSituacional.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableArea.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableAreaValor.css">
<link rel="stylesheet" href="./css/pages/tables/AnalyticsTableProdutividade.css">
```

## 🎨 Padrão de Estilos

Todos os arquivos seguem o mesmo padrão:

- **Colunas com `nowrap`**: ID PCA, Área, Tipo, Status, Contratar Até, Valor, Processo
- **Coluna que pode expandir**: Projeto (white-space: normal)
- **Width mínimo**: 1% com min-width: max-content
- **Importante**: Uso de `!important` para garantir precedência sobre estilos globais

## 🚀 Resultado Final

**Arquitetura Completa de Isolamento:**

```
DADOS ANALÍTICOS
├── JavaScript (renderização)
│   ├── AnalyticsRenderStatus.js → renderStatusDetailsTable()
│   ├── AnalyticsRenderTipo.js → renderTipoDetailsTable()
│   ├── AnalyticsRenderOrcamento.js → renderOrcamentoDetailsTable()
│   ├── AnalyticsRenderSituacional.js → renderSituacionalDetailsTable()
│   ├── AnalyticsRenderArea.js → renderAreaDetailsTable()
│   ├── AnalyticsRenderAreaValor.js → renderAreaValorDetailsTable()
│   └── AnalyticsRenderProdutividade.js → renderProdutividadeProjetosTable()
│
└── CSS (estilos)
    ├── AnalyticsTableStatus.css → .status-details-row
    ├── AnalyticsTableTipo.css → .tipo-details-row
    ├── AnalyticsTableOrcamento.css → .details-row
    ├── AnalyticsTableSituacional.css → #situacional-details-*
    ├── AnalyticsTableArea.css → .area-details
    ├── AnalyticsTableAreaValor.css → .details-row[id^="details-area-"]
    └── AnalyticsTableProdutividade.css → .detalhes-produtividade
```

**Agora você tem isolamento TOTAL - tanto no JS quanto no CSS!** 🎉
