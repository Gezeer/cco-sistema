const fs=require("node:fs"),assert=require("node:assert/strict");
const painel=fs.readFileSync("painel-geral.js","utf8"),service=fs.readFileSync("services/painelService.js","utf8"),utils=fs.readFileSync("utils.js","utf8"),diagnostico=fs.readFileSync("js/cco-boot-diagnostics.js","utf8"),html=fs.readFileSync("index.html","utf8"),sql=fs.readFileSync("supabase_cco_catalogo_periodos_performance_v3.sql","utf8");

assert.match(service,/const promessaDias=.*dias_operacao/);
assert.match(service,/rpcMs/);assert.match(service,/diasOperacaoMs/);
assert.match(painel,/painel-geral\.carregarFontes/);assert.match(painel,/painel-geral\.consolidar/);assert.match(painel,/painel-geral\.cards/);assert.match(painel,/painel-geral\.graficos/);
assert.match(painel,/CCO_DEBUG_P9===true\|\|window\.CCO_DEBUG_BOOT===true/);
assert.match(painel,/if\(debug\)\{console\.log\("\[P9 ENTRADA\]"/,"stack P9 deve executar somente dentro do bloco debug");
for(const bloco of["ccoPatchFinalVerdeSemDuplicidade","ccoLimpezaFinalVerdeSemPreto","ccoLabelBrancaSombraUnicaFinal","ccoPatchFinalMobileBarrasFix2"]){const inicio=utils.indexOf(`(function ${bloco}()`),trecho=utils.slice(inicio,inicio+260);assert.ok(inicio>=0&&trecho.includes("if(window.__CCO_PAINEL_CONTROLADOR_OFICIAL__)return;"),`guard ausente em ${bloco}`);}
assert.match(sql,/select distinct on/i);assert.doesNotMatch(sql,/join public\.operacoes/i);assert.match(sql,/include \(importacao_id\)/i);assert.match(sql,/explain \(analyze, buffers/i);
assert.match(diagnostico,/\.grafico-echarts,\.cco-chart,\.analytics-chart,\[data-cco-grafico\]/);assert.doesNotMatch(diagnostico,/svg\.closest\?\.\("\[id\]"\)/,"ícones SVG comuns não podem ser classificados como gráficos");
assert.ok((html.match(/20260811-painel-performance-log-real-v3/g)||[]).length>=10);
assert.match(painel,/calcularAcumuladoP4Painel/);assert.match(painel,/Math\.min\(somaBruta,previsto\)/);assert.match(painel,/SERVICOS_EQUIPE/);
console.log("Painel performance log real: catálogo paralelo, medições, logs P9 protegidos, patches sem timers no Painel e SQL separado validados.");
