const fs=require("node:fs"),assert=require("node:assert/strict");
const execucao=fs.readFileSync("execucao.js","utf8"),utils=fs.readFileSync("utils.js","utf8"),css=fs.readFileSync("css/execucao.css","utf8");

assert.match(execucao,/let requisicaoEvolucaoExecucao=0,historicoLoading=false,historicoReady=false/);
assert.match(execucao,/Carregando evolução histórica\.\.\./);
assert.match(execucao,/token!==requisicaoEvolucaoExecucao/);
assert.match(execucao,/!labels\.length\|\|previstos\.length!==labels\.length\|\|acumulados\.length!==labels\.length/);
assert.match(execucao,/atualizarEstadoEvolucaoHistoricaCCO\("carregando"\)/);
assert.match(execucao,/atualizarEstadoEvolucaoHistoricaCCO\("pronto"\);grafico=window\.CCO_GRAFICOS_3D\.renderizarDireto/);
assert.match(utils,/toLowerCase\(\)!=="execucao"[\s\S]{0,180}ccoFinalCriarBarra\("graficoExecDetalheEvolucao"/);
assert.match(css,/#graficoExecDetalheEvolucao\[hidden\] \{ display:none !important; \}/);
console.log("OK: histórico da Execução aguarda dataset completo e descarta respostas obsoletas.");
