(function criarAnalyticsAIService(global){
  "use strict";
  const TTL=5*60*1000,cache=new Map(),pendentes=new Map();
  const agora=()=>Date.now();
  function chave(acao,f={}){return["analytics-ai",acao,f.servico||"",f.ano||"",f.mes||"",f.ra||"",f.turno||"",f.importacaoId||""].join("|");}
  async function lembrar(acao,f,produtor){const id=chave(acao,f),salvo=cache.get(id);if(salvo&&agora()-salvo.criadoEm<TTL)return salvo.valor;if(pendentes.has(id))return pendentes.get(id);const p=Promise.resolve().then(produtor).then(valor=>{cache.set(id,{criadoEm:agora(),valor});return valor;}).finally(()=>pendentes.delete(id));pendentes.set(id,p);return p;}
  async function catalogo(){return global.__CCO_CATALOGO_PROMISE__||global.CCOPainelService.getCatalogoPeriodos();}
  async function resolverPeriodo(ano,mes){const itens=await catalogo(),periodo=itens.find(item=>Number(item.ano)===Number(ano)&&Number(item.mes)===Number(mes));return periodo||null;}
  async function obterDadosPeriodo(f={}){const periodo=await resolverPeriodo(f.ano,f.mes);if(!periodo)return{periodo:null,dados:[],fontes:[]};const inicio=`${Number(f.ano)}-${String(Number(f.mes)).padStart(2,"0")}-01`,fimExclusivo=Number(f.mes)===12?`${Number(f.ano)+1}-01-01`:`${Number(f.ano)}-${String(Number(f.mes)+1).padStart(2,"0")}-01`,filtros={importacaoId:periodo.importacao_id,inicio,fimExclusivo,servico:f.servico,ra:f.ra,turno:f.turno};const dados=await lembrar("periodo",{...f,importacaoId:periodo.importacao_id},()=>global.CCOMetricas.carregarOperacoesResiliente(filtros));return{periodo,dados,fontes:["operacoes"]};}
  const obterDadosServico=f=>obterDadosPeriodo(f);
  async function obterDadosComparacao(f={}){const periodos=f.periodos||[];return Promise.all(periodos.map(item=>obterDadosPeriodo({...f,...item})));}
  async function executarAgregado(acao,f={}){const cat=await catalogo(),plano={intencao:acao,servicos:f.servico?[f.servico]:[],periodos:f.periodos||[],metricas:f.metricas||[],agrupamento:f.agrupamento||"mes",turnos:f.turno?[f.turno]:[],ras:f.ra?[f.ra]:[]};return lembrar(acao,f,()=>global.CCOAnalyticsConsultas.executar(plano,cat));}
  const obterDadosPorRA=f=>executarAgregado("ranking_ra",{...f,agrupamento:"ra"});
  const obterDadosPorTurno=f=>executarAgregado("ranking_turnos",{...f,agrupamento:"turno"});
  const obterSerieTemporal=f=>executarAgregado("evolucao_mensal",f);
  const obterResumoExecutivo=f=>executarAgregado("resumo_geral",f);
  const obterRankingServicos=f=>executarAgregado("ranking_servicos",f);
  async function obterAnomalias(f={}){const resultado=await obterDadosPeriodo(f);return{...resultado,anomalias:global.CCOAIAnalista.detectarAnomalias(resultado.dados)};}
  global.CCOAnalyticsAIService=Object.freeze({catalogo,resolverPeriodo,obterDadosPeriodo,obterDadosServico,obterDadosComparacao,obterDadosPorRA,obterDadosPorTurno,obterSerieTemporal,obterResumoExecutivo,obterRankingServicos,obterAnomalias,invalidarCache:()=>cache.clear(),chaveCache:chave,TTL});
})(window);
