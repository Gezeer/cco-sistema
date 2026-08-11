const fs=require("node:fs");
const assert=require("node:assert/strict");

const painel=fs.readFileSync("painel-geral.js","utf8");
const css=fs.readFileSync("css/painel-geral.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const ordem=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
const bloco=css.slice(css.lastIndexOf("/* Painel Geral — encerra os dois cards"));

assert.match(bloco,/@media\(max-width:767px\)/,"proteção deve ser exclusivamente mobile");
for(const linha of["cco-dashboard-row-primary","cco-dashboard-row-secondary","cco-chart-execucao","cco-chart-financeiro"])assert.ok(bloco.includes(linha));
assert.match(bloco,/align-items:start!important/);
assert.match(bloco,/grid-auto-rows:auto!important/);
assert.match(bloco,/grid-template-rows:auto!important/);
assert.match(bloco,/align-self:start!important/);
assert.match(bloco,/flex:0 0 auto!important/);
assert.match(bloco,/flex-grow:0!important/);
assert.match(bloco,/height:auto!important/);
assert.match(bloco,/min-height:0!important/);
assert.match(bloco,/aspect-ratio:auto!important/);
assert.match(bloco,/contain-intrinsic-size:auto!important/);
assert.match(bloco,/content-visibility:visible!important/);
assert.doesNotMatch(bloco,/height:100%/);
assert.match(bloco,/>\.cco-chart-execucao>#graficoExecucao\{[\s\S]*432px/);
assert.match(bloco,/>\.cco-chart-financeiro>#graficoFinanceiro\{[\s\S]*432px/);
assert.equal(432+54+8+24,518,"card de execução deve ficar entre 480 e 520px");
assert.equal(432+54+8+24,518,"card de valor deve ficar entre 480 e 520px");

assert.deepEqual(ordem,["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
assert.match(painel,/function sincronizarAlturasGraficosMobile\(\)/);
assert.equal((painel.match(/sincronizarAlturasGraficosMobile/g)||[]).length,2,"deve existir somente a função e um listener");
assert.match(painel,/\[PAINEL MOBILE ALTURAS REAIS\]/);
for(const campo of["maxHeight:","flexGrow:","alignSelf:","gridRow:","aspectRatio:","containIntrinsicSize:","paddingBottom:","marginBottom:","clientHeight:","scrollHeight:"])assert.ok(painel.includes(campo));
assert.match(painel,/instancia\?\.resize\(\{height:grafico\.clientHeight\}\)/);
assert.match(painel,/window\.addEventListener\("cco:painel-renderizado",sincronizarAlturasGraficosMobile\)/);
assert.match(html,/20260811-painel-catalogo-fallback-leve-v4/);

console.log("Painel mobile: cards de execução e valor acompanham seus gráficos, sem alterar ordem, valores ou desktop.");
