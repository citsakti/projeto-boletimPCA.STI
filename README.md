# Boletim PCA 2025 - STI

Este projeto é um painel interativo para acompanhamento do Boletim PCA 2025 da STI, consumindo dados de uma planilha Google Sheets em tempo real. O sistema permite filtrar, pesquisar, imprimir e visualizar o status dos processos de aquisição de forma responsiva, adaptando-se a dispositivos móveis e desktop.

## Funcionalidades

- **Carregamento automático de dados** via CSV do Google Sheets.
- **Filtros avançados** por área, tipo, status do processo, datas, valores e outros campos.
- **Painel de resumo** com contagem por status e filtro rápido.
- **Ocultação/revelação de processos cancelados**.
- **Impressão otimizada** da tabela.
- **Animações de emojis** para destacar status especiais.
- **Interface responsiva** para uso em dispositivos móveis e desktop.
- **Overlay de carregamento** com efeito blur enquanto os dados são carregados.
- **Estilização dinâmica de linhas** com base no status, área e tipo de orçamento do processo.
- **Destaque visual e tooltips informativos** para processos com status "Atrasado".
- **Botão "PCA Publicada"** com informações sobre a última atualização da Planilha de Contratações Anual.
- **Formatação de valores monetários e datas** na tabela.
- **Ordenação de colunas** da tabela.

## Estrutura do Projeto

```
Projeto Boletim/
│   index.html
│   README.md
│
├── css/
│     style.css
│     tokens.css
│     style-areas.css
│     style-emojis.css
│     style-mobile.css
│     style-orcamento.css
│     style-status_atrasado.css
│
├── JS/
│     main.js
│     filter-controls.js
│     painel de resumo.js
│     print function.js
│     sortTable.js
│     table-formatters.js
│     toggleCancelados.js
│     status-classes.js
│     areas-classes.js
│     orcamento-classes.js
│     emoji animation function.js
│     updateStatus.js
│     btnPCAPublicada.js
│     StatusAtrasado.js
│
└── IMG/
      tribunal.png
      tribunal1.png
      favicon.ico
```

## Como usar

1. **Abra o arquivo `index.html` em seu navegador.** Certifique-se de ter uma conexão com a internet para o carregamento dos dados.
2. Aguarde o carregamento dos dados (um overlay com efeito de blur será exibido durante o processo).
3. Utilize os filtros (por área, tipo, status, datas, etc.) e a barra de pesquisa para encontrar processos específicos.
4. Clique nos cabeçalhos das colunas para ordenar os dados.
5. Use o painel de resumo para visualizar a contagem de processos por status e aplicar filtros rápidos.
6. O botão "Ocultar/Revelar Cancelados" permite mostrar ou esconder processos com status "Cancelado".
7. O botão "Imprimir Tabela" gera uma versão otimizada para impressão.
8. O botão "PCA Publicada" exibe informações sobre a data da última publicação da Planilha de Contratações Anual.

## Principais arquivos

- [`index.html`](index.html): Estrutura principal da página HTML.
- [`css/style.css`](css/style.css): Estilos principais, layout e responsividade geral.
- [`css/tokens.css`](css/tokens.css): Define variáveis CSS (cores, fontes, espaçamentos) para padronização do design.
- [`css/style-areas.css`](css/style-areas.css): Estilos específicos para a visualização das diferentes áreas dos processos.
- [`css/style-emojis.css`](css/style-emojis.css): Estilos para as animações e exibição dos emojis de status.
- [`css/style-mobile.css`](css/style-mobile.css): Estilos adicionais para otimizar a visualização em dispositivos móveis.
- [`css/style-orcamento.css`](css/style-orcamento.css): Estilos específicos para os tipos de orçamento dos processos.
- [`css/style-status_atrasado.css`](css/style-status_atrasado.css): Estilos para destacar processos com status "Atrasado".
- [`JS/main.js`](JS/main.js): Script principal, responsável pelo carregamento dos dados da planilha, montagem inicial da tabela e inicialização de outras funcionalidades.
- [`JS/filter-controls.js`](JS/filter-controls.js): Gerencia a lógica dos filtros (dropdowns, pesquisa, datas) e a atualização da tabela com base neles.
- [`JS/painel de resumo.js`](JS/painel%20de%20resumo.js): Controla o painel de resumo, atualizando as contagens por status e permitindo o filtro rápido.
- [`JS/print function.js`](JS/print%20function.js): Contém a função para preparar e acionar a impressão otimizada da tabela.
- [`JS/sortTable.js`](JS/sortTable.js): Implementa a funcionalidade de ordenação das colunas da tabela.
- [`JS/table-formatters.js`](JS/table-formatters.js): Funções para formatar dados exibidos na tabela (ex: valores monetários, datas).
- [`JS/toggleCancelados.js`](JS/toggleCancelados.js): Controla a funcionalidade de ocultar e revelar processos cancelados.
- [`JS/status-classes.js`](JS/status-classes.js): Aplica classes CSS às linhas da tabela com base no status do processo, permitindo estilização específica.
- [`JS/areas-classes.js`](JS/areas-classes.js): Aplica classes CSS às linhas da tabela com base na área do processo.
- [`JS/orcamento-classes.js`](JS/orcamento-classes.js): Aplica classes CSS às linhas da tabela com base no tipo de orçamento.
- [`JS/emoji animation function.js`](JS/emoji%20animation%20function.js): Gerencia as animações dos emojis associados aos status dos processos.
- [`JS/updateStatus.js`](JS/updateStatus.js): Atualiza informações de status no rodapé da página (ex: número de itens exibidos).
- [`JS/btnPCAPublicada.js`](JS/btnPCAPublicada.js): Controla a funcionalidade do botão "PCA Publicada", incluindo a exibição de uma modal com informações relevantes.
- [`JS/StatusAtrasado.js`](JS/StatusAtrasado.js): Adiciona tooltips ou indicadores visuais para processos com status "Atrasado", fornecendo mais contexto ao usuário.

## Observações

- O projeto depende de conexão com a internet para buscar os dados do Google Sheets.
- Para personalizar os filtros ou colunas, ajuste os arquivos JS e HTML conforme necessário.
- O overlay de carregamento é exibido até que todos os dados estejam prontos para visualização.

---

Desenvolvido por Felipe Citsakti
