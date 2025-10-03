/**
 * AnalyticsRenderOrcamento.js - Renderização específica para detalhes por ORÇAMENTO
 * 
 * Este arquivo contém apenas a renderização de tabelas de detalhes por ORÇAMENTO
 * (Custeio, Investimento e suas subcategorias).
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderOrcamentoDetailsTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos filtrados por CATEGORIA DE ORÇAMENTO
 * @param {string} categoria - Nome da categoria (custeio, investimento, custoAquisicao, etc.)
 * @returns {string} - HTML da tabela
 */
function renderOrcamentoDetailsTable(categoria) {
    const projetos = analyticData.projetosPorCategoria[categoria] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
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
                <td${contratoAttrs}>${renderProjectCellWithCompras(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
    window.renderOrcamentoDetailsTable = renderOrcamentoDetailsTable;
}
