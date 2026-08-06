const fs=require("node:fs");
const assert=require("node:assert/strict");

const grafico=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const execucao=fs.readFileSync("execucao.js","utf8");
const css=fs.readFileSync("css/execucao.css","utf8");
const html=fs.readFileSync("execucao.html","utf8");

assert.match(execucao,/modoMobileCompacto:true/);
assert.match(execucao,/categoriasMobile:labelsMobile/);
assert.match(execucao,/preservarNulos:true/);
assert.match(grafico,/mobileCompacto=cfg\.mobile&&tipo==="barra3d"&&config\.modoMobileCompacto===true/);
assert.match(grafico,/exibirRotulos:!mobileCompacto/,"mobile compacto não deve renderizar números fixos");
assert.match(grafico,/simplificado:mobileCompacto/,"efeito 3D móvel deve dispensar reflexo e sombra extras");
assert.match(grafico,/triggerOn:"none",alwaysShowContent:true,enterable:true/,"tooltip móvel deve abrir somente pela interação controlada");
assert.match(grafico,/type:"showTip"/);
assert.match(grafico,/type:"hideTip"/);
assert.match(grafico,/type:"highlight"[\s\S]*dataIndex:parametro\.dataIndex/,"toque deve realçar as duas séries do mês");
assert.match(grafico,/type:"downplay",seriesIndex:"all"/,"meses não selecionados devem perder destaque");
assert.match(grafico,/document\.removeEventListener\("pointerdown",interacao\.fora,true\)/,"nova renderização deve limpar a interação anterior");
assert.match(grafico,/if\(config\.preservarNulos&&api\.value\(1\)==null\)/,"null não deve criar barra");
assert.match(grafico,/interval:0,hideOverlap:false,fontSize:9/,"os nove rótulos abreviados devem permanecer visíveis");
assert.match(grafico,/top:6,left:"center",orient:"horizontal"/,"legenda deve ficar centralizada acima do gráfico");
assert.match(grafico,/prefers-reduced-motion: reduce/);
assert.match(execucao,/Previsto:[\s\S]*Acumulado:[\s\S]*Percentual:/);
assert.match(grafico,/Diferença:/);
assert.match(css,/@media \(max-width: 767px\)[\s\S]*#graficoExecDetalheEvolucao[\s\S]*max-width: 100%[\s\S]*min-height: 420px[\s\S]*max-height: 500px/);
assert.match(html,/css\/execucao\.css\?v=20260805-grafico-mobile-compacto-v1/);
assert.match(html,/js\/cco-graficos-3d\.js\?v=20260805-grafico-mobile-compacto-v1/);
assert.match(html,/execucao\.js\?v=20260805-cards-periodo-v1/);

console.log("Gráfico móvel compacto: rótulos, tooltip por toque, seleção, null, responsividade e cache aprovados.");
