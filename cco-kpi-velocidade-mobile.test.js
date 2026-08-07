const fs=require("node:fs");
const assert=require("node:assert/strict");

const css=fs.readFileSync("css/kpi.css","utf8");
const html=fs.readFileSync("kpi.html","utf8");
const kpi=fs.readFileSync("kpi.js","utf8");
const graficos=fs.readFileSync("js/cco-graficos-3d.js","utf8");

const desktop=css.slice(0,css.indexOf("@media (max-width: 767px)"));
assert.match(desktop,/grid-template-rows: 76px minmax\(320px, 1fr\)/,"desktop deve manter a composição existente");
assert.match(desktop,/\.kpi-speedometer-drawing[\s\S]*top: 50%[\s\S]*right: 24px[\s\S]*translateY\(-50%\)/,"gauge desktop deve permanecer à direita");

const mobile=css.slice(css.indexOf("/* KPI — Velocidade Média Mensal: composição móvel em três faixas. */"));
assert.match(mobile,/@media \(max-width: 767px\)/);
assert.match(mobile,/grid-template-rows: 58px minmax\(270px, 1fr\) 112px/,"mobile deve separar cabeçalho, percurso e gauge");
assert.match(mobile,/min-height: 500px !important/);
assert.match(mobile,/padding: 16px !important/);
assert.match(mobile,/\.cco-velocidade-percurso[\s\S]*position: relative !important[\s\S]*width: 100% !important[\s\S]*min-height: 270px !important/);
assert.match(mobile,/\.kpi-speedometer-drawing[\s\S]*position: relative !important[\s\S]*grid-row: 2[\s\S]*place-self: center[\s\S]*transform: none !important/);
assert.match(mobile,/#graficoKpiVelocidadeMediaMensal[\s\S]*width: 100% !important[\s\S]*overflow: hidden/,"320 px não deve gerar overflow horizontal");
assert.match(mobile,/\.section-title[\s\S]*grid-row: 1[\s\S]*min-height: 0/,"título deve possuir faixa exclusiva");
assert.match(mobile,/\.cco-rota-texto[\s\S]*font-size: 10px/);
assert.match(kpi,/tooltipPorToque:true,fecharTooltipAoTocarFora:true/,"tooltip móvel deve permanecer por toque e fechar fora");
assert.match(graficos,/confine:true,appendToBody:false/,"tooltip deve permanecer dentro do card");
assert.match(graficos,/instalarFechamentoTooltipMobile/);
assert.match(graficos,/document\.removeEventListener\("pointerdown",interacao\.fora,true\)/,"segunda renderização deve limpar o evento anterior");
assert.doesNotMatch(mobile,/velocidade_media|agruparPorMes|resumir\(/,"CSS móvel não pode alterar valores ou cálculos");
assert.match(html,/css\/kpi\.css\?v=20260806-kpi-producao-altura-v3/);
assert.match(html,/js\/cco-graficos-3d\.js\?v=20260805-kpi-velocidade-mobile-v1/);
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-altura-v3/);

console.log("KPI velocidade mobile: três faixas, percurso, gauge, tooltip, overflow e desktop aprovados.");
