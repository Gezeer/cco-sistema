const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonteComparativo=fs.readFileSync("js/cco-execucao-comparativo.js","utf8");
const fonteExecucao=fs.readFileSync("execucao.js","utf8");
const fonteHtml=fs.readFileSync("execucao.html","utf8");
const contexto={window:{}};
vm.createContext(contexto);
vm.runInContext(fonteComparativo,contexto);
const api=contexto.window.CCOExecucaoComparativoMensal;

const catalogo=api.PERIODOS.map((item,indice)=>({ano:item.ano,mes:item.mes,importacao_id:`imp-${indice+1}`}));
const linhasP1=catalogo.map((item,indice)=>({ano:item.ano,mes:item.mes,importacao_id:item.importacao_id,servico:"P1",previsto:100+indice,acumulado:50+indice}));
linhasP1.splice(3,1);
const p1=api.montar({catalogo,linhas:linhasP1});

assert.deepEqual([...p1.labels],["Nov/2025","Dez/2025","Jan/2026","Fev/2026","Mar/2026","Abr/2026","Mai/2026","Jun/2026","Jul/2026"]);
assert.equal(p1.labels.length,9,"o comparativo deve manter exatamente nove meses");
assert.equal(p1.previstos.length,9);
assert.equal(p1.acumulados.length,9);
assert.equal(new Set(p1.importacoes).size,9,"cada período deve preservar seu próprio importacao_id");
assert.equal(p1.previstos[3],null,"mês sem linha oficial não pode receber zero artificial");
assert.equal(p1.acumulados[3],null,"mês sem operações consolidadas não pode receber zero artificial");
assert.equal(p1.previstos[0],linhasP1[0].previsto,"previsto deve ser idêntico ao campo oficial do card");
assert.equal(p1.acumulados[0],linhasP1[0].acumulado,"acumulado deve ser idêntico ao campo oficial do card");

const linhasP9=catalogo.map((item,indice)=>({ano:item.ano,mes:item.mes,importacao_id:item.importacao_id,servico:"P9",previsto:300+indice,acumulado:200+indice}));
const p9=api.montar({catalogo,linhas:linhasP9});
assert.notDeepEqual([...p9.previstos],[...p1.previstos],"trocar serviço deve atualizar a série Previsto");
assert.notDeepEqual([...p9.acumulados],[...p1.acumulados],"trocar serviço deve atualizar a série Acumulado");

const render=fonteExecucao.match(/async function renderizarEvolucaoHistoricaCCO[\s\S]*?(?=\n  window\.renderizarEvolucaoHistoricaCCO)/)?.[0]||"";
assert.match(render,/series:\[\{nome:"Previsto"[\s\S]*\{nome:"Acumulado"/,"o gráfico deve possuir as duas séries");
assert.match(render,/token!==requisicaoEvolucaoExecucao/,"resposta antiga não pode sobrescrever o serviço atual");
assert.match(render,/obterServicoAtivo/,"a resposta também deve confirmar o serviço ainda selecionado");
assert.match(render,/destruirGrafico\?\.\(container\)/,"a segunda renderização deve destruir a instância anterior do mesmo container");
assert.doesNotMatch(render,/IDS_GRAFICOS_EXECUCAO\.forEach/,"a atualização não pode destruir gráficos de outras seções");
assert.match(fonteExecucao,/select\("importacao_id,ano,mes,servico,acumulado,previsto,valor_total"\)/);
assert.match(fonteExecucao,/labels\.length!==9\|\|previstos\.length!==9\|\|acumulados\.length!==9/);
assert.match(render,/tipo:"barra",preservarNulos:true/,"ausência de dados deve permanecer null até a renderização");
assert.match(fs.readFileSync("js/cco-graficos-3d.js","utf8"),/config\.preservarNulos/);
assert.match(fonteHtml,/cco-execucao-comparativo\.js\?v=20260805-previsto-acumulado-v1/);
assert.match(fonteHtml,/execucao\.js\?v=20260805-previsto-acumulado-v1/);

console.log("Execução comparativa: nove meses, duas séries, isolamento por importação, null e corrida assíncrona aprovados.");
