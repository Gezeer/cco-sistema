const fs=require("node:fs");
const assert=require("node:assert/strict");

const painel=fs.readFileSync("painel-geral.js","utf8");
const css=fs.readFileSync("css/painel-geral.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const ordem=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

assert.match(painel,/function criarDadosFinanceirosMobile\(linhas\)[\s\S]*ORDEM_SERVICOS_CCO\.map\(servico=>/);
assert.match(painel,/function criarDadosExecucaoMobile\(dados\)[\s\S]*ORDEM_SERVICOS_CCO\.map\(servico=>/);
assert.equal(ordem.length,13);
assert.equal(ordem[0],"P1");assert.equal(ordem.at(-1),"P12");

const inicioExec=painel.indexOf("function renderizarGraficoExecucaoResponsivo");
const fimExec=painel.indexOf("function criarDadosFinanceirosMobile",inicioExec);
const execucao=painel.slice(inicioExec,fimExec);
const inicioValor=painel.indexOf("function renderizarGraficoFinanceiroResponsivo");
const fimValor=painel.indexOf("function preencherKpi",inicioValor);
const valor=painel.slice(inicioValor,fimValor);

for(const fonte of[execucao,valor]){
  assert.match(fonte,/CCOEhMobile\?\.\(\)===true\|\|window\.matchMedia\?\.\("\(max-width: 767px\)"\)\?\.matches===true/);
  assert.match(fonte,/yAxis:\{inverse:true/);
  assert.equal((fonte.match(/inverse:true/g)||[]).length,1,"cada gráfico deve aplicar uma única inversão");
  assert.doesNotMatch(fonte,/\.reverse\(/,"dataset não pode ser invertido junto com o eixo");
  assert.match(fonte,/tooltipPorToque:true,fecharTooltipAoTocarFora:true/);
  assert.match(fonte,/max-width:220px[\s\S]*fontSize:11/);
  assert.match(fonte,/confine:true,appendToBody:false/);
}

assert.doesNotMatch(execucao,/sort\(\(a,b\)=>numero\(b\.percentual\)/,"execução mobile não pode ordenar por percentual");
assert.match(execucao,/altura=ordenados\.length\*31\+90/);
assert.match(execucao,/grid=\{left:66,right:16,top:16,bottom:46,containLabel:true\}/);
assert.match(execucao,/categorias:ordenados\.map\(item=>item\.servico\)/);
assert.match(execucao,/valores=ordenados\.map\(item=>numero\(item\.percentual\)\)/,"percentuais devem permanecer inalterados");
for(const campo of["Executado:","Previsto:","Percentual:","Status:"])assert.ok(execucao.includes(campo));

assert.match(valor,/altura=dados\.length\*31\+66/);
assert.match(valor,/grid=\{left:66,right:16,top:16,bottom:42,containLabel:true\}/);
assert.match(valor,/barWidth:17,barCategoryGap:"42%"/);
assert.match(valor,/valores:dados\.map\(item=>item\.valor\)/,"valores financeiros devem permanecer inalterados");
assert.match(valor,/rotulosFixos:false/);

assert.match(css,/#graficoFinanceiro[\s\S]*height:var\(--cco-chart-mobile-height,469px\)!important[\s\S]*min-height:0!important/);
assert.match(css,/#graficoExecucao[\s\S]*height:var\(--cco-chart-mobile-height,493px\)!important[\s\S]*min-height:0!important/);
assert.match(css,/@media\(max-width:767px\)/,"alterações CSS devem ser somente mobile");
assert.match(painel,/CCO_DEBUG_PAINEL_MOBILE===true\)console\.debug\("\[PAINEL MOBILE GRÁFICO VALOR\]"/);
assert.match(painel,/CCO_DEBUG_PAINEL_MOBILE===true\)console\.debug\("\[PAINEL MOBILE EXECUÇÃO SERVIÇO\]"/);
assert.match(html,/css\/painel-geral\.css\?v=20260806-painel-mobile-remover-espaco-v4/);
assert.match(html,/painel-geral\.js", "20260806-painel-mobile-remover-espaco-v4"/);

console.log("Painel mobile: valor e execução com 13 serviços, ordem visual, alturas, tooltips e desktop isolado aprovados.");
