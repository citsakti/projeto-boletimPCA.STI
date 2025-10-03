/**
 * AnalyticsRenderProdutividade.js - Renderização específica para tabelas de PRODUTIVIDADE
 * 
 * Este arquivo contém apenas a renderização de tabelas de produtividade.
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderProdutividadeProjetosTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos de produtividade
 * @param {Array} projetos - Lista de projetos para exibir
 * @returns {string} - HTML da tabela de detalhes
 */
function renderProdutividadeProjetosTable(projetos) {
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    // Ordenar projetos para que os concluídos e renovados apareçam no final
    const projetosOrdenados = [...projetos].sort((a, b) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        
        // Verificar se são status concluídos/renovados
        const isAConcluido = statusA.includes('CONTRATADO ✅') || statusA.includes('RENOVADO ✅');
        const isBConcluido = statusB.includes('CONTRATADO ✅') || statusB.includes('RENOVADO ✅');
        
        // Se ambos são concluídos ou ambos não são, manter ordem original
        if (isAConcluido === isBConcluido) {
            return 0;
        }
        
        // Se apenas A é concluído, vai para o final (retorna 1)
        if (isAConcluido && !isBConcluido) {
            return 1;
        }
        
        // Se apenas B é concluído, A vem primeiro (retorna -1)
        if (!isAConcluido && isBConcluido) {
            return -1;
        }
        
        return 0;
    });
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Data PCA</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetosOrdenados.forEach(projeto => {
        let tipoCellContent = projeto.tipo;
        let tdTipoClass = '';

        if (tipoCellContent && (tipoCellContent.includes('🔄 Renovação') || tipoCellContent.includes('🛒 Aquisição'))) {
            tdTipoClass = 'no-wrap-cell';
        }

        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
            contratoAttrs += ` data-registro="${String(projeto.numeroRegistro).trim()}"`;
        }
        
        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${formatAreaWithClasses(projeto.area)}</td>
                <td class="${tdTipoClass}">${tipoCellContent}</td>
                <td${contratoAttrs}>${projeto.projeto}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td class="no-wrap-cell">${renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Expor função globalmente
if (typeof window !== 'undefined') {
    window.renderProdutividadeProjetosTable = renderProdutividadeProjetosTable;
}
