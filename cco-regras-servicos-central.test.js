const assert = require("assert");

global.window = global;
require("./js/cco-regras-negocio.js");
require("./js/cco-regras-servicos.js");

const importar = "imp-jul-2026";
const op = (servico, data, campos = {}) => ({ importacao_id: importar, servico, data_operacao: data, ...campos });
const raw = (servico, data, dados_originais) => ({ importacao_id: importar, servico, data_operacao: data, dados_originais });
const calcular = (servico, operacoes, linhasRaw = [], extra = {}) => calcularIndicadoresServicoCCO({
  servico, ano: 2026, mes: 7, importacaoId: importar, operacoes, raw: linhasRaw, ...extra
});

const p1 = calcular("P1", [
  op("P1", "2026-07-01", { peso_t: 40, viagens: 4, km_total: 999 }),
  op("P1", "2026-07-02", { peso_t: 60, viagens: 6, km_total: 999 }),
  op("P1", "2026-08-01", { peso_t: 900, viagens: 90, km_total: 900 }),
  { ...op("P1", "2026-07-03", { peso_t: 900 }), importacao_id: "outra" }
], [
  raw("P1", "2026-07-01", { Km_Total: 100, "KM Total": 5000 }),
  raw("P1", "2026-07-02", { Km_Total: 150, "KM Total": 5000 })
]);
assert.deepStrictEqual({ acumulado:p1.acumulado, peso:p1.peso, km:p1.km, viagens:p1.viagens, produtividade:p1.produtividade, distanciaMedia:p1.distanciaMedia }, { acumulado:100, peso:100, km:250, viagens:10, produtividade:10, distanciaMedia:25 });

for (const servico of ["P2.1", "P2.2"]) assert.strictEqual(calcular(servico, [op(servico,"2026-07-01",{viagens:4}),op(servico,"2026-07-02",{viagens:6})]).acumulado, 10);

for (const servico of ["P3","P7","P8","P9","P10","P11"]) {
  const resultado = calcular(servico, [
    op(servico,"2026-07-01",{qtd_equipe:2,equipe:8,executado:9}),
    op(servico,"2026-07-01",{qtd_equipe:3,equipe:8,executado:9}),
    op(servico,"2026-07-02",{qtd_equipe:4,equipe:8,executado:9})
  ]);
  assert.strictEqual(resultado.acumulado, 7, `${servico} deve somar o maior qtd_equipe de cada dia`);
}

assert.strictEqual(calcular("P9", [op("Catação Em Área Verde","2026-07-01",{qtd_equipe:0,equipe:0,executado:11})]).acumulado, 11);
assert.strictEqual(calcular("P4", [op("P4","2026-07-01",{peso_t:40}),op("P4","2026-07-02",{peso_t:60})]).acumulado, 100);

const p5 = calcular("P5", [op("P5","2026-07-01",{km_total:999})], [raw("P5","2026-07-01",{"Km Executado":100,"Km Executado (%)":9999})]);
assert.strictEqual(p5.acumulado, 100);
const p6 = calcular("P6", [op("P6","2026-07-01",{km_total:999})], [raw("P6","2026-07-01",{"Total Pagamento - KM":100,"Total Pagamento - KM (%)":9999})]);
assert.strictEqual(p6.acumulado, 100);

const p12 = calcular("P12", [op("P12","2026-07-01",{executado:40}),op("P12","2026-07-02",{executado:60})], [], {valorUnitario:0.83});
assert.strictEqual(p12.acumulado, 100);
assert.strictEqual(p12.valorTotal, 83);

const semTeto = calcular("P12", [op("P12","2026-07-01",{executado:150})], [], {previsto:100,valorUnitario:0.83});
assert.strictEqual(semTeto.percentual, 150);
assert.deepStrictEqual(calcular("P1", [op("P1","2026-07-01",{peso_t:100,viagens:10,km_total:250})]), calcular("P1", [op("P1","2026-07-01",{peso_t:100,viagens:10,km_total:250})]));

const fs = require("fs");
for (const arquivo of ["painel-geral.js","utils.js","analytics-calculations.js","cco-metricas.js"]) assert.match(fs.readFileSync(arquivo,"utf8"), /calcularIndicadoresServicoCCO/, `${arquivo} deve consumir a fonte central`);
assert.match(fs.readFileSync("cco-fixes.js","utf8"), /metricas\.consolidarServico/, "KPI deve consumir a fachada central CCOMetricas");
console.log("OK: matriz central P1-P12, P9, literais P1/P5/P6, P12, percentual sem teto e consumidores validados.");
