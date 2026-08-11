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

const catalogo=[...Array(10)].map((_,indice)=>{const deslocamento=10+indice,ano=2025+Math.floor(deslocamento/12),mes=deslocamento%12+1;return{ano,mes,importacao_id:`imp-${indice+1}`};});
const linhasP1=catalogo.map((item,indice)=>({ano:item.ano,mes:item.mes,importacao_id:item.importacao_id,servico:"P1",previsto:100+indice,acumulado:50+indice}));
linhasP1.splice(3,1);
const p1=api.montar({catalogo,linhas:linhasP1});

assert.deepEqual([...p1.labels],["Nov/2025","Dez/2025","Jan/2026","Fev/2026","Mar/2026","Abr/2026","Mai/2026","Jun/2026","Jul/2026","Ago/2026"]);
assert.equal(p1.labels.length,10,"o comparativo deve acompanhar todos os meses do catálogo desde novembro/2025");
assert.equal(p1.previstos.length,10);
assert.equal(p1.acumulados.length,10);
assert.equal(new Set(p1.importacoes).size,10,"cada período deve preservar seu próprio importacao_id");
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
assert.match(fonteExecucao,/labels\.length!==catalogo\.length/);
const graficos3d=fs.readFileSync("js/cco-graficos-3d.js","utf8");
assert.match(render,/tipo:"barra3d",agrupado:true,preservarNulos:true/,"o comparativo deve usar barras 3D agrupadas preservando null");
assert.match(render,/nome:"Previsto"[\s\S]*nome:"Acumulado"/,"cada mês deve possuir Previsto e Acumulado");
assert.match(render,/categoriasMobile:labelsMobile/,"o mobile deve receber rótulos mensais abreviados");
assert.match(render,/\[EXECUÇÃO COMPARATIVO 3D\]/);
assert.match(graficos3d,/if\(config\.preservarNulos&&api\.value\(1\)==null\)return\{type:"group",children:\[\]\}/,"null não pode criar barra falsa");
assert.match(graficos3d,/centro=api\.coord\(\[api\.value\(0\),valor\]\)/,"a altura visual deve usar diretamente o valor real");
assert.match(graficos3d,/type:"polygon"[\s\S]*type:"rect"[\s\S]*type:"ellipse"/,"a barra 3D deve combinar lateral, elipses e corpo");
assert.match(graficos3d,/mobileCompacto\?30:cfg\.pequeno\?18:cfg\.mobile\?24:36/,"largura das barras deve responder ao viewport");
assert.match(graficos3d,/prefers-reduced-motion: reduce/);
assert.match(graficos3d,/movimentoReduzido\?0:cfg\.animacao/);
assert.match(fonteHtml,/cco-execucao-comparativo\.js\?v=20260805-previsto-acumulado-v1/);
assert.match(fonteHtml,/cco-graficos-3d\.js\?v=20260806-execucao-rotulos-legenda-espacamento-v1/);
assert.match(fonteHtml,/execucao\.js\?v=20260807-performance-boot-v2/);

console.log("Execução comparativa: catálogo dinâmico, duas séries, isolamento por importação, null e corrida assíncrona aprovados.");
