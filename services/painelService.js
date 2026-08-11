(function criarPainelService(global) {
  "use strict";
  const TTL = 5 * 60 * 1000;
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const validarId = id => { if (!id) throw new Error("importacao_id é obrigatório."); return String(id); };
  const diasOperacaoCache=new Map();
  const contador=global.__CCO_CONTADOR_CATALOGO__=global.__CCO_CONTADOR_CATALOGO__||{consultasRPC:0,paginacaoCompleta:0,consumidores:0,promiseCompartilhada:false};
  if(!Number.isFinite(contador.chamadasLegado))contador.chamadasLegado=0;

  function montarCatalogoPorOperacoes(operacoes,importacoes) {
    const importacoesPorId=new Map((importacoes||[]).map(item=>[String(item.id),item])),candidatos=new Map();
    for(const operacao of operacoes||[]){
      const data=String(operacao.data_operacao||"").slice(0,10),match=data.match(/^(\d{4})-(\d{2})-\d{2}$/);
      if(!match||!operacao.importacao_id)continue;
      const ano=Number(match[1]),mes=Number(match[2]),periodo=`${ano}-${String(mes).padStart(2,"0")}`,importacao=importacoesPorId.get(String(operacao.importacao_id))||{id:operacao.importacao_id};
      const lista=candidatos.get(periodo)||new Map();
      lista.set(String(operacao.importacao_id),{...importacao,id:operacao.importacao_id,ano,mes,periodo});
      candidatos.set(periodo,lista);
    }
    const pontuar=item=>Number(["concluida","concluida_com_avisos"].includes(item.status))*4+Number(Boolean(item.ativa))*2+Number(Number(item.ano)>0&&Number(item.mes)>0);
    return[...candidatos].map(([,porImportacao])=>[...porImportacao.values()].sort((a,b)=>pontuar(b)-pontuar(a)||String(b.concluido_em||b.criado_em||"").localeCompare(String(a.concluido_em||a.criado_em||"")))[0])
      .map(item=>({...item,importacao_id:item.id,origem:"operacoes.data_operacao"}))
      .sort((a,b)=>b.ano-a.ano||b.mes-a.mes);
  }

  async function paginarOperacoesCatalogo(tamanhoPagina=1000) {
    contador.paginacaoCompleta+=1;
    console.warn("[CATÁLOGO] fallback pesado ativado");
    const resultado=[];
    let ultimoId=null,offsetLogico=0;
    for(;;){
      let consulta=db().from("operacoes").select("id,importacao_id,data_operacao")
        .not("data_operacao","is",null).order("id",{ascending:true}).limit(tamanhoPagina);
      if(ultimoId!==null)consulta=consulta.gt("id",ultimoId);
      const{data,error}=await consulta;
      if(error)throw error;
      const lote=data||[];
      resultado.push(...lote);
      if(global.CCO_DEBUG_PAGINACAO===true)console.log("[PAGINAÇÃO]",{offset:offsetLogico,quantidadeRetornada:lote.length,totalAcumulado:resultado.length});
      if(lote.length===0||lote.length<tamanhoPagina)return resultado;
      const proximoId=lote.at(-1)?.id;
      if(proximoId===null||proximoId===undefined||String(proximoId)===String(ultimoId))throw new Error("Paginação de operacoes sem avanço da chave id.");
      ultimoId=proximoId;
      offsetLogico+=lote.length;
    }
  }

  function montarFallbackTemporarioCatalogo(operacoes){
    const porPeriodo=new Map();
    for(const item of operacoes||[]){const data=String(item.data_operacao||"").slice(0,10),match=data.match(/^(\d{4})-(\d{2})-\d{2}$/);if(!match||!item.importacao_id)continue;const ano=Number(match[1]),mes=Number(match[2]),periodo=`${ano}-${String(mes).padStart(2,"0")}`;porPeriodo.set(periodo,{ano,mes,periodo,importacao_id:item.importacao_id,origem:"fallback-temporario-operacoes"});}
    return[...porPeriodo.values()].sort((a,b)=>b.ano-a.ano||b.mes-a.mes);
  }

  async function produzirCatalogo() {
    const inicio=typeof performance!=="undefined"?performance.now():Date.now();
    console.log("[CATÁLOGO] início");
    let resultado=[],fonte="rpc";
    contador.consultasRPC+=1;
    if(global.CCOMobilePerformance)global.CCOMobilePerformance.metricas.consultasSupabase+=1;
    const relogio=()=>typeof performance!=="undefined"?performance.now():Date.now(),inicioRpc=relogio(),inicioDias=inicioRpc;
    const promessaDias=global.CCOSupabase.paginar(()=>db().from("dias_operacao").select("importacao_id,ano,mes,total_dias").order("ano",{ascending:false}).order("mes",{ascending:false}));
    const resposta=await db().rpc("cco_catalogo_periodos"),rpcMs=relogio()-inicioRpc;
    console.log("[CATÁLOGO RPC]",{status:resposta.status??null,error:resposta.error?.message??null,details:resposta.error?.details??null,hint:resposta.error?.hint??null,duracaoMs:rpcMs});
    if(resposta.error){const mensagem=String(resposta.error.message||""),timeout=resposta.error.code==="57014"||/statement timeout|canceling statement/i.test(mensagem);if(!timeout)throw Object.assign(new Error(`Falha na RPC cco_catalogo_periodos: ${mensagem||"erro sem mensagem"}`),{status:resposta.status??null,code:resposta.error.code??null,details:resposta.error.details??null,hint:resposta.error.hint??null,cause:resposta.error});console.warn("[CATÁLOGO] timeout da RPC; fallback temporário ativado.",{code:resposta.error.code,message:mensagem});fonte="fallback-temporario";resultado=montarFallbackTemporarioCatalogo(await paginarOperacoesCatalogo());}
    else resultado=(resposta.data||[]).map(item=>({...item,ano:Number(item.ano),mes:Number(item.mes),periodo:item.periodo||`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`,origem:"rpc"})).sort((a,b)=>b.ano-a.ano||b.mes-a.mes);
    const diasOperacao=await promessaDias,diasOperacaoMs=relogio()-inicioDias;
      if(global.CCOMobilePerformance)global.CCOMobilePerformance.metricas.consultasSupabase+=1;
      diasOperacaoCache.clear();
      for(const item of diasOperacao||[]){
        const periodo=`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`;
        if(item.importacao_id)diasOperacaoCache.set(`${item.importacao_id}|${periodo}`,Number(item.total_dias)||0);
        if(!diasOperacaoCache.has(periodo))diasOperacaoCache.set(periodo,Number(item.total_dias)||0);
      }
    const duracaoMs=(typeof performance!=="undefined"?performance.now():Date.now())-inicio;
    global.__CCO_CATALOGO_PERIODOS__=resultado;
    global.__CCO_IMPORTACOES_POR_PERIODO__=Object.fromEntries(resultado.map(item=>[item.periodo,item]));
    global.__CCO_PERIODOS_REAIS_V12__=resultado;
    console.log("[CATÁLOGO]",{fonte,quantidadePeriodos:resultado.length,rpcMs,diasOperacaoMs,duracaoMs});
    global.CCOMobilePerformance?.fase("CATÁLOGO",{periodos:resultado.length});
    return resultado;
  }
  function getCatalogoPeriodos(){
    contador.consumidores+=1;
    const chave=global.CCOCache.chave("periodos",["rpc-v1"]);
    if(global.__CCO_CATALOGO_RESOLVIDO__&&global.CCOCache.get?.(chave)===undefined)global.__CCO_CATALOGO_PROMISE__=null;
    if(global.__CCO_CATALOGO_PROMISE__){contador.promiseCompartilhada=true;return global.__CCO_CATALOGO_PROMISE__;}
    global.__CCO_CATALOGO_PROMISE__=global.CCOCache.lembrar(chave,produzirCatalogo,TTL).then(resultado=>{global.__CCO_CATALOGO_RESOLVIDO__=true;return resultado;}).catch(error=>{global.__CCO_CATALOGO_PROMISE__=null;global.__CCO_CATALOGO_RESOLVIDO__=false;throw error;});
    return global.__CCO_CATALOGO_PROMISE__;
  }
  const catalogo=()=>getCatalogoPeriodos();
  function invalidarCatalogo(){global.CCOCache?.invalidar("periodos");global.__CCO_CATALOGO_PROMISE__=null;global.__CCO_CATALOGO_RESOLVIDO__=false;}
  function obterDiasOperacao(ano,mes,importacaoId=null){
    const periodo=`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
    return Number((importacaoId&&diasOperacaoCache.get(`${importacaoId}|${periodo}`))??diasOperacaoCache.get(periodo)??0);
  }
  async function ultimoPeriodo() { return (await catalogo())[0] || null; }
  async function porImportacao(importacaoId) {
    const id = validarId(importacaoId), chave = global.CCOCache.chave("painel", [id]);
    if(global.CCO_DEBUG_P9===true)console.log("[P9 FLUXO LEITURA porImportacao]",{importacaoId:id,chaveCache:chave,fonte:"CCOCache.lembrar → painel_executivo"});
    return global.CCOCache.lembrar(chave, async () => {
      const { data, error } = await db().from("painel_executivo").select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados").eq("importacao_id", id).order("numero_linha");
      if (error) throw error;
      const p9=(data||[]).find(item=>String(item.servico||"").trim().toUpperCase()==="P9");
      if(global.CCO_DEBUG_P9===true)console.log("[P9 PRIMEIRA LEITURA porImportacao]",{arquivo:"services/painelService.js",funcao:"porImportacao",origem:"painel_executivo.acumulado",importacaoId:id,acumulado:p9?.acumulado??null});
      if(p9)global.CCODiagnosticoP9Etapa?.("services/painelService.js:porImportacao → painel_executivo.acumulado",p9.acumulado,"leitura direta da coluna painel_executivo.acumulado");
      return data || [];
    }, TTL);
  }
  async function p9PorPeriodo(importacaoId,ano,mes) {
    if(global.CCO_DEBUG_P9===true)console.log("[P9 FLUXO LEITURA p9PorPeriodo]",{importacaoId,ano:Number(ano),mes:Number(mes),fonte:"painel_executivo",cacheLocal:false});
    const id=validarId(importacaoId),{data,error}=await db().from("painel_executivo")
      .select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados")
      .eq("importacao_id",id).eq("ano",Number(ano)).eq("mes",Number(mes)).eq("servico","P9").maybeSingle();
    if(error)throw error;
    if(global.CCO_DEBUG_P9===true)console.log("[P9 PRIMEIRA LEITURA p9PorPeriodo]",{arquivo:"services/painelService.js",funcao:"p9PorPeriodo",origem:"painel_executivo.acumulado",importacaoId:id,periodo:`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`,acumulado:data?.acumulado??null});
    if(data)global.CCODiagnosticoP9Etapa?.("services/painelService.js:p9PorPeriodo → painel_executivo.acumulado",data.acumulado,"leitura direta da coluna painel_executivo.acumulado");
    return data||null;
  }
  global.CCOPainelService = Object.freeze({ catalogo, getCatalogoPeriodos, invalidarCatalogo, ultimoPeriodo, porImportacao, p9PorPeriodo, obterDiasOperacao, montarCatalogoPorOperacoes, montarFallbackTemporarioCatalogo, paginarOperacoesCatalogo });
})(window);
