/**
 * Script de Debug para Acompanhamento de Processos
 * 
 * Execute este script no console do navegador para diagnosticar problemas
 * de renderização do sistema de acompanhamento.
 * 
 * Como usar:
 * 1. Abra o index.html no navegador
 * 2. Abra o console (F12)
 * 3. Cole e execute este script
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DO SISTEMA DE ACOMPANHAMENTO');
console.log('='.repeat(60));

// Função para aguardar um tempo específico
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de diagnóstico
async function diagnosticarAcompanhamento() {
    console.log('📊 1. VERIFICANDO ESTADO INICIAL...');
    
    // Verificar se as funções estão disponíveis
    console.log('✓ Funções disponíveis:');
    console.log('  - window.debugAcompanhamentoDetalhado:', typeof window.debugAcompanhamentoDetalhado);
    console.log('  - window.atualizarAcompanhamentoProcessos:', typeof window.atualizarAcompanhamentoProcessos);
    console.log('  - window._acompanhamentoDebug:', window._acompanhamentoDebug);
    
    // Verificar estrutura da tabela
    console.log('\n🔍 2. VERIFICANDO ESTRUTURA DA TABELA...');
    const tbody = document.querySelector('#detalhes table tbody');
    console.log('  - Tbody encontrado:', !!tbody);
    
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        console.log('  - Total de linhas:', rows.length);
        
        if (rows.length > 0) {
            const primeiraLinha = rows[0];
            console.log('  - Células na primeira linha:', primeiraLinha.children.length);
            
            // Verificar cabeçalhos
            const headers = document.querySelectorAll('#detalhes table thead th');
            console.log('  - Cabeçalhos encontrados:');
            headers.forEach((th, i) => {
                console.log(`    [${i}]: ${th.textContent.trim()}`);
            });
            
            // Verificar primeira linha de dados
            console.log('  - Primeira linha de dados:');
            Array.from(primeiraLinha.children).forEach((td, i) => {
                console.log(`    [${i}]: ${td.textContent.trim()}`);
            });
        }
    }
    
    // Ativar debug e executar diagnóstico detalhado
    console.log('\n🔧 3. ATIVANDO DEBUG E EXECUTANDO DIAGNÓSTICO...');
    window._acompanhamentoDebug = true;
    
    if (typeof window.debugAcompanhamentoDetalhado === 'function') {
        window.debugAcompanhamentoDetalhado();
    } else {
        console.warn('⚠️ Função debugAcompanhamentoDetalhado não encontrada');
    }
    
    // Forçar atualização
    console.log('\n🔄 4. FORÇANDO ATUALIZAÇÃO...');
    if (typeof window.atualizarAcompanhamentoProcessos === 'function') {
        try {
            await window.atualizarAcompanhamentoProcessos();
            console.log('✓ Atualização executada com sucesso');
        } catch (error) {
            console.error('❌ Erro na atualização:', error);
        }
    } else {
        console.warn('⚠️ Função atualizarAcompanhamentoProcessos não encontrada');
    }
    
    // Aguardar e verificar novamente
    console.log('\n⏱️ 5. AGUARDANDO 5 SEGUNDOS E VERIFICANDO RESULTADO...');
    await wait(5000);
    
    console.log('\n📈 6. VERIFICAÇÃO FINAL:');
    if (typeof window.debugAcompanhamentoDetalhado === 'function') {
        window.debugAcompanhamentoDetalhado();
    }
    
    // Verificar se alguma célula foi atualizada
    const celulasAcompanhamento = document.querySelectorAll('#detalhes table tbody td:nth-child(5)');
    let celulasComDados = 0;
    let celulasComAPI = 0;
    
    celulasAcompanhamento.forEach(cell => {
        if (cell.textContent.trim() && cell.textContent.trim() !== '') {
            celulasComDados++;
        }
        if (cell.dataset.fonteDados === 'api') {
            celulasComAPI++;
        }
    });
    
    console.log('\n📊 7. RESUMO FINAL:');
    console.log(`  - Total de células de acompanhamento: ${celulasAcompanhamento.length}`);
    console.log(`  - Células com dados: ${celulasComDados}`);
    console.log(`  - Células atualizadas pela API: ${celulasComAPI}`);
    
    if (celulasComAPI > 0) {
        console.log('✅ SUCCESS: Sistema funcionando! Dados da API foram renderizados.');
    } else if (celulasComDados > 0) {
        console.log('⚠️ WARNING: Há dados nas células, mas não vieram da API.');
    } else {
        console.log('❌ ERROR: Nenhum dado foi renderizado nas células de acompanhamento.');
    }
    
    console.log('\n🔚 DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(60));
}

// Verificar se a página já carregou
if (document.readyState === 'loading') {
    console.log('⏳ Aguardando carregamento da página...');
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(diagnosticarAcompanhamento, 2000);
    });
} else {
    console.log('✓ Página já carregada, iniciando diagnóstico...');
    setTimeout(diagnosticarAcompanhamento, 2000);
}

// Expor função para execução manual
window.diagnosticarAcompanhamento = diagnosticarAcompanhamento;

console.log('\n💡 DICA: Para executar o diagnóstico manualmente, digite:');
console.log('   diagnosticarAcompanhamento()');
