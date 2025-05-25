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

## Estrutura do Projeto

```
Projeto Boletim/
│   index.html
│   DadosAnaliticos.html
│   README.md
│   .nojekyll
│
├── css/
│     style.css
│     tokens.css
│     style-analytics.css
│     style-areas.css
│     style-atualizacao_automatica.css
│     style-emojis.css
│     style-mobile.css
│     style-orcamento.css
│     style-status_atrasado.css
│
├── JS/
│     main.js
│     AcompanhamentoDeProjetos.js
│     Analytics.js
│     AnalyticsContratos.js
│     AnalyticsDetails.js
│     AnalyticsRender.js
│     areas-classes.js
│     AtualizacaoAutomatica.js
│     btnAnalytics.js
│     btnCancelados.js
│     btnFonteDeDados.js
│     btnPCAPublicada.js
│     emoji animation function.js
│     filter-controls.js
│     InformacoesDeContratos.js
│     OrganizacaoDosDados.js
│     orcamento-classes.js
│     PainelDeResumos.js
│     PrintFunction.js
│     RenovacaoAtrasada.js
│     status-classes.js
│     StatusAtrasado.js
│     table-formatters.js
│     updateStatus.js
│
└── IMG/
      tribunal.png
      tribunal1.png
      favicon.ico
```

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
- [`css/style.css`](css/style.css): Estilos principais, layout e responsividade geral.
- [`css/tokens.css`](css/tokens.css): Define variáveis CSS (cores, fontes, espaçamentos) para padronização do design.
- [`css/style-analytics.css`](css/style-analytics.css): Estilos específicos para a página de dados analíticos.
- [`css/style-areas.css`](css/style-areas.css): Estilos específicos para a visualização das diferentes áreas dos processos.
- [`css/style-atualizacao_automatica.css`](css/style-atualizacao_automatica.css): Estilos para o modal de notificação de atualização automática.
- [`css/style-emojis.css`](css/style-emojis.css): Estilos para as animações e exibição dos emojis de status.
- [`css/style-mobile.css`](css/style-mobile.css): Estilos adicionais para otimizar a visualização em dispositivos móveis.
- [`css/style-orcamento.css`](css/style-orcamento.css): Estilos específicos para os tipos de orçamento dos processos.
- [`css/style-status_atrasado.css`](css/style-status_atrasado.css): Estilos para destacar processos com status "Atrasado".

### JavaScript
- [`JS/main.js`](JS/main.js): Script principal, responsável pelo carregamento dos dados da planilha, montagem inicial da tabela e inicialização de outras funcionalidades.
- [`JS/AcompanhamentoDeProjetos.js`](JS/AcompanhamentoDeProjetos.js): Gerencia a exibição de informações de acompanhamento dos projetos, buscando dados de uma aba específica da planilha e mostrando tooltips.
- [`JS/Analytics.js`](JS/Analytics.js): Processa os dados brutos do CSV para gerar dados analíticos, como contagens e valores totais por diversas categorias.
- [`JS/AnalyticsContratos.js`](JS/AnalyticsContratos.js): Script auxiliar para análises focadas em contratos (detalhes podem variar).
- [`JS/AnalyticsDetails.js`](JS/AnalyticsDetails.js): Fornece funções para renderizar visualizações detalhadas dos dados processados por `Analytics.js`.
- [`JS/AnalyticsRender.js`](JS/AnalyticsRender.js): Contém funções para renderizar as diferentes seções da página de análise de dados.
- [`JS/areas-classes.js`](JS/areas-classes.js): Aplica classes CSS às linhas da tabela com base na área do processo.
- [`JS/AtualizacaoAutomatica.js`](JS/AtualizacaoAutomatica.js): Implementa a verificação periódica de atualizações na planilha e atualiza a tabela automaticamente.
- [`JS/btnAnalytics.js`](JS/btnAnalytics.js): Controla o botão que leva à página de dados analíticos.
- [`JS/btnCancelados.js`](JS/btnCancelados.js): Controla a funcionalidade de ocultar e revelar processos cancelados.
- [`JS/btnFonteDeDados.js`](JS/btnFonteDeDados.js): Gerencia a funcionalidade do botão que leva à fonte de dados.
- [`JS/btnPCAPublicada.js`](JS/btnPCAPublicada.js): Controla a funcionalidade do botão "PCA Publicada", incluindo a exibição de uma modal com informações relevantes.
- [`JS/emoji animation function.js`](JS/emoji%20animation%20function.js): Gerencia as animações dos emojis associados aos status dos processos.
- [`JS/filter-controls.js`](JS/filter-controls.js): Gerencia a lógica dos filtros (dropdowns, pesquisa, datas) e a atualização da tabela com base neles.
- [`JS/InformacoesDeContratos.js`](JS/InformacoesDeContratos.js): Adiciona tooltips e interatividade para exibir detalhes de contratos na tabela.
- [`JS/OrganizacaoDosDados.js`](JS/OrganizacaoDosDados.js): Implementa a funcionalidade de ordenação das colunas da tabela.
- [`JS/orcamento-classes.js`](JS/orcamento-classes.js): Aplica classes CSS às linhas da tabela com base no tipo de orçamento.
- [`JS/PainelDeResumos.js`](JS/PainelDeResumos.js): Controla o painel de resumo, atualizando as contagens por status e permitindo o filtro rápido.
- [`JS/PrintFunction.js`](JS/PrintFunction.js): Contém a função para preparar e acionar a impressão otimizada da tabela.
- [`JS/RenovacaoAtrasada.js`](JS/RenovacaoAtrasada.js): Destaca visualmente projetos com renovação próxima do vencimento ou vencida.
- [`JS/status-classes.js`](JS/status-classes.js): Aplica classes CSS às linhas da tabela com base no status do processo, permitindo estilização específica.
- [`JS/StatusAtrasado.js`](JS/StatusAtrasado.js): Adiciona tooltips ou indicadores visuais para processos com status "Atrasado", fornecendo mais contexto ao usuário.
- [`JS/table-formatters.js`](JS/table-formatters.js): Funções para formatar dados exibidos na tabela (ex: valores monetários, datas).
- [`JS/updateStatus.js`](JS/updateStatus.js): Atualiza informações de status no rodapé da página (ex: data da última atualização).

## Observações

- O projeto depende de conexão com a internet para buscar os dados do Google Sheets.
- Para personalizar os filtros ou colunas, ajuste os arquivos JS e HTML conforme necessário.
- O overlay de carregamento é exibido até que todos os dados estejam prontos para visualização.

---

Desenvolvido por Felipe Citsakti
