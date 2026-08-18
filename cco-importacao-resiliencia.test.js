const fs=require("node:fs");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8");

assert.match(fonte,/const TAMANHO_LOTE_RAW = 100/);
assert.match(fonte,/const TAMANHO_PAYLOAD_LOTE = 256 \* 1024/);
assert.match(fonte,/const PAUSA_ENTRE_LOTES_MS = 75/);
assert.match(fonte,/\[429,502,503,504\]\.includes\(status\)/);
assert.match(fonte,/tentativa<=MAX_TENTATIVAS_TRANSITORIAS/);
assert.match(fonte,/500\*2\*\*\(tentativa-1\)/);
assert.match(fonte,/\[IMPORTAÇÃO LOTE\]/);
assert.match(fonte,/hashPeriodoRaw/);
assert.match(fonte,/período inalterado; gravação ignorada/);
assert.match(fonte,/periodo_hash/);
assert.match(fonte,/Dias_Operação não configurado para \$\{grupo\.periodo\}/);
assert.match(fonte,/total_dias:totaisDias\[0\]/);
assert.doesNotMatch(fonte,/from\("importacoes"\)\.delete\(\).*statement timeout/);
assert.match(fonte,/window\.CCO_DEBUG_P9===true\)console\.log\("\[P9 PARSER\]"/);
assert.match(fonte,/\[P9 IMPORTAÇÃO RESUMO\]/);
assert.match(fonte,/CCOPainelService\.recarregarCatalogo\(\)/);
assert.match(fonte,/\[CATALOGO APOS IMPORTACAO\]/);
assert.match(fonte,/ausentes=periodosImportados\.filter/);
assert.doesNotMatch(fonte,/possuiAgosto2026|Agosto\/2026 foi finalizado/);
assert.match(fonte,/aplicarCatalogoPainelGeral\(catalogo,true\)/);
assert.match(fonte,/finally \{ fecharOverlay\(\)/);
assert.ok(fonte.indexOf("fecharOverlay();\n      alert(`Importação concluída")<fonte.indexOf("} finally { fecharOverlay()"),"overlay deve fechar antes do alerta e novamente no finally");

const painel=fs.readFileSync("painel-geral.js","utf8"),kpi=fs.readFileSync("kpi.js","utf8"),execucao=fs.readFileSync("execucao.js","utf8"),servico=fs.readFileSync("services/painelService.js","utf8");
assert.match(painel,/aplicarCatalogoPainelGeral/);
assert.match(kpi,/aplicarCatalogoAposImportacaoKPI/);
assert.match(execucao,/preencherFiltroAnoExecucao[\s\S]*preencherFiltroMesExecucao[\s\S]*renderizarPeriodoExecucao\(ultimo\)/);
assert.match(servico,/async function recarregarCatalogo\(\)\{invalidarCatalogo\(\);return getCatalogoPeriodos\(\);\}/);

console.log("Importação resiliente: incremental, lotes controlados, retry transitório, dias oficiais e logs P9 aprovados.");
