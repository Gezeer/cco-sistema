const assert=require("node:assert/strict"),fs=require("node:fs");
const {formatarDataBR}=require("./interrupcao-trecho-formatacao.js");
assert.equal(formatarDataBR("2026-02-25"),"25/02/2026");
assert.equal(formatarDataBR("2025-07-28"),"28/07/2025");
assert.equal(formatarDataBR("2026-08-13"),"13/08/2026");
assert.equal(formatarDataBR("25/02/2026"),"25/02/2026");
assert.equal(formatarDataBR(null),"—");assert.equal(formatarDataBR(""),"—");
for(const timezone of ["UTC","America/Sao_Paulo","Pacific/Kiritimati"]){process.env.TZ=timezone;assert.equal(formatarDataBR("2026-02-25"),"25/02/2026");}
const pagina=fs.readFileSync("interrupcao-trecho.js","utf8"),mapa=fs.readFileSync("interrupcao-trecho-mapa.js","utf8");assert.match(pagina,/formatarDataBR.*data_ocorrencia/);assert.match(pagina,/formatarDataBR.*ultimaAgosto/);assert.match(mapa,/formatarDataBR.*data_ocorrencia/);
console.log("Datas BR: tabela, gráficos, popup, importação e independência de timezone validados.");
