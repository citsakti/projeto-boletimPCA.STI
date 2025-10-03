/**
 * AnalyticsRenderSituacional.js - Renderização específica para detalhes SITUACIONAIS
 * 
 * Este arquivo contém apenas a renderização de tabelas de detalhes por SITUAÇÃO
 * (Contratação fora STI, Autuação atrasada, Elaboração interna, etc.).
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderSituacionalDetailsTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos filtrados por CATEGORIA SITUACIONAL
 * @param {string} categoria - Nome da categoria situacional
 * @returns {string} - HTML da tabela
 */
function renderSituacionalDetailsTable(categoria) {
    const projetos = analyticData.projetosPorSituacao[categoria] || [];
    
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
                    <th>Status</th>
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
        
        // Renderizar tag de dias de atraso para categoria autuacaoAtrasada
        let statusComDiasAtraso = formatStatusWithClasses(projeto.status);
        if (categoria === 'autuacaoAtrasada' && projeto.diasAtraso && typeof renderDiasAtrasoTag === 'function') {
            statusComDiasAtraso += renderDiasAtrasoTag(projeto.diasAtraso);
        }

        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${formatAreaWithClasses(projeto.area)}</td>
                <td${contratoAttrs}>${renderProjectCellWithCompras(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${statusComDiasAtraso}</td>
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
    window.renderSituacionalDetailsTable = renderSituacionalDetailsTable;
}
