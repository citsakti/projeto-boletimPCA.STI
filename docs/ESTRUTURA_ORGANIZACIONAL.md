# Estrutura Organizacional do Projeto - Convenção CamelCase

## 📁 JavaScript (JS/)

A pasta `JS/` foi reorganizada em subpastas baseadas em funcionalidades, seguindo a convenção **CamelCase** para todos os arquivos:

### 📊 JS/analytics/
Scripts relacionados à página e funcionalidades de análise:
- `Analytics.js` - Lógica principal de analytics
- `AnalyticsContratos.js` - Analytics específicos para contratos
- `AnalyticsDetails.js` - Detalhes e métricas de analytics
- `AnalyticsRender.js` - Renderização de componentes de analytics

### 📱 JS/mobile/
Scripts específicos para funcionalidades mobile:
- `MobileDeviceDetection.js` - Detecção de dispositivos móveis
- `MobileMenu.js` - Menu para dispositivos móveis
- `MobileGoogleSheetFilters.js` - Filtros mobile para Google Sheets

### 🎨 JS/ui/
Scripts que controlam partes específicas da interface do usuário:
- `btnAnalytics.js` - Controle do botão de analytics
- `btnCancelados.js` - Controle do botão de cancelados
- `btnFonteDeDados.js` - Controle do botão de fonte de dados
- `btnPCAPublicada.js` - Controle do botão PCA publicada
- `PainelDeResumos.js` - Controle do painel de resumos
- `PainelResumoCollapsible.js` - Painel de resumo recolhível
- `PrintFunction.js` - Funcionalidade de impressão

### 🔍 JS/filters/
Scripts relacionados à lógica de filtragem da tabela:
- `FilterControls.js` - Controles principais de filtro
- `GoogleSheetFilters.js` - Filtros específicos para Google Sheets
- `ClearFiltersButton.js` - Botão para limpar filtros

### 🛠️ JS/utils/
Funções utilitárias genéricas usadas em várias partes do projeto:
- `TableFormatters.js` - Formatadores de tabela
- `EmojiAnimation.js` - Animações de emoji
- `AreasClasses.js` - Classes relacionadas a áreas
- `OrcamentoClasses.js` - Classes relacionadas a orçamento
- `StatusClasses.js` - Classes de status

### ⚙️ JS/core/
Script principal e lógica central da aplicação:
- `Main.js` - Script principal da aplicação
- `OrganizacaoDosDados.js` - Organização e estruturação de dados
- `AtualizacaoAutomatica.js` - Sistema de atualização automática

### 🔄 JS/handlers/
Scripts que lidam com manipulação de dados específicos ou eventos:
- `AcompanhamentoDeProjetos.js` - Acompanhamento de projetos
- `InformacoesDeContratos.js` - Informações de contratos
- `RenovacaoAtrasada.js` - Controle de renovações atrasadas
- `StatusAtrasado.js` - Controle de status atrasados
- `UpdateStatus.js` - Atualização de status
- `PainelResumoUpdates.js` - Atualizações do painel de resumo

## 🎨 CSS (css/)

A pasta `css/` foi reorganizada em subpastas por funcionalidade, seguindo a convenção **CamelCase**:

### 📱 css/mobile/
Estilos específicos para dispositivos móveis:
- `MobileFilters.css` - Filtros para mobile
- `MobileGoogleSheetFilters.css` - Filtros Google Sheets para mobile
- `MobileMenu.css` - Menu mobile
- `StyleMobile.css` - Estilos gerais para mobile

### 🧩 css/components/
Estilos de componentes específicos:
- `PainelResumoCollapsible.css` - Painel de resumo recolhível
- `StyleLimparFiltros.css` - Botão de limpar filtros
- `StyleDeviceDetection.css` - Detecção de dispositivo
- `StyleAreas.css` - Estilos de áreas
- `StyleOrcamento.css` - Estilos de orçamento
- `StyleStatusAtrasado.css` - Estilos de status atrasado
- `StyleEmojis.css` - Estilos de emojis
- `StyleAtualizacaoAutomatica.css` - Estilos de atualização automática

### 📄 css/pages/
Estilos específicos para páginas:
- `StyleAnalytics.css` - Estilos da página de analytics

### 🏗️ css/layout/
Estilos de layout e estrutura:
- `Style.css` - Estilos principais do layout
- `Tokens.css` - Tokens de design (cores, espaçamentos, etc.)

## 📋 Convenções de Nomenclatura

### JavaScript
- **CamelCase** para todos os nomes de arquivos (ex: `AcompanhamentoDeProjetos.js`, `TableFormatters.js`)
- Nomes descritivos que indicam a funcionalidade
- Prefixos como `btn` para botões, quando aplicável
- Separação clara entre funcionalidades mobile e desktop

### CSS
- **CamelCase** para todos os nomes de arquivos (ex: `StyleAnalytics.css`, `MobileFilters.css`)
- Prefixo `Style` para componentes genéricos
- Prefixo `Mobile` para funcionalidades mobile específicas
- Nomes que indicam claramente o componente ou funcionalidade

## 🔄 Benefícios da Nova Estrutura

1. **Navegação Melhorada**: Fácil localização de arquivos por funcionalidade
2. **Manutenibilidade**: Código organizado facilita manutenção e debugging
3. **Escalabilidade**: Estrutura preparada para crescimento do projeto
4. **Padrões Consistentes**: Nomenclatura uniforme em todo o projeto
5. **Separação de Responsabilidades**: Cada pasta tem uma responsabilidade clara
6. **Mobile-First**: Organização específica para responsividade

## 📝 Próximos Passos Recomendados

1. Atualizar referências de arquivos nos HTMLs principais
2. Verificar imports/includes nos scripts JavaScript
3. Considerar implementação de um bundler (Webpack, Vite) para otimização
4. Criar documentação específica para cada módulo
5. Implementar sistema de versionamento para CSS e JS
