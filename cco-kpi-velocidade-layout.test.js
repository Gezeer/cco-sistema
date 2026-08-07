const fs=require("node:fs");
const assert=require("node:assert/strict");

const css=fs.readFileSync("css/kpi.css","utf8");
const html=fs.readFileSync("kpi.html","utf8");

assert.match(html,/section class="section chart-card kpi-speed-card"/);
assert.match(html,/css\/kpi\.css\?v=20260806-kpi-producao-altura-v3/);
assert.match(css,/grid-template-rows: 76px minmax\(320px, 1fr\)/,"cabeçalho deve possuir área exclusiva");
assert.match(css,/min-height: 444px/,"card desktop deve superar o mínimo de 420px");
assert.match(css,/padding: 24px !important/);
assert.match(css,/#graficoKpiVelocidadeMediaMensal[\s\S]*height: 100% !important/);
assert.match(css,/\.kpi-speedometer-drawing[\s\S]*top: 50%[\s\S]*right: 24px[\s\S]*translateY\(-50%\)/);
assert.match(css,/@media \(max-width: 768px\)[\s\S]*min-height: 340px !important/);
assert.match(css,/@media \(max-width: 768px\)[\s\S]*padding: 16px !important/);

const kpiJs=fs.readFileSync("kpi.js","utf8");
assert.doesNotMatch(css,/velocidade_media|calcular|tooltip|animation/);
assert.ok(kpiJs.includes("function renderVelocidade"),"renderização existente deve permanecer disponível");

console.log("Layout Velocidade Média: cabeçalho, área útil, gauge e responsividade aprovados.");
