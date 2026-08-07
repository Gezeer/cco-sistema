const fs=require("node:fs");
const assert=require("node:assert/strict");

const css=fs.readFileSync("css/kpi.css","utf8");
const html=fs.readFileSync("kpi.html","utf8");

for(const classe of["kpi-producao-mensal-card","kpi-producao-mensal-grafico","kpi-indicadores-operacionais-card","kpi-indicadores-operacionais-grafico"])assert.match(html,new RegExp(classe));
assert.match(html,/kpi-producao-mensal-card[\s\S]{0,180}Produção mensal do serviço/);
assert.doesNotMatch(html,/kpi-producao-mensal-card[\s\S]{0,180}Execução diária do serviço/);
assert.match(css,/\.kpi-producao-mensal-card[\s\S]*grid-template-rows: auto 330px[\s\S]*row-gap: 16px[\s\S]*height: 440px !important/);
assert.match(css,/\.kpi-producao-mensal-grafico[\s\S]*height: 330px !important[\s\S]*padding-bottom: 0/);
assert.match(css,/\.kpi-indicadores-operacionais-card[\s\S]*min-height: 520px !important/);
assert.match(css,/\.kpi-indicadores-operacionais-card[\s\S]*grid-template-rows: auto auto minmax\(330px, 1fr\)[\s\S]*row-gap: 14px/);
assert.match(css,/\.kpi-indicadores-operacionais-grafico[\s\S]*padding: 0 24px 0 0[\s\S]*overflow: hidden !important/);
assert.match(css,/#graficoKpiServicoIndicadores[\s\S]*top: -10px/);
assert.match(css,/@media \(max-width: 768px\)[\s\S]*\.kpi-producao-mensal-card,[\s\S]*min-height: 430px !important[\s\S]*padding: 16px !important[\s\S]*overflow-x: hidden !important/);
assert.doesNotMatch(css,/(^|\n)\s*(canvas|svg|\.kpi-card|\.chart-container)\s*\{/m,"não pode existir seletor global novo");
assert.match(html,/css\/kpi\.css\?v=20260806-kpi-producao-altura-v2/);

const kpi=fs.readFileSync("kpi.js","utf8");
assert.ok(kpi.includes('render("graficoKpiServicoMensal"'));
assert.ok(kpi.includes('render("graficoKpiServicoIndicadores"'));

console.log("Espaçamento KPI: produção, chips, rosca, tooltip e mobile aprovados.");
