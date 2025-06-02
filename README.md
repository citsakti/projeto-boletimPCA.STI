# Boletim PCA 2025 - STI

Este projeto é um painel interativo para acompanhamento do Boletim PCA 2025 da STI, consumindo dados de uma planilha Google Sheets em tempo real. O sistema permite filtrar, pesquisar, imprimir e visualizar o status dos processos de aquisição de forma responsiva, adaptando-se a dispositivos móveis e desktop, além de oferecer uma seção de dados analíticos e atualização automática.

## Funcionalidades

- **Carregamento automático de dados** via CSV do Google Sheets.
- **Atualização automática de dados**: Verifica periodicamente se há novos dados na planilha e atualiza a tabela, notificando o usuário.
- **Filtros avançados** por área, tipo, status do processo, datas, valores e outros campos.
- **Painel de resumo** com contagem por status e filtro rápido.
- **Ocultação/revelação de processos cancelados**.
- **Impressão otimizada** da tabela.
- **Animações de emojis** para destacar status especiais.
- **Interface responsiva** para uso em dispositivos móveis e desktop.
- **Overlay de carregamento** com efeito blur enquanto os dados são carregados.
- **Estilização dinâmica de linhas** com base no status, área e tipo de orçamento do processo.
- **Destaque visual e tooltips informativos** para processos com status "Atrasado".
- **Destaque visual para renovações atrasadas/próximas do vencimento**.
- **Botão "PCA Publicada"** com informações sobre a última atualização da Planilha de Contratações Anual.
- **Formatação de valores monetários e datas** na tabela.
- **Ordenação de colunas** da tabela.
- **Página de Dados Analíticos**: Uma seção dedicada para visualização de gráficos e métricas sobre os projetos.
- **Tooltips com informações de contratos e acompanhamento de projetos** diretamente na tabela.
- **Botões de navegação** para a fonte de dados e para a página de análise.
- **Interface mobile otimizada** com menu responsivo e filtros adaptados.
- **Painel de resumo recolhível** para melhor aproveitamento do espaço.
- **Botão "Limpar Filtros"** para reset rápido de todos os filtros aplicados.
- **Detecção automática de dispositivos** para otimização da experiência do usuário.

## Estrutura do Projeto

```
Projeto Boletim/
│   index.html
│   DadosAnaliticos.html
│   README.md
│
├── css/
│   ├── components/
│   │     Areas.css
│   │     AtualizacaoAutomatica.css
│   │     Emojis.css
│   │     HeaderResponsive.css
│   │     LimparFiltros.css
│   │     Orcamento.css
│   │     PainelResumoCollapsible.css
│   │     StatusAtrasado.css
│   │     TableOptimization.css
│   │     ToolbarResponsive.css
│   ├── layout/
│   │     Bootstrap-Custom.css
│   │     Main.css
│   │     Tokens.css
│   ├── mobile/
│   │     MobileCards.css
│   │     MobileResponsive.css
│   └── pages/
│         Analytics-Bootstrap.css
│         Analytics.css
│
├── script/
│   ├── analytics/
│   │     Analytics.js
│   │     AnalyticsContratos.js
│   │     AnalyticsDetails.js
│   │     AnalyticsRender.js
│   ├── core/
│   │     AtualizacaoAutomatica.js
│   │     Main.js
│   │     ModalManager.js
│   │     OrganizacaoDosDados.js
│   ├── filters/
│   │     ClearFiltersButton.js
│   │     FilterControls.js
│   │     GoogleSheetFilters.js
│   ├── handlers/
│   │     AcompanhamentoDeProjetos.js
│   │     InformacoesDeContratos.js
│   │     PainelResumoUpdates.js
│   │     RenovacaoAtrasada.js
│   │     StatusAtrasado.js
│   │     UpdateStatus.js
│   ├── mobile/
│   │     MobileCardsData.js
│   │     MobileCardsDetails.js
│   │     MobileCardsEvents.js
│   │     MobileCardsFilters.js
│   │     MobileCardsManager.js
│   │     MobileCardsRenderer.js
│   │     MobileCardsStyles.js
│   │     MobileCardsTooltips.js
│   │     MobileUtils.js
│   ├── ui/
│   │     btnAnalytics.js
│   │     btnCancelados.js
│   │     btnFonteDeDados.js
│   │     btnPCAPublicada.js
│   │     PainelDeResumos.js
│   │     PainelResumoCollapsible.js
│   │     PrintFunction.js
│   │     ToolbarResponsive.js
│   └── utils/
│         AreasClasses.js
│         BootstrapAdapter.js
│         BootstrapEnhancements.js
│         EmojiAnimation.js
│         OrcamentoClasses.js
│         ProcessoModal.js
│         StatusClasses.js
│         TableFormatters.js
│
└── IMG/
      favicon.ico
      tribunal.png
      tribunal1.png
```

## Arquitetura e Organização

O projeto foi reestruturado seguindo uma arquitetura modular e organizada, adotando as seguintes convenções:

### 🎯 Princípios da Organização
- **Separação por Funcionalidade**: Cada pasta agrupa arquivos relacionados a uma funcionalidade específica
- **Convenção CamelCase**: Todos os arquivos seguem a nomenclatura CamelCase para consistência
- **Mobile-First**: Organização específica para funcionalidades responsivas
- **Escalabilidade**: Estrutura preparada para crescimento futuro do projeto

### 📁 Organização das Pastas

#### CSS
- **`layout/`**: Estilos de estrutura geral, tokens de design e customizações do Bootstrap
- **`components/`**: Estilos de componentes específicos e reutilizáveis, incluindo otimizações de performance
- **`mobile/`**: Estilos dedicados para dispositivos móveis, incluindo sistema de cards
- **`pages/`**: Estilos específicos para páginas individuais com suporte ao Bootstrap

#### JavaScript
- **`core/`**: Scripts principais, lógica central da aplicação e gerenciamento de modais
- **`analytics/`**: Sistema completo de análise e visualização de dados
- **`filters/`**: Sistema de filtragem avançado
- **`handlers/`**: Manipuladores de eventos e dados específicos
- **`mobile/`**: Sistema completo de cards para dispositivos móveis
- **`ui/`**: Componentes de interface, controles visuais e barra de ferramentas responsiva
- **`utils/`**: Funções utilitárias, formatadores reutilizáveis e integrações com Bootstrap

> **📝 Nota:** A pasta de scripts foi renomeada de "JS" para "script" para um visual mais profissional e padronização com convenções modernas de desenvolvimento web.

### 📋 Documentação
A pasta `docs/` contém documentação detalhada sobre:
- Funcionalidades específicas para dispositivos móveis (MOBILE_README.md)

## Como usar

1.  **Abra o arquivo `index.html` em seu navegador.** Certifique-se de ter uma conexão com a internet para o carregamento dos dados.
2.  Aguarde o carregamento dos dados (um overlay com efeito de blur será exibido durante o processo).
3.  Utilize os filtros (por área, tipo, status, datas, etc.) e a barra de pesquisa para encontrar processos específicos.
4.  Clique nos cabeçalhos das colunas para ordenar os dados.
5.  Use o painel de resumo para visualizar a contagem de processos por status e aplicar filtros rápidos.
6.  O botão "Ocultar/Revelar Cancelados" permite mostrar ou esconder processos com status "Cancelado".
7.  O botão "Imprimir Tabela" gera uma versão otimizada para impressão.
8.  O botão "PCA Publicada" exibe informações sobre a data da última publicação da Planilha de Contratações Anual.
9.  Navegue para "Dados Analíticos" através do botão correspondente para visualizações e métricas.

## Principais arquivos

### HTML
- [`index.html`](index.html): Estrutura principal da página HTML do boletim.
- [`DadosAnaliticos.html`](DadosAnaliticos.html): Estrutura da página de visualização de dados analíticos.

### CSS
- [`css/layout/Main.css`](css/layout/Main.css): Estilos principais, layout e responsividade geral.
- [`css/layout/Bootstrap-Custom.css`](css/layout/Bootstrap-Custom.css): Customizações específicas do framework Bootstrap.
- [`css/layout/Tokens.css`](css/layout/Tokens.css): Define variáveis CSS (cores, fontes, espaçamentos) para padronização do design.

#### Componentes CSS
- [`css/components/Areas.css`](css/components/Areas.css): Estilos específicos para a visualização das diferentes áreas dos processos.
- [`css/components/AtualizacaoAutomatica.css`](css/components/AtualizacaoAutomatica.css): Estilos para o modal de notificação de atualização automática.
- [`css/components/Emojis.css`](css/components/Emojis.css): Estilos para as animações e exibição dos emojis de status.
- [`css/components/HeaderResponsive.css`](css/components/HeaderResponsive.css): Estilos para o cabeçalho responsivo da aplicação.
- [`css/components/LimparFiltros.css`](css/components/LimparFiltros.css): Estilos para o botão de limpar filtros.
- [`css/components/Orcamento.css`](css/components/Orcamento.css): Estilos específicos para os tipos de orçamento dos processos.
- [`css/components/PainelResumoCollapsible.css`](css/components/PainelResumoCollapsible.css): Estilos para o painel de resumo recolhível.
- [`css/components/StatusAtrasado.css`](css/components/StatusAtrasado.css): Estilos para destacar processos com status "Atrasado".
- [`css/components/TableOptimization.css`](css/components/TableOptimization.css): Otimizações de performance e layout para a tabela principal.
- [`css/components/ToolbarResponsive.css`](css/components/ToolbarResponsive.css): Estilos para a barra de ferramentas responsiva.

#### Layout CSS
- [`css/layout/Bootstrap-Custom.css`](css/layout/Bootstrap-Custom.css): Customizações específicas do framework Bootstrap para o projeto.
- [`css/layout/Main.css`](css/layout/Main.css): Estilos principais, layout e responsividade geral.
- [`css/layout/Tokens.css`](css/layout/Tokens.css): Define variáveis CSS (cores, fontes, espaçamentos) para padronização do design.

#### Mobile CSS
- [`css/mobile/MobileCards.css`](css/mobile/MobileCards.css): Estilos para o sistema de cards otimizado para dispositivos móveis.
- [`css/mobile/MobileResponsive.css`](css/mobile/MobileResponsive.css): Estilos gerais de responsividade para dispositivos móveis.

#### Páginas CSS
- [`css/pages/Analytics-Bootstrap.css`](css/pages/Analytics-Bootstrap.css): Estilos Bootstrap específicos para a página de análise.
- [`css/pages/Analytics.css`](css/pages/Analytics.css): Estilos específicos para a página de dados analíticos.

### JavaScript

#### Core (Scripts Principais)
- [`script/core/Main.js`](script/core/Main.js): Script principal, responsável pelo carregamento dos dados da planilha, montagem inicial da tabela e inicialização de outras funcionalidades.
- [`script/core/ModalManager.js`](script/core/ModalManager.js): Gerenciador central para todos os modais da aplicação, controlando abertura, fechamento e comportamentos.
- [`script/core/OrganizacaoDosDados.js`](script/core/OrganizacaoDosDados.js): Implementa a funcionalidade de ordenação das colunas da tabela.
- [`script/core/AtualizacaoAutomatica.js`](script/core/AtualizacaoAutomatica.js): Implementa a verificação periódica de atualizações na planilha e atualiza a tabela automaticamente.

#### Analytics (Análise de Dados)
- [`script/analytics/Analytics.js`](script/analytics/Analytics.js): Processa os dados brutos do CSV para gerar dados analíticos, como contagens e valores totais por diversas categorias.
- [`script/analytics/AnalyticsContratos.js`](script/analytics/AnalyticsContratos.js): Script auxiliar para análises focadas em contratos.
- [`script/analytics/AnalyticsDetails.js`](script/analytics/AnalyticsDetails.js): Fornece funções para renderizar visualizações detalhadas dos dados processados.
- [`script/analytics/AnalyticsRender.js`](script/analytics/AnalyticsRender.js): Contém funções para renderizar as diferentes seções da página de análise de dados.

#### Filters (Sistema de Filtros)
- [`script/filters/FilterControls.js`](script/filters/FilterControls.js): Gerencia a lógica dos filtros (dropdowns, pesquisa, datas) e a atualização da tabela com base neles.
- [`script/filters/GoogleSheetFilters.js`](script/filters/GoogleSheetFilters.js): Filtros específicos para dados do Google Sheets.
- [`script/filters/ClearFiltersButton.js`](script/filters/ClearFiltersButton.js): Funcionalidade do botão para limpar todos os filtros.

#### Handlers (Manipuladores de Dados)
- [`script/handlers/AcompanhamentoDeProjetos.js`](script/handlers/AcompanhamentoDeProjetos.js): Gerencia a exibição de informações de acompanhamento dos projetos, buscando dados de uma aba específica da planilha e mostrando tooltips.
- [`script/handlers/InformacoesDeContratos.js`](script/handlers/InformacoesDeContratos.js): Adiciona tooltips e interatividade para exibir detalhes de contratos na tabela.
- [`script/handlers/PainelResumoUpdates.js`](script/handlers/PainelResumoUpdates.js): Atualizações do painel de resumo com dados dinâmicos.
- [`script/handlers/RenovacaoAtrasada.js`](script/handlers/RenovacaoAtrasada.js): Destaca visualmente projetos com renovação próxima do vencimento ou vencida.
- [`script/handlers/StatusAtrasado.js`](script/handlers/StatusAtrasado.js): Adiciona tooltips ou indicadores visuais para processos com status "Atrasado", fornecendo mais contexto ao usuário.
- [`script/handlers/UpdateStatus.js`](script/handlers/UpdateStatus.js): Atualiza informações de status no rodapé da página (ex: data da última atualização).

#### Mobile (Funcionalidades Mobile)
- [`script/mobile/MobileCardsData.js`](script/mobile/MobileCardsData.js): Processamento e manipulação de dados para o sistema de cards móveis.
- [`script/mobile/MobileCardsDetails.js`](script/mobile/MobileCardsDetails.js): Gerenciamento de detalhes e informações expandidas nos cards móveis.
- [`script/mobile/MobileCardsEvents.js`](script/mobile/MobileCardsEvents.js): Manipulação de eventos e interações dos cards móveis.
- [`script/mobile/MobileCardsFilters.js`](script/mobile/MobileCardsFilters.js): Sistema de filtros específico para a interface de cards móveis.
- [`script/mobile/MobileCardsManager.js`](script/mobile/MobileCardsManager.js): Gerenciador principal do sistema de cards para dispositivos móveis.
- [`script/mobile/MobileCardsRenderer.js`](script/mobile/MobileCardsRenderer.js): Renderização e montagem visual dos cards móveis.
- [`script/mobile/MobileCardsStyles.js`](script/mobile/MobileCardsStyles.js): Aplicação dinâmica de estilos nos cards móveis.
- [`script/mobile/MobileCardsTooltips.js`](script/mobile/MobileCardsTooltips.js): Sistema de tooltips e informações contextuais para cards móveis.
- [`script/mobile/MobileUtils.js`](script/mobile/MobileUtils.js): Funções utilitárias gerais para dispositivos móveis.

#### UI (Interface do Usuário)
- [`script/ui/btnAnalytics.js`](script/ui/btnAnalytics.js): Controla o botão que leva à página de dados analíticos.
- [`script/ui/btnCancelados.js`](script/ui/btnCancelados.js): Controla a funcionalidade de ocultar e revelar processos cancelados.
- [`script/ui/btnFonteDeDados.js`](script/ui/btnFonteDeDados.js): Gerencia a funcionalidade do botão que leva à fonte de dados.
- [`script/ui/btnPCAPublicada.js`](script/ui/btnPCAPublicada.js): Controla a funcionalidade do botão "PCA Publicada", incluindo a exibição de uma modal com informações relevantes.
- [`script/ui/PainelDeResumos.js`](script/ui/PainelDeResumos.js): Controla o painel de resumo, atualizando as contagens por status e permitindo o filtro rápido.
- [`script/ui/PainelResumoCollapsible.js`](script/ui/PainelResumoCollapsible.js): Funcionalidade de painel de resumo recolhível.
- [`script/ui/PrintFunction.js`](script/ui/PrintFunction.js): Contém a função para preparar e acionar a impressão otimizada da tabela.
- [`script/ui/ToolbarResponsive.js`](script/ui/ToolbarResponsive.js): Gerenciamento da barra de ferramentas responsiva da aplicação.

#### Utils (Utilitários)
- [`script/utils/AreasClasses.js`](script/utils/AreasClasses.js): Aplica classes CSS às linhas da tabela com base na área do processo.
- [`script/utils/BootstrapAdapter.js`](script/utils/BootstrapAdapter.js): Adaptador para integração e configuração do framework Bootstrap.
- [`script/utils/BootstrapEnhancements.js`](script/utils/BootstrapEnhancements.js): Melhorias e extensões personalizadas para componentes Bootstrap.
- [`script/utils/EmojiAnimation.js`](script/utils/EmojiAnimation.js): Gerencia as animações dos emojis associados aos status dos processos.
- [`script/utils/OrcamentoClasses.js`](script/utils/OrcamentoClasses.js): Aplica classes CSS às linhas da tabela com base no tipo de orçamento.
- [`script/utils/ProcessoModal.js`](script/utils/ProcessoModal.js): Gerenciamento de modais específicos para visualização de detalhes de processos.
- [`script/utils/StatusClasses.js`](script/utils/StatusClasses.js): Aplica classes CSS às linhas da tabela com base no status do processo, permitindo estilização específica.
- [`script/utils/TableFormatters.js`](script/utils/TableFormatters.js): Funções para formatar dados exibidos na tabela (ex: valores monetários, datas).

## Observações

- O projeto depende de conexão com a internet para buscar os dados do Google Sheets.
- Para personalizar os filtros ou colunas, ajuste os arquivos JavaScript e HTML conforme necessário.
- O overlay de carregamento é exibido até que todos os dados estejam prontos para visualização.
- A nova arquitetura modular facilita a manutenção e extensão do projeto.
- Todos os arquivos seguem a convenção CamelCase para consistência.
- A interface é totalmente responsiva, adaptando-se automaticamente a diferentes dispositivos.
- A nomenclatura profissional da pasta `script` segue as melhores práticas de desenvolvimento web moderno.

## Melhorias Implementadas

### 🔧 Refatoração Estrutural
- **Reorganização completa** da estrutura de pastas por funcionalidade
- **Padronização de nomenclatura** com convenção CamelCase
- **Separação clara de responsabilidades** entre módulos
- **Integração do Bootstrap** para componentes modernos e responsivos
- **Rename profissional** da pasta "JS" para "script" para maior profissionalismo

### 📱 Otimizações Mobile
- **Sistema de Cards Móveis**: Interface completamente redesenhada para dispositivos móveis
- **Gerenciamento avançado de filtros** otimizado para touch
- **Renderização otimizada** para performance em dispositivos móveis
- **Tooltips contextuais** adaptados para interação touch

### 🎨 Melhorias de Interface
- **Modais centralizados** com gerenciamento unificado
- **Barra de ferramentas responsiva** adaptável a diferentes tamanhos de tela
- **Otimizações de performance** na tabela principal
- **Componentes Bootstrap customizados** para melhor experiência visual

### 🚀 Performance e Funcionalidades
- **Processamento otimizado** de dados para cards móveis
- **Sistema de eventos aprimorado** para interações móveis
- **Adaptadores Bootstrap** para integração seamless
- **Melhorias nas animações** e transições

---

Desenvolvido por Felipe Citsakti
