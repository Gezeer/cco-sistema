const fs=require("node:fs");
const assert=require("node:assert/strict");

const painel=fs.readFileSync("painel-geral.js","utf8");
const graficos=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const css=fs.readFileSync("css/painel-geral.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const ordem=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

const ordemFonte=painel.match(/const ORDEM_SERVICOS_CCO=Object\.freeze\((\[[^;]+\])\)/);
assert.ok(ordemFonte,"matriz oficial deve existir");
assert.deepEqual(JSON.parse(ordemFonte[1]),ordem);
assert.equal(ordem.length,13);
assert.equal(ordem.indexOf("P10"),ordem.indexOf("P9")+1);

const inicio=painel.indexOf("function renderizarGraficoFinanceiroResponsivo");
const fim=painel.indexOf("function preencherKpi",inicio);
const responsivo=painel.slice(inicio,fim);
assert.match(responsivo,/CCOEhMobile\?\.\(\)===true\|\|window\.matchMedia\?\.\("\(max-width: 767px\)"\)\?\.matches===true/);
assert.match(responsivo,/if\(!mobile\)\{if\(!compacto\)return renderizarGraficoFinanceiro\(linhas\)/,"desktop deve manter o renderizador existente");
assert.match(responsivo,/sort\(\(a,b\)=>b\.valor-a\.valor\)\.slice\(0,8\)/,"comportamento legado não-mobile deve permanecer intacto");
assert.match(painel,/ORDEM_SERVICOS_CCO\.map\(servico=>/,"mobile deve criar todas as categorias, inclusive ausentes");
assert.match(responsivo,/altura=432/);
assert.match(responsivo,/dados\.length!==13/);
assert.match(responsivo,/categorias:dados\.map\(item=>item\.servico\)/);
assert.match(responsivo,/valores:dados\.map\(item=>item\.valor\)/,"valores financeiros não podem ser recalculados no renderizador");
assert.match(painel,/valor=item\?window\.calcularValorTotalCCO\(item\):0/,"fonte financeira oficial deve ser preservada");
assert.match(responsivo,/barWidth:17,barCategoryGap:"42%"/);
assert.match(responsivo,/grid=\{top:48,bottom:44,left:64,right:14,containLabel:true\}/);
assert.match(responsivo,/yAxis:\{inverse:true,axisLabel:/,"P1 deve ocupar visualmente o topo do eixo horizontal");
assert.equal((responsivo.match(/inverse:true/g)||[]).length,1,"não pode ocorrer dupla inversão");
assert.doesNotMatch(responsivo,/categorias:[^\n]*\.reverse\(|dados\.reverse\(/);
assert.match(responsivo,/splitNumber:4[\s\S]*formatter:formatarEixoFinanceiroMobile/);
assert.match(responsivo,/rotulosFixos:false/);
assert.match(responsivo,/tooltipPorToque:true,fecharTooltipAoTocarFora:true/);
for(const campo of["Valor contratado:","Acumulado:","Previsto:","Execução:"])assert.ok(responsivo.includes(campo),`tooltip deve conter ${campo}`);
assert.match(responsivo,/confine:true,appendToBody:false/);
assert.match(responsivo,/padding:\[7,9\],extraCssText:"max-width:220px;white-space:normal;line-height:1\.3;",textStyle:\{fontSize:11\}/);

assert.match(css,/@media\(max-width:767px\)[\s\S]*#graficoFinanceiro[\s\S]*height:var\(--cco-chart-mobile-height,432px\)!important[\s\S]*min-height:0!important[\s\S]*max-height:none!important[\s\S]*overflow:hidden!important/);
assert.match(graficos,/barWidth:item\.barWidth\?\?config\.barWidth/);
assert.match(graficos,/barCategoryGap:item\.barCategoryGap\?\?config\.barCategoryGap/);
assert.match(graficos,/config\.rotulosFixos!==false&&categorias\.length<=6/);
assert.match(graficos,/destruirGrafico\(container\)/,"segunda renderização deve destruir a instância anterior");
assert.match(graficos,/document\.removeEventListener\("pointerdown",interacao\.fora,true\)/,"eventos móveis anteriores devem ser removidos");

assert.match(html,/css\/painel-geral\.css\?v=20260811-painel-catalogo-fallback-leve-v4/);
assert.match(html,/js\/cco-graficos-3d\.js\?v=20260811-painel-catalogo-fallback-leve-v4/);
assert.match(html,/painel-geral\.js", "20260811-painel-catalogo-fallback-leve-v4"/);

console.log("Painel financeiro mobile: 13 serviços, ordem, altura, barras, eixo, tooltip, overflow e desktop aprovados.");
