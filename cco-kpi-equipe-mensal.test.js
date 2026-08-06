const fs=require("node:fs");
const assert=require("node:assert/strict");

global.window=global;
require("./cco-metricas.js");
const metricas=global.CCOMetricas;
const kpi=fs.readFileSync("kpi.js","utf8");
const html=fs.readFileSync("kpi.html","utf8");
const base={servico:"P9",importacao_id:"imp-julho",data_operacao:"2026-07-01"};

const atingido=metricas.calcularEquipeMensalServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,qtd_equipe:5},{...base,qtd_equipe:6},{...base,qtd_equipe:7}]});
assert.deepEqual({...atingido},{previsto:11,executado:11,percentual:100,unidade:"Equipe"});
const parcial=metricas.calcularEquipeMensalServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,qtd_equipe:3},{...base,qtd_equipe:5}]});
assert.equal(parcial.previsto,11);
assert.equal(parcial.executado,8);
assert.equal(metricas.calcularEquipeMensalServico({servico:"P11",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,servico:"P11",qtd_equipe:1}]}).executado,1);

const funcao=kpi.match(/function dadosComparativoMensal\([\s\S]*?\n  \}/)?.[0]||"";
assert.match(funcao,/calcularEquipeMensalServico\(\{servico,registros,ano,mes,importacaoId\}\)/,"KPI e Execução devem compartilhar a função mensal oficial");
assert.match(funcao,/const executado=equipe\?equipe\.executado/);
assert.match(funcao,/const previsto=equipe\?equipe\.previsto/);
assert.doesNotMatch(funcao,/valorExecutado\(|valor_total|valor_unitario|peso_t|km_total|viagens/);
assert.match(kpi,/Previsto: \$\{formatar\(previsto\)\} equipes/);
assert.match(kpi,/Executado: \$\{formatar\(executado\)\} equipes/);
assert.match(kpi,/Diferença: \$\{formatar\(diferenca\)\}/);
assert.match(kpi,/Percentual: \$\{percentual===null/);
assert.match(html,/kpi\.js\?v=20260805-kpi-equipe-mensal-v1/);

console.log("KPI mensal de equipes: fonte compartilhada, limite contratual e tooltip aprovados.");
