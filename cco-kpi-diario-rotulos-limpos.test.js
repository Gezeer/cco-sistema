const fs=require("node:fs");
const assert=require("node:assert/strict");

const kpi=fs.readFileSync("kpi.js","utf8");
const graficos=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const css=fs.readFileSync("css/kpi.css","utf8");
const html=fs.readFileSync("kpi.html","utf8");

const inicio=kpi.indexOf("if(equipeDiaria){const maiorDiario");
const fim=kpi.indexOf("const previstoTotal=",inicio);
const diario=kpi.slice(inicio,fim);

assert.match(diario,/rotulosFixos:false/,"31 dias não devem criar rótulos fixos sobrepostos");
assert.equal((diario.match(/nome:"Executado"/g)||[]).length,1,"serviço de equipe deve ter uma única série Executado");
assert.doesNotMatch(diario,/nome:"Previsto"|Previsto:|Diferença:|Execução:/);
assert.match(diario,/tooltipPorToque:true[\s\S]*destaquePorCategoria:true/);
assert.match(diario,/Executado: \$\{formatar\(executado\)\} equipes/);
assert.match(diario,/maximoVisualDiario=maiorDiario\+Math\.max\(\.75,maiorDiario\*\.15\)/,"eixo deve ter folga sem alterar os valores");
assert.match(diario,/grid:cfg=>cfg\.mobile\?\{top:68,bottom:72\}:\{top:76,bottom:72\}/,"legenda e eixo devem ter áreas próprias");
assert.match(diario,/legend:\{top:8,left:"center",data:\["Executado"\]\}/);
assert.match(diario,/interval:\(_indice\)=>_indice%\(window\.isMobileCCO\?\.\(\)\?4:2\)===0/,"eixo deve reduzir marcações sem remover dias");
assert.match(diario,/formatter:valor=>String\(valor\)\.slice\(0,5\)/,"datas do eixo devem ser abreviadas");
assert.match(graficos,/config\.rotulosFixos!==false&&!mobileCompacto/,"supressão deve ser opt-in");
assert.match(graficos,/instalarDestaquePorCategoria\(instancia,container,series\.length/);
assert.match(graficos,/for\(let serie=0;serie<quantidadeSeries;serie\+\+\)instancia\.dispatchAction/,"o destaque deve abranger as duas séries do dia");
assert.match(graficos,/instancia\.off\("mouseover"\);instancia\.off\("mouseout"\);instancia\.off\("click"\)/,"segunda renderização não pode duplicar eventos");
assert.match(graficos,/triggerOn:"click",alwaysShowContent:true/,"tooltip mobile deve permanecer até outro toque");
assert.match(css,/#graficoKpiServicoDiario\.kpi-diario-equipe-limpo[\s\S]*min-height: 400px !important/);
assert.match(html,/css\/kpi\.css\?v=20260805-kpi-velocidade-mobile-v1/);
assert.match(html,/js\/cco-graficos-3d\.js\?v=20260805-kpi-velocidade-mobile-v1/);
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-mensal-grid-v1/);

for(const valor of["P3","P7","P8","P9","P10","P11"])assert.match(fs.readFileSync("cco-metricas.js","utf8"),new RegExp(`${valor.replace(".","\\.")}\\s*:`));
assert.doesNotMatch(diario,/\.push\(|\.splice\(/,"nenhum dia pode ser removido do dataset");

console.log("KPI diário: série única de equipe, tooltip, legenda, eixo e mobile aprovados.");
