const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const window={console,document:{addEventListener(){}},CCOMetricas:{normalizarServico:v=>String(v||"").toUpperCase()},InterrupcaoSinistroProporcao:{ehSinistro:r=>String(r.tipo_defeito).toLowerCase()==="sinistro",contarProporcoes:rows=>({contagens:{Incidente:rows.length,"Pequena proporção":0,"Média proporção":0,"Grande proporção":0}})},InterrupcaoTrechoService:{minutosResposta:r=>r.minutos??null}};vm.createContext({window,console});
for(const file of ["js/cco-analytics-domains.js","js/cco-analytics-context.js","js/cco-analytics-intencoes.js","js/cco-analytics-engine.js","js/cco-analytics-evidence.js","js/cco-analytics-response.js","js/cco-analytics-validator.js"])vm.runInContext(fs.readFileSync(file,"utf8"),vm.createContext({window,console}));
const catalog=[];for(const year of [2025,2026])for(let month=1;month<=12;month++)catalog.push({ano:year,mes:month});
const cases=[
 ["Quantas ocorrências tivemos em julho de 2026?","consultar_total","INTERRUPCOES","ocorrencias"],
 ["Analise as ocorrências de 2025","analisar_periodo","INTERRUPCOES","ocorrencias"],
 ["Compare ocorrências de 2025 e 2026","comparar_periodos","INTERRUPCOES","ocorrencias"],
 ["Qual RA teve mais ocorrências?","ranking","INTERRUPCOES","ocorrencias"],
 ["Quais são os principais defeitos?","ranking","INTERRUPCOES","tipo_defeito"],
 ["Qual veículo teve mais ocorrências?","ranking","INTERRUPCOES","veiculo"],
 ["Quantos socorros ocorreram?","consultar_total","INTERRUPCOES","socorros"],
 ["Qual foi o tempo médio de resposta?","consultar_total","INTERRUPCOES","tempo_medio_resposta"],
 ["Analise os sinistros de 2026","analisar_periodo","SINISTROS","sinistros"],
 ["Compare os sinistros de 2025 e 2026","comparar_periodos","SINISTROS","sinistros"],
 ["Mostre a proporção dos sinistros","consultar_total","SINISTROS","proporcao_sinistros"],
 ["Qual RA teve mais sinistros?","ranking","SINISTROS","sinistros"],
 ["Qual veículo teve mais sinistros?","ranking","SINISTROS","sinistros"],
 ["Como está P12?","consultar_p12","EXECUCAO","acumulado"],
 ["Compare P5 em junho e julho de 2026","comparar_periodos","EXECUCAO","acumulado"],
 ["Qual serviço teve maior execução?","ranking_servicos","EXECUCAO","percentual_execucao"],
 ["Qual o percentual de execução?","pergunta_livre","EXECUCAO","percentual_execucao"],
 ["Qual o previsto do P1?","consultar_servico","EXECUCAO","previsto"],
 ["Qual foi a velocidade média?","consultar_velocidade","KPI","velocidade_media"],
 ["Compare a velocidade de junho e julho","comparar_periodos","KPI","velocidade_media"],
 ["Quantos km foram executados?","pergunta_livre","OPERACAO","km_total"],
 ["Quantas equipes trabalharam?","consultar_equipes","OPERACAO","equipes"],
 ["Qual foi o valor financeiro?","consultar_valor","PAINEL","valor_total"],
 ["Qualidade das importações","qualidade_dados","IMPORTACOES","acumulado"],
 ["Quantas rejeições de importação?","erros","IMPORTACOES","acumulado"],
 ["Faça um resumo para diretoria","resumo_diretoria","OPERACAO","acumulado"],
 ["Existe alguma anomalia?","anomalias","OPERACAO","acumulado"],
 ["Qual foi o pior serviço?","metrica_ambigua","EXECUCAO","acumulado"],
 ["Some os percentuais de todos os serviços","operacao_invalida","EXECUCAO","percentual_execucao"],
 ["Quantas ocorrências em 2035?","consultar_total","INTERRUPCOES","ocorrencias"],
 ["Qual motorista causou mais acidentes?","ranking","SINISTROS","sinistros"],
 ["Por que os acidentes aumentaram?","consultar_total","SINISTROS","sinistros"]
];
for(const [q,intent,domain,metric] of cases){const p=window.CCOAnalyticsIntencoes.estruturar(q,{catalogo:catalog,contexto:{}});assert.equal(p.intent,intent,q);assert.equal(p.domain,domain,q);assert.equal(p.metrics[0],metric,q);}
let p=window.CCOAnalyticsIntencoes.estruturar("Analise os sinistros de 2026",{catalogo:catalog,contexto:{}});window.CCOAnalyticsContext.update(p);p=window.CCOAnalyticsIntencoes.estruturar("E 2025?",{catalogo:catalog,contexto:window.CCOAnalyticsContext.get()});assert.equal(p.domain,"SINISTROS");assert.equal(p.metrics[0],"sinistros");assert(p.periods.every(x=>x.year===2025));
const plan={intent:"comparar_periodos",domain:"EXECUCAO",metrics:["percentual_execucao"],periods:[],filters:{services:[],ras:[],shifts:[]}},calc=window.CCOAnalyticsEngine.calculate(plan,{dados:[{ano:2026,mes:7,acumulado:50,previsto:100,percentual_execucao:50},{ano:2026,mes:7,acumulado:90,previsto:100,percentual_execucao:90}]});assert.equal(calc.values.series[0].percentual_execucao,70);
const evidence=window.CCOAnalyticsEvidence.create({plan,datasetVersion:"v1",sources:[],...calc}),good={text:"O percentual foi 70%.",domain:"EXECUCAO",evidenceId:evidence.evidenceId},bad={...good,text:"O percentual foi 71%."};assert.equal(window.CCOAnalyticsValidator.validate(good,evidence).valid,true);assert.equal(window.CCOAnalyticsValidator.validate(bad,evidence).valid,false);assert.deepEqual(evidence.chartDataset.values,evidence.values.series.map(x=>x.percentual_execucao));
console.log(`CCO Analytics AI V2: ${cases.length} avaliações + contexto, percentual, grounding e gráfico aprovados.`);
