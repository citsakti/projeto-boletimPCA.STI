# Boletim PCA 2025 - STI

Este projeto é um painel interativo para acompanhamento do Boletim PCA 2025 da STI, consumindo dados de uma planilha Google Sheets em tempo real. O sistema permite filtrar, pesquisar, imprimir e visualizar o status dos processos de aquisição de forma responsiva, adaptando-se a dispositivos móveis e desktop.

## Funcionalidades

- **Carregamento automático de dados** via CSV do Google Sheets.
- **Filtros avançados** por área, tipo, status do processo, datas, valores e outros campos.
- **Painel de resumo** com contagem por status e filtro rápido.
- **Ocultação/revelação de processos cancelados**.
- **Impressão otimizada** da tabela.
- **Animações de emojis** para destacar status especiais.
- **Interface responsiva** para uso em dispositivos móveis.
- **Overlay de carregamento** com efeito blur enquanto os dados são carregados.

## Estrutura do Projeto

```
Projeto Boletim/
│   index.html
│
├── css/
│     style.css
│     tokens.css
│     style-emojis.css
│
├── JS/
│     main.js
│     filter-controls.js
│     painel de resumo.js
│     print function.js
│     sortTable.js
│     table-formatters.js
│     toggleCancelados.js
│     emoji animation function.js
│     updateStatus.js
│
└── IMG/
      tribunal.png
      favicon.ico
```

## Como usar

1. **Abra o arquivo `index.html` em seu navegador.**
2. Aguarde o carregamento dos dados (um overlay será exibido durante o processo).
3. Utilize os filtros e botões para explorar e manipular os dados conforme necessário.

## Principais arquivos

- [`index.html`](index.html): Estrutura principal da página.
- [`css/style.css`](css/style.css): Estilos principais e responsividade.
- [`css/tokens.css`](css/tokens.css): Variáveis de design (cores, espaçamentos, etc).
- [`JS/main.js`](JS/main.js): Carregamento e montagem da tabela.
- [`JS/filter-controls.js`](JS/filter-controls.js): Lógica dos filtros e dropdowns.
- [`JS/painel de resumo.js`](JS/painel%20de%20resumo.js): Painel de resumo e filtro rápido por status.
- [`JS/print function.js`](JS/print%20function.js): Função de impressão otimizada.
- [`JS/sortTable.js`](JS/sortTable.js): Ordenação das colunas da tabela.
- [`JS/toggleCancelados.js`](JS/toggleCancelados.js): Ocultar/revelar linhas canceladas.
- [`JS/emoji animation function.js`](JS/emoji%20animation%20function.js): Animações de emojis nos status.
- [`JS/updateStatus.js`](JS/updateStatus.js): Atualização do status no rodapé.

## Observações

- O projeto depende de conexão com a internet para buscar os dados do Google Sheets.
- Para personalizar os filtros ou colunas, ajuste os arquivos JS e HTML conforme necessário.
- O overlay de carregamento é exibido até que todos os dados estejam prontos para visualização.

---

Desenvolvido por Felipe Citsakti
