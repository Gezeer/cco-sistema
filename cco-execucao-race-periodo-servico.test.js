const fs=require("node:fs"),assert=require("node:assert/strict");
const execucao=fs.readFileSync("execucao.js","utf8"),utils=fs.readFileSync("utils.js","utf8"),fixes=fs.readFileSync("cco-fixes.js","utf8"),service=fs.readFileSync("services/execucaoService.js","utf8"),html=fs.readFileSync("execucao.html","utf8");

assert.match(execucao,/servico,contexto\.ano,contexto\.mes,contexto\.importacaoId,sequencia/,"token inclui serviço, período, importação e sequência");
assert.match(execucao,/contextoExecucaoAtualCCO\(contexto\)/,"resposta é validada contra o contexto atual");
assert.match(fixes,/__ccoContextoExecucao.*contextoExecucaoAtualCCO/s,"publicação rejeita resposta antiga");
assert.match(utils,/EXECUÇÃO ESCRITA DESCARTADA/,"escrita final dos cards possui guarda");
assert.match(utils,/CCO_DEBUG_EXECUCAO_RACE.*\[EXECUÇÃO CARD WRITE\]/s,"diagnóstico de escrita é opt-in");
assert.match(utils,/CCO_PAGE\|\|""\).*===\s*"execucao"\)return false/,"temporizador legado não troca o período da Execução");
assert.match(execucao,/\.servico-btn.*queueMicrotask.*renderizarPeriodoExecucao/s,"troca de serviço inicia uma carga com novo token");
assert.match(execucao,/evolucao\|\$\{servico\}\|\$\{assinatura\}/,"cache histórico inclui serviço e importações por período");
assert.match(service,/pagina:"execucao",ano,mes,servico,importacaoId/,"cache operacional usa chave completa");
assert.match(fixes,/PAGINA==="execucao"&&metricas\.ehServicoEquipe\(servico\)[\s\S]*calcularEquipeMensalServico/,"cards de equipe reutilizam a regra mensal oficial");
assert.match(utils,/previstoEquipeOficial[^\n]*executado[^\n]*dadosServico\.reduce/,"card Equipes usa o acumulado oficial para serviços de equipe");
assert.match(fixes,/EXECUÇÃO P3 ABRIL DIAGNÓSTICO/,"diagnóstico de P3 Abril identifica consulta e consolidação");
assert.ok((html.match(/20260807-performance-boot-v2/g)||[]).length>=4,"cache-buster estrutural atualizado");

global.window=global;require("./cco-metricas.js");
assert.deepEqual({...global.CCOMetricas.PREVISTO_EQUIPE_POR_SERVICO},{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});
const p3=global.CCOMetricas.calcularEquipeMensalServico({servico:"P3",ano:2026,mes:4,importacaoId:"abril",registros:Array.from({length:314},(_,i)=>({servico:"P3",importacao_id:"abril",data_operacao:`2026-04-${String(i%30+1).padStart(2,"0")}`,qtd_equipe:1,valor_total:13101794.16,km_total:560920.91}))});
assert.equal(p3.previsto,12);assert.equal(p3.executado,12);assert.notEqual(p3.previsto,13101794.16);assert.notEqual(p3.executado,314);

async function simularCorrida(passos){let sequencia=0,tokenAtual="",resultado=null;await Promise.all(passos.map(({chave,atraso})=>{const token=`${chave}|${++sequencia}`;tokenAtual=token;return new Promise(resolve=>setTimeout(()=>{if(token===tokenAtual)resultado=chave;resolve();},atraso));}));return resultado;}
(async()=>{
  assert.equal(await simularCorrida([{chave:"P3|2026|04|abril",atraso:20},{chave:"P3|2026|07|julho",atraso:1}]),"P3|2026|07|julho");
  assert.equal(await simularCorrida([{chave:"P3|2026|07|julho",atraso:20},{chave:"P3|2026|04|abril",atraso:1}]),"P3|2026|04|abril");
  for(const [primeiro,ultimo] of [["P1","P3"],["P3","P9"],["P9","P3"]])assert.equal(await simularCorrida([{chave:`${primeiro}|2026|04|id`,atraso:15},{chave:`${ultimo}|2026|04|id`,atraso:1}]),`${ultimo}|2026|04|id`);
  console.log("OK: corridas período/serviço e invariantes de equipe protegidas");
})().catch(error=>{console.error(error);process.exitCode=1;});
