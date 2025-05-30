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
│   │     DeviceDetection.css
│   │     Emojis.css
│   │     LimparFiltros.css
│   │     Orcamento.css
│   │     PainelResumoCollapsible.css
│   │     StatusAtrasado.css
│   ├── layout/
│   │     Main.css
│   │     Tokens.css
│   ├── mobile/
│   │     Mobile.css
│   │     MobileFilters.css
│   │     MobileGoogleSheetFilters.css
│   │     MobileMenu.css
│   └── pages/
│         Analytics.css
│
├── JS/
│   ├── analytics/
│   │     Analytics.js
│   │     AnalyticsContratos.js
│   │     AnalyticsDetails.js
│   │     AnalyticsRender.js
│   ├── core/
│   │     AtualizacaoAutomatica.js
│   │     Main.js
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
│   │     MobileDeviceDetection.js
│   │     MobileGoogleSheetFilters.js
│   │     MobileMenu.js
│   ├── ui/
│   │     btnAnalytics.js
│   │     btnCancelados.js
│   │     btnFonteDeDados.js
│   │     btnPCAPublicada.js
│   │     PainelDeResumos.js
│   │     PainelResumoCollapsible.js
│   │     PrintFunction.js
│   └── utils/
│         AreasClasses.js
│         EmojiAnimation.js
│         OrcamentoClasses.js
│         StatusClasses.js
│         TableFormatters.js
│
├── docs/
│     CHECKLIST_MIGRACAO.md
│     ESTRUTURA_ORGANIZACIONAL.md
│     PADRONIZACAO_CAMELCASE.md
│     REMOCAO_PREFIXO_STYLE.md
│     RESULTADO_FINAL.md
│
└── IMG/
      tribunal.png
      tribunal1.png      favicon.ico
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
- **`layout/`**: Estilos de estrutura geral e tokens de design
- **`components/`**: Estilos de componentes específicos e reutilizáveis
- **`mobile/`**: Estilos dedicados para dispositivos móveis
- **`pages/`**: Estilos específicos para páginas individuais

#### JavaScript
- **`core/`**: Scripts principais e lógica central da aplicação
- **`analytics/`**: Sistema completo de análise e visualização de dados
- **`filters/`**: Sistema de filtragem avançado
- **`handlers/`**: Manipuladores de eventos e dados específicos
- **`mobile/`**: Funcionalidades otimizadas para dispositivos móveis
- **`ui/`**: Componentes de interface e controles visuais
- **`utils/`**: Funções utilitárias e formatadores reutilizáveis

### 📋 Documentação
A pasta `docs/` contém documentação detalhada sobre:
- Processo de migração e refatoração
- Estrutura organizacional do projeto
- Padronização de nomenclatura
- Resultado final das implementações

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
- [`css/layout/Tokens.css`](css/layout/Tokens.css): Define variáveis CSS (cores, fontes, espaçamentos) para padronização do design.

#### Componentes CSS
- [`css/components/Areas.css`](css/components/Areas.css): Estilos específicos para a visualização das diferentes áreas dos processos.
- [`css/components/AtualizacaoAutomatica.css`](css/components/AtualizacaoAutomatica.css): Estilos para o modal de notificação de atualização automática.
- [`css/components/DeviceDetection.css`](css/components/DeviceDetection.css): Estilos para detecção e adaptação de dispositivos.
- [`css/components/Emojis.css`](css/components/Emojis.css): Estilos para as animações e exibição dos emojis de status.
- [`css/components/LimparFiltros.css`](css/components/LimparFiltros.css): Estilos para o botão de limpar filtros.
- [`css/components/Orcamento.css`](css/components/Orcamento.css): Estilos específicos para os tipos de orçamento dos processos.
- [`css/components/PainelResumoCollapsible.css`](css/components/PainelResumoCollapsible.css): Estilos para o painel de resumo recolhível.
- [`css/components/StatusAtrasado.css`](css/components/StatusAtrasado.css): Estilos para destacar processos com status "Atrasado".

#### Mobile CSS
- [`css/mobile/Mobile.css`](css/mobile/Mobile.css): Estilos principais para dispositivos móveis.
- [`css/mobile/MobileFilters.css`](css/mobile/MobileFilters.css): Estilos para filtros em dispositivos móveis.
- [`css/mobile/MobileGoogleSheetFilters.css`](css/mobile/MobileGoogleSheetFilters.css): Filtros Google Sheets otimizados para mobile.
- [`css/mobile/MobileMenu.css`](css/mobile/MobileMenu.css): Menu responsivo para dispositivos móveis.

#### Páginas CSS
- [`css/pages/Analytics.css`](css/pages/Analytics.css): Estilos específicos para a página de dados analíticos.

### JavaScript

#### Core (Scripts Principais)
- [`JS/core/Main.js`](JS/core/Main.js): Script principal, responsável pelo carregamento dos dados da planilha, montagem inicial da tabela e inicialização de outras funcionalidades.
- [`JS/core/OrganizacaoDosDados.js`](JS/core/OrganizacaoDosDados.js): Implementa a funcionalidade de ordenação das colunas da tabela.
- [`JS/core/AtualizacaoAutomatica.js`](JS/core/AtualizacaoAutomatica.js): Implementa a verificação periódica de atualizações na planilha e atualiza a tabela automaticamente.

#### Analytics (Análise de Dados)
- [`JS/analytics/Analytics.js`](JS/analytics/Analytics.js): Processa os dados brutos do CSV para gerar dados analíticos, como contagens e valores totais por diversas categorias.
- [`JS/analytics/AnalyticsContratos.js`](JS/analytics/AnalyticsContratos.js): Script auxiliar para análises focadas em contratos.
- [`JS/analytics/AnalyticsDetails.js`](JS/analytics/AnalyticsDetails.js): Fornece funções para renderizar visualizações detalhadas dos dados processados.
- [`JS/analytics/AnalyticsRender.js`](JS/analytics/AnalyticsRender.js): Contém funções para renderizar as diferentes seções da página de análise de dados.

#### Filters (Sistema de Filtros)
- [`JS/filters/FilterControls.js`](JS/filters/FilterControls.js): Gerencia a lógica dos filtros (dropdowns, pesquisa, datas) e a atualização da tabela com base neles.
- [`JS/filters/GoogleSheetFilters.js`](JS/filters/GoogleSheetFilters.js): Filtros específicos para dados do Google Sheets.
- [`JS/filters/ClearFiltersButton.js`](JS/filters/ClearFiltersButton.js): Funcionalidade do botão para limpar todos os filtros.

#### Handlers (Manipuladores de Dados)
- [`JS/handlers/AcompanhamentoDeProjetos.js`](JS/handlers/AcompanhamentoDeProjetos.js): Gerencia a exibição de informações de acompanhamento dos projetos, buscando dados de uma aba específica da planilha e mostrando tooltips.
- [`JS/handlers/InformacoesDeContratos.js`](JS/handlers/InformacoesDeContratos.js): Adiciona tooltips e interatividade para exibir detalhes de contratos na tabela.
- [`JS/handlers/PainelResumoUpdates.js`](JS/handlers/PainelResumoUpdates.js): Atualizações do painel de resumo com dados dinâmicos.
- [`JS/handlers/RenovacaoAtrasada.js`](JS/handlers/RenovacaoAtrasada.js): Destaca visualmente projetos com renovação próxima do vencimento ou vencida.
- [`JS/handlers/StatusAtrasado.js`](JS/handlers/StatusAtrasado.js): Adiciona tooltips ou indicadores visuais para processos com status "Atrasado", fornecendo mais contexto ao usuário.
- [`JS/handlers/UpdateStatus.js`](JS/handlers/UpdateStatus.js): Atualiza informações de status no rodapé da página (ex: data da última atualização).

#### Mobile (Funcionalidades Mobile)
- [`JS/mobile/MobileDeviceDetection.js`](JS/mobile/MobileDeviceDetection.js): Detecção e adaptação para dispositivos móveis.
- [`JS/mobile/MobileGoogleSheetFilters.js`](JS/mobile/MobileGoogleSheetFilters.js): Filtros Google Sheets otimizados para dispositivos móveis.
- [`JS/mobile/MobileMenu.js`](JS/mobile/MobileMenu.js): Menu responsivo para dispositivos móveis.

#### UI (Interface do Usuário)
- [`JS/ui/btnAnalytics.js`](JS/ui/btnAnalytics.js): Controla o botão que leva à página de dados analíticos.
- [`JS/ui/btnCancelados.js`](JS/ui/btnCancelados.js): Controla a funcionalidade de ocultar e revelar processos cancelados.
- [`JS/ui/btnFonteDeDados.js`](JS/ui/btnFonteDeDados.js): Gerencia a funcionalidade do botão que leva à fonte de dados.
- [`JS/ui/btnPCAPublicada.js`](JS/ui/btnPCAPublicada.js): Controla a funcionalidade do botão "PCA Publicada", incluindo a exibição de uma modal com informações relevantes.
- [`JS/ui/PainelDeResumos.js`](JS/ui/PainelDeResumos.js): Controla o painel de resumo, atualizando as contagens por status e permitindo o filtro rápido.
- [`JS/ui/PainelResumoCollapsible.js`](JS/ui/PainelResumoCollapsible.js): Funcionalidade de painel de resumo recolhível.
- [`JS/ui/PrintFunction.js`](JS/ui/PrintFunction.js): Contém a função para preparar e acionar a impressão otimizada da tabela.

#### Utils (Utilitários)
- [`JS/utils/AreasClasses.js`](JS/utils/AreasClasses.js): Aplica classes CSS às linhas da tabela com base na área do processo.
- [`JS/utils/EmojiAnimation.js`](JS/utils/EmojiAnimation.js): Gerencia as animações dos emojis associados aos status dos processos.
- [`JS/utils/OrcamentoClasses.js`](JS/utils/OrcamentoClasses.js): Aplica classes CSS às linhas da tabela com base no tipo de orçamento.
- [`JS/utils/StatusClasses.js`](JS/utils/StatusClasses.js): Aplica classes CSS às linhas da tabela com base no status do processo, permitindo estilização específica.
- [`JS/utils/TableFormatters.js`](JS/utils/TableFormatters.js): Funções para formatar dados exibidos na tabela (ex: valores monetários, datas).

## Observações

- O projeto depende de conexão com a internet para buscar os dados do Google Sheets.
- Para personalizar os filtros ou colunas, ajuste os arquivos JS e HTML conforme necessário.
- O overlay de carregamento é exibido até que todos os dados estejam prontos para visualização.
- A nova arquitetura modular facilita a manutenção e extensão do projeto.
- Todos os arquivos seguem a convenção CamelCase para consistência.
- A interface é totalmente responsiva, adaptando-se automaticamente a diferentes dispositivos.

## Melhorias Implementadas

### 🔧 Refatoração Estrutural
- **Reorganização completa** da estrutura de pastas por funcionalidade
- **Padronização de nomenclatura** com convenção CamelCase
- **Remoção de prefixos redundantes** nos nomes de arquivos CSS
- **Separação clara de responsabilidades** entre módulos

### 📱 Otimizações Mobile
- **Menu responsivo** adaptado para dispositivos móveis
- **Filtros móveis otimizados** para melhor usabilidade touch
- **Detecção automática de dispositivo** para experiência personalizada
- **Interface adaptativa** que se ajusta ao tamanho da tela

### 🎨 Melhorias de Interface
- **Painel de resumo recolhível** para economia de espaço
- **Botão "Limpar Filtros"** para reset rápido
- **Animações e transições suaves** para melhor experiência
- **Componentes modulares** reutilizáveis em toda a aplicação

---

Desenvolvido por Felipe Citsakti
