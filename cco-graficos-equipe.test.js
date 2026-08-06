const fs=require("node:fs");
const assert=require("node:assert/strict");

global.window=global;
require("./cco-metricas.js");
const api=global.CCOMetricas;
const base={servico:"P9",importacao_id:"imp-julho",data_operacao:"2026-07-01"};

assert.deepEqual({...api.PREVISTO_EQUIPE_POR_SERVICO},{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});
assert.equal(api.obterPrevistoEquipeServico("P3"),12);
assert.equal(api.obterPrevistoEquipeServico("P7"),2);
assert.equal(api.obterPrevistoEquipeServico("P8"),2);
assert.equal(api.obterPrevistoEquipeServico("P9"),11);
assert.equal(api.obterPrevistoEquipeServico("P10"),3);
assert.equal(api.obterPrevistoEquipeServico("P11"),1);
assert.equal(api.ehServicoEquipe("P1"),false);
assert.equal(api.ehServicoEquipe("P12"),false);

const mensal18=api.calcularEquipeMensalServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,qtd_equipe:1},{...base,qtd_equipe:5},{...base,qtd_equipe:12}]});
assert.deepEqual({...mensal18},{previsto:11,executado:11,percentual:100,unidade:"Equipe"});
assert.equal(api.calcularEquipeMensalServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,qtd_equipe:2},{...base,qtd_equipe:5}]}).executado,7);
assert.equal(api.calcularEquipeMensalServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[{...base,valor_total:4212054.08,valor_unitario:3888049.92,peso_t:999,km_total:999,viagens:999}]}).executado,null);

const diario=api.calcularEquipeDiariaServico({servico:"P9",ano:2026,mes:7,importacaoId:"imp-julho",registros:[
  {...base,qtd_equipe:1},{...base,qtd_equipe:5},{...base,qtd_equipe:8},{...base,qtd_equipe:11},
  {...base,data_operacao:"2026-07-02",qtd_equipe:1},{...base,data_operacao:"2026-07-02",qtd_equipe:3},{...base,data_operacao:"2026-07-02",qtd_equipe:8},
  {...base,data_operacao:"2026-07-03",qtd_equipe:4.533333,equipe:0.466666,executado:0.533333},
  {...base,data_operacao:"2026-06-30",qtd_equipe:11},
  {...base,importacao_id:"outra",qtd_equipe:11}
]});
assert.deepEqual(diario,[
  {data:"2026-07-01",previsto:11,executado:11},
  {data:"2026-07-02",previsto:11,executado:8},
  {data:"2026-07-03",previsto:11,executado:null}
]);
assert.equal(api.obterValorEquipeValido({qtd_equipe:4.533333,equipe:0.466666,executado:0.533333}),null);

const execucao=fs.readFileSync("execucao.js","utf8"),kpi=fs.readFileSync("kpi.js","utf8");
assert.match(execucao,/calcularEquipeMensalServico/);
assert.match(execucao,/select\("importacao_id,servico,tipo_servico,data_operacao,qtd_equipe,equipe,executado"\)/);
assert.match(kpi,/criarSerieEquipeContratualDiariaKPI/);
assert.match(kpi,/nome:"Previsto"[\s\S]*nome:"Executado"/);
assert.doesNotMatch(execucao.match(/if\(window\.CCOMetricas\?\.ehServicoEquipe[\s\S]*?\n    }/)?.[0]||"",/valor_unitario|valor_total|peso_t|km_total|viagens|R\$/);

console.log("Gráficos de equipe: matriz contratual, consolidação mensal/diária, filtros e isolamento aprovados.");
