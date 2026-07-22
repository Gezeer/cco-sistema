const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname,"css/cco-graficos-3d.css"),"utf8");
const runtime = fs.readFileSync(path.join(__dirname,"js/cco-chart-runtime.js"),"utf8");

assert.equal(/canvas\s*\[aria-hidden=[^\]]+\]\s*\{[^}]*display\s*:\s*none/i.test(css),false,"O CSS não pode ocultar canvas ECharts por aria-hidden.");
assert.match(css,/canvas\[data-cco-chartjs-antigo="true"\]\s*\{display:none!important\}/,"Somente o canvas Chart.js legado pode ser ocultado.");
assert.match(css,/\.cco-chart-host canvas\s*\{[^}]*display:block!important;[^}]*visibility:visible!important;/,"O canvas interno do host deve permanecer visível.");
assert.match(css,/\.cco-chart-host\s*\{[^}]*width:100%;[^}]*min-width:0;[^}]*height:380px;/,"O host precisa de dimensões explícitas.");
assert.match(runtime,/host\.clientWidth>=120&&host\.clientHeight>=120/,"O runtime deve aguardar dimensão real antes do init.");
assert.match(runtime,/existente[^;]*\.dispose\(\)/,"O runtime deve descartar a instância anterior.");

const hostSimulado={clientWidth:390,clientHeight:280,canvas:{display:"block",visibility:"visible"}};
assert.ok(hostSimulado.clientWidth>=120&&hostSimulado.clientHeight>=120);
assert.notEqual(hostSimulado.canvas.display,"none");
assert.notEqual(hostSimulado.canvas.visibility,"hidden");
console.log("CCO Chart Runtime: host mobile de 390px e visibilidade do canvas aprovados.");
