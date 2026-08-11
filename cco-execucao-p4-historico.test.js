const assert=require("node:assert/strict"),fs=require("node:fs");
const execucao=fs.readFileSync("execucao.js","utf8"),fixes=fs.readFileSync("cco-fixes.js","utf8");

assert.match(execucao,/VERSAO_CACHE_EVOLUCAO_EXECUCAO="p4-operacoes-v2"/);
assert.match(execucao,/chaveCache=`\$\{VERSAO_CACHE_EVOLUCAO_EXECUCAO\}\|evolucao\|\$\{servico\}\|\$\{assinatura\}`/);
assert.match(execucao,/\.select\("id,importacao_id,servico,tipo_servico,data_operacao,peso_t"\)\.in\("importacao_id",\[\.\.\.idsAtivos\]\)\.eq\("servico","P4"\)/);
assert.match(execucao,/CCOMetricas\.calcularAcumuladoServico\("P4",registros\)/);
assert.match(execucao,/acumuladoOperacoes\?\?acumuladoPainel/);
assert.match(execucao,/\[P4 EXECUÇÃO HISTÓRICO\]/);
assert.match(execucao,/\[112451,136549,136573\]/);
assert.match(fixes,/PAGINA==="execucao"&&servico==="P4"/);
assert.match(fixes,/registros\.length\?metricas\.calcularAcumuladoServico\("P4",registros\):numeroSeguro\(item\.acumulado\)/);

const dezembro=[{id:112451,importacao_id:"0cffa241-b76a-47c2-baf1-82ee5626c2b2",servico:"P4",data_operacao:"2025-12-15",peso_t:12.60},{importacao_id:"0cffa241-b76a-47c2-baf1-82ee5626c2b2",servico:"P4",data_operacao:"2025-12-20",peso_t:12366.89}];
const fevereiro=[{id:136549,importacao_id:"7081b69d-d6a6-42aa-9f71-8ba285500008",servico:"P4",data_operacao:"2026-02-10",peso_t:3.87},{id:136573,importacao_id:"7081b69d-d6a6-42aa-9f71-8ba285500008",servico:"P4",data_operacao:"2026-02-11",peso_t:3.89},{importacao_id:"7081b69d-d6a6-42aa-9f71-8ba285500008",servico:"P4",data_operacao:"2026-02-20",peso_t:10308.78}];
const soma=registros=>registros.reduce((total,item)=>total+Number(item.peso_t||0),0);
assert.equal(soma(dezembro),12379.49);
assert.equal(soma(fevereiro),10316.54);
assert.deepEqual(fevereiro.filter(item=>[112451,136549,136573].includes(Number(item.id))).map(item=>item.id),[136549,136573]);
