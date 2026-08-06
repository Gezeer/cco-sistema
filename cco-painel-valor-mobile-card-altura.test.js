const fs=require("node:fs");
const assert=require("node:assert/strict");

const painel=fs.readFileSync("painel-geral.js","utf8");
const css=fs.readFileSync("css/painel-geral.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const ordem=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

const blocoMobile=css.slice(css.lastIndexOf("/* Painel Geral — encerra o card financeiro"));
assert.match(blocoMobile,/@media\(max-width:767px\)/);
assert.match(blocoMobile,/\.cco-dashboard-row-secondary\{[\s\S]*align-items:start!important;[\s\S]*grid-auto-rows:auto!important/);
assert.match(blocoMobile,/>\.cco-chart-financeiro\{[\s\S]*align-self:start!important;[\s\S]*height:auto!important;[\s\S]*min-height:0!important/);
assert.match(blocoMobile,/contain-intrinsic-size:auto!important/);
assert.match(blocoMobile,/aspect-ratio:auto!important/);
assert.match(blocoMobile,/>\.cco-chart-financeiro>#graficoFinanceiro\{[\s\S]*flex:0 0 var\(--cco-chart-mobile-height,469px\)!important;[\s\S]*height:var\(--cco-chart-mobile-height,469px\)!important/);
assert.match(blocoMobile,/>\.cco-chart-financeiro>\.section-title\{[\s\S]*min-height:54px!important;[\s\S]*margin:0 0 8px!important/);
assert.doesNotMatch(blocoMobile,/#graficoExecucao|cco-chart-execucao/);

assert.equal(469+54+8+24,555,"card deve permanecer na faixa aproximada de 530–560px");
assert.equal(ordem[0],"P1");
assert.equal(ordem.at(-1),"P12");
assert.match(painel,/function sincronizarAlturaFinanceiroMobile\(\)/);
assert.match(painel,/instancia\?\.resize\(\{height:grafico\.clientHeight\}\)/);
assert.match(painel,/\[PAINEL VALOR MOBILE ALTURAS\]/);
for(const campo of["card:","wrapper:","grafico:","scrollHeight:","clientHeight:"])assert.ok(painel.includes(campo));
assert.match(painel,/window\.addEventListener\("cco:painel-renderizado",sincronizarAlturaFinanceiroMobile\)/);
assert.equal((painel.match(/sincronizarAlturaFinanceiroMobile/g)||[]).length,2,"deve existir somente a definição e um listener de sincronização");
assert.match(html,/20260806-painel-valor-mobile-card-altura-v3/);

console.log("Painel financeiro mobile: card acompanha 469px do gráfico, sem min-height externo e sem alterar execução/ordem.");
