# Sistema de Cores Dinâmicas - Cards Mobile

## Descrição
O sistema de cards compactos para mobile agora implementa cores dinâmicas baseadas no status de cada projeto, seguindo a mesma paleta de cores utilizada no sistema desktop principal.

## Mapeamento de Cores por Status

### 🟡 Amarelo - Status de Aguardo
- **Aguardando DFD**: `#fbbf24` → `#f59e0b`
- **Aguardando ETP**: `#fbbf24` → `#f59e0b`
- **Texto**: Preto (`#1f2937`)

### 🔴 Vermelho - Status Atrasados (CRÍTICO)
- **ETP Atrasado**: `#ef4444` → `#dc2626`
- **DFD Atrasado**: `#ef4444` → `#dc2626`
- **Contratação Atrasada**: `#ef4444` → `#dc2626` + **Animação de piscar**
- **Autuação Atrasada**: `#ef4444` → `#dc2626`
- **Texto**: Branco

### 🔵 Azul Claro - Status em Elaboração
- **Elaborando TR**: `#60a5fa` → `#3b82f6`
- **Análise de Viabilidade**: `#60a5fa` → `#3b82f6`
- **Texto**: Branco

### 🟣 Roxo - Status de Definição
- **Aguardando Definição**: `#a855f7` → `#9333ea`
- **Texto**: Branco

### 🔵 Azul Escuro - Status de Contratação Ativa
- **Em Contratação**: `#1e40af` → `#1e3a8a`
- **Em Renovação**: `#1e40af` → `#1e3a8a`
- **Texto**: Branco

### 🟢 Verde - Status Finalizados Positivos
- **Contratado**: `#22c55e` → `#16a34a`
- **Renovado**: `#22c55e` → `#16a34a`
- **Texto**: Branco

### ⚫ Preto - Status de Revisão
- **Revisão PCA**: `#374151` → `#111827`
- **Texto**: Amarelo (`#fbbf24`)

### ⚪ Cinza - Status Neutros
- **A Iniciar**: `#9ca3af` → `#6b7280`
- **Cancelado**: `#4b5563` → `#374151`
- **Texto**: Preto (`#111827`) para "A Iniciar", Branco para "Cancelado"

## Recursos Especiais

### Animações
- **Contratação Atrasada**: Cards piscam continuamente para alertar urgência
- **Priority High**: Cards com status críticos recebem borda vermelha e sombra especial

### Responsividade
- Todas as cores mantêm contraste adequado para acessibilidade
- Gradientes suaves proporcionam visual moderno
- Efeitos hover específicos para cada cor

## Implementação Técnica

### CSS
As classes são aplicadas dinamicamente aos elementos `<tr>` com base no status:
```css
.mobile-compact-cards tbody tr.status-contratado .card-header {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
}
```

### JavaScript
O mapeamento é feito no método `applyStatusClasses()`:
```javascript
if (statusLower.includes('contratado')) {
    row.classList.add('status-contratado');
}
```

## Benefícios
1. **Identificação visual rápida** do status dos projetos
2. **Consistência** com o sistema desktop
3. **Acessibilidade** mantida com bom contraste
4. **Alertas visuais** para status críticos
5. **Experiência moderna** com gradientes e animações
