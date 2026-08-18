(function criarPainelService(global) {
  "use strict";
  const TTL = 5 * 60 * 1000;
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const validarId = id => { if (!id) throw new Error("importacao_id é obrigatório."); return String(id); };
  const diasOperacaoCache=new Map();
  const diasOperacaoRegistros=new Map(),diasOperacaoPendentes=new Map();
  const importacaoPeriodoCache=new Map(),importacaoPeriodoPendentes=new Map();
  const importacoesCatalogoPendentes=new Map();
  const perf=(tipo,quantidade=1)=>global.CCOExecucaoPerformance?.contar?.(tipo,quantidade);
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

  async function executarRpcCatalogo(limiteMs=2500){
    const controlador=typeof AbortController!=="undefined"?new AbortController():null;
    let consulta=db().rpc("cco_catalogo_periodos");
    if(controlador&&typeof consulta?.abortSignal==="function")consulta=consulta.abortSignal(controlador.signal);
    let timer=null;
    const limite=new Promise(resolve=>{timer=setTimeout(()=>{controlador?.abort();resolve({data:null,status:408,error:{code:"CCO_CLIENT_TIMEOUT",message:`cco_catalogo_periodos excedeu ${limiteMs}ms`}});},limiteMs);});
    try{return await Promise.race([Promise.resolve(consulta),limite]);}finally{if(timer!==null)clearTimeout(timer);}
  }
  async function buscarFallbackLeveCatalogo(){
    const inicio=typeof performance!=="undefined"?performance.now():Date.now();
    const{data,error}=await db().from("v_catalogo_periodos").select("importacao_id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em").order("ano",{ascending:false}).order("mes",{ascending:false});
    if(error)throw Object.assign(new Error(`Fallback leve de catálogo indisponível: ${error.message||"erro sem mensagem"}`),{code:error.code,cause:error});
    const porPeriodo=new Map();
    for(const item of data||[]){const ano=Number(item.ano),mes=Number(item.mes),periodo=`${ano}-${String(mes).padStart(2,"0")}`;if(!item.importacao_id||!Number.isInteger(ano)||mes<1||mes>12||porPeriodo.has(periodo))continue;porPeriodo.set(periodo,{...item,ano,mes,periodo,origem:"fallback-leve-v_catalogo_periodos"});}
    return{catalogo:[...porPeriodo.values()].sort((a,b)=>b.ano-a.ano||b.mes-a.mes),fallbackMs:(typeof performance!=="undefined"?performance.now():Date.now())-inicio};
  }
  async function carregarDiasOperacao(catalogo){
    const ids=[...new Set((catalogo||[]).map(item=>String(item.importacao_id||"")).filter(Boolean))].sort(),chave=global.CCOCache.chave("dias-operacao-catalogo",ids);
    return global.CCOCache.lembrar(chave,async()=>{const inicio=typeof performance!=="undefined"?performance.now():Date.now();if(!ids.length)return{linhas:[],duracaoMs:0,requests:0};perf("requestsSupabase");const{data,error}=await db().from("dias_operacao").select("importacao_id,ano,mes,total_dias,dados").in("importacao_id",ids).order("ano",{ascending:false}).order("mes",{ascending:false});if(error)throw error;const duracaoMs=(typeof performance!=="undefined"?performance.now():Date.now())-inicio;console.log("[DIAS OPERACAO PERFORMANCE]",{duracaoMs,requests:1,registros:(data||[]).length,periodos:ids.length});return{linhas:data||[],duracaoMs,requests:1};},TTL);
  }

  async function produzirCatalogo() {
    const inicio=typeof performance!=="undefined"?performance.now():Date.now();
    console.log("[CATÁLOGO] início");
    let resultado=[],fonte="rpc";
    contador.consultasRPC+=1;
    if(global.CCOMobilePerformance)global.CCOMobilePerformance.metricas.consultasSupabase+=1;
    const relogio=()=>typeof performance!=="undefined"?performance.now():Date.now(),inicioRpc=relogio();
    const resposta=await executarRpcCatalogo(),rpcMs=relogio()-inicioRpc;
    console.log("[CATÁLOGO RPC]",{status:resposta.status??null,error:resposta.error?.message??null,details:resposta.error?.details??null,hint:resposta.error?.hint??null,duracaoMs:rpcMs});
    let fallbackMs=0;
    if(resposta.error){const mensagem=String(resposta.error.message||""),timeout=["57014","CCO_CLIENT_TIMEOUT","AbortError"].includes(resposta.error.code)||/statement timeout|canceling statement|excedeu|abort/i.test(mensagem);if(!timeout)throw Object.assign(new Error(`Falha na RPC cco_catalogo_periodos: ${mensagem||"erro sem mensagem"}`),{status:resposta.status??null,code:resposta.error.code??null,details:resposta.error.details??null,hint:resposta.error.hint??null,cause:resposta.error});console.warn("[CATÁLOGO] RPC indisponível; fallback leve ativado.",{code:resposta.error.code,message:mensagem});fonte="fallback-leve";const fallback=await buscarFallbackLeveCatalogo();resultado=fallback.catalogo;fallbackMs=fallback.fallbackMs;}
    else resultado=(resposta.data||[]).map(item=>({...item,ano:Number(item.ano),mes:Number(item.mes),periodo:item.periodo||`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`,origem:"rpc"})).sort((a,b)=>b.ano-a.ano||b.mes-a.mes);
    const diasResultado=await carregarDiasOperacao(resultado),diasOperacao=diasResultado.linhas,diasOperacaoMs=diasResultado.duracaoMs;
      if(global.CCOMobilePerformance)global.CCOMobilePerformance.metricas.consultasSupabase+=1;
      diasOperacaoCache.clear();
      diasOperacaoRegistros.clear();
      for(const item of diasOperacao||[]){
        const periodo=`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`;
        if(!diasOperacaoRegistros.has(periodo))diasOperacaoRegistros.set(periodo,item);
        if(item.importacao_id)diasOperacaoCache.set(`${item.importacao_id}|${periodo}`,Number(item.total_dias)||0);
        if(!diasOperacaoCache.has(periodo))diasOperacaoCache.set(periodo,Number(item.total_dias)||0);
      }
      global.CCO_REGRAS?.registrarDiasOperacao?.(diasOperacao||[]);
      if(global.CCO_DEBUG_AGOSTO===true){const agosto=resultado.find(item=>Number(item.ano)===2026&&Number(item.mes)===8),diasAgosto=(diasOperacao||[]).find(item=>Number(item.ano)===2026&&Number(item.mes)===8&&String(item.importacao_id)===String(agosto?.importacao_id));console.log("[AGOSTO DIAS OPERACAO]",{importacaoId:agosto?.importacao_id||null,valorPlanilha:diasAgosto?.dados?.valor_planilha??null,valorBanco:diasAgosto?.total_dias??null,totalDiasUsado:global.CCO_REGRAS?.obterDiasOperacao?.(2026,8)??0,fonte:diasAgosto?"public.dias_operacao":"ausente"});}
    const duracaoMs=(typeof performance!=="undefined"?performance.now():Date.now())-inicio;
    global.__CCO_CATALOGO_PERIODOS__=resultado;
    global.__CCO_IMPORTACOES_POR_PERIODO__=Object.fromEntries(resultado.map(item=>[item.periodo,item]));
    global.__CCO_PERIODOS_REAIS_V12__=resultado;
    console.log("[CATÁLOGO]",{fonte,quantidadePeriodos:resultado.length,rpcMs,diasOperacaoMs,fallbackMs,duracaoMs});
    global.CCOMobilePerformance?.fase("CATÁLOGO",{periodos:resultado.length});
    return resultado;
  }
  function getCatalogoPeriodos(){
    contador.consumidores+=1;
    const chave=global.CCOCache.chave("periodos",["rpc-v2-fallback-leve"]);
    if(global.__CCO_CATALOGO_RESOLVIDO__&&global.CCOCache.get?.(chave)===undefined)global.__CCO_CATALOGO_PROMISE__=null;
    if(global.__CCO_CATALOGO_PROMISE__){contador.promiseCompartilhada=true;return global.__CCO_CATALOGO_PROMISE__;}
    global.__CCO_CATALOGO_PROMISE__=global.CCOCache.lembrar(chave,produzirCatalogo,TTL).then(resultado=>{global.__CCO_CATALOGO_RESOLVIDO__=true;return resultado;}).catch(error=>{global.__CCO_CATALOGO_PROMISE__=null;global.__CCO_CATALOGO_RESOLVIDO__=false;throw error;});
    return global.__CCO_CATALOGO_PROMISE__;
  }
  const catalogo=()=>getCatalogoPeriodos();
  function invalidarDiasOperacao(){global.CCOCache?.invalidar("dias-operacao-catalogo");global.CCOCache?.invalidar("dias-operacao-periodo");diasOperacaoCache.clear();diasOperacaoRegistros.clear();diasOperacaoPendentes.clear();}
  function invalidarCatalogo(){global.CCOCache?.invalidar("periodos");invalidarDiasOperacao();importacaoPeriodoCache.clear();importacaoPeriodoPendentes.clear();importacoesCatalogoPendentes.clear();global.__CCO_CATALOGO_PROMISE__=null;global.__CCO_CATALOGO_RESOLVIDO__=false;}
  async function recarregarCatalogo(){invalidarCatalogo();return getCatalogoPeriodos();}
  function obterDiasOperacao(ano,mes,importacaoId=null){
    const periodo=`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
    return Number((importacaoId&&diasOperacaoCache.get(`${importacaoId}|${periodo}`))??diasOperacaoCache.get(periodo)??0);
  }
  async function diasOperacaoPorPeriodo(importacaoId,ano,mes){
    const id=validarId(importacaoId),periodo=`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`,salvo=diasOperacaoRegistros.get(periodo);
    if(salvo){perf("cacheHits");if(global.CCO_DEBUG_PAINEL_DIAS===true)console.log("[PAINEL DIAS OPERACAO]",{fonte:"cache-memoria-valido",ano:Number(ano),mes:Number(mes),importacaoId:id,resultadoBanco:salvo.total_dias,cacheHit:true});return salvo;}
    const totalCache=Number(diasOperacaoCache.get(`${id}|${periodo}`)??diasOperacaoCache.get(periodo));
    if(Number.isInteger(totalCache)&&totalCache>0){perf("cacheHits");return{importacao_id:id,ano:Number(ano),mes:Number(mes),total_dias:totalCache,dados:null};}
    if(diasOperacaoPendentes.has(periodo)){perf("cacheHits");return diasOperacaoPendentes.get(periodo);}
    const promessa=(async()=>{
      const usuario=await global.CCOSupabase?.exigirSessao?.({redirecionar:false});if(!usuario)throw new Error("Sessão autenticada obrigatória para consultar dias_operacao.");perf("requestsSupabase");
      const{data,error}=await db().from("dias_operacao").select("importacao_id,ano,mes,total_dias,dados").eq("ano",Number(ano)).eq("mes",Number(mes)).maybeSingle();
      if(error)throw error;
      const total=Number(data?.total_dias),oficial=Number.isInteger(total)&&total>0?data:null;
      if(oficial){diasOperacaoRegistros.set(periodo,oficial);diasOperacaoCache.set(`${id}|${periodo}`,total);diasOperacaoCache.set(periodo,total);global.CCO_REGRAS?.registrarDiasOperacao?.([oficial]);}
      if(global.CCO_DEBUG_PAINEL_DIAS===true)console.log("[PAINEL DIAS OPERACAO]",{fonte:"public.dias_operacao por ano,mes",ano:Number(ano),mes:Number(mes),importacaoId:id,resultadoBanco:oficial?.total_dias??null,cacheHit:false});
      return oficial;
    })();diasOperacaoPendentes.set(periodo,promessa);try{return await promessa;}finally{diasOperacaoPendentes.delete(periodo);}
  }
  async function resolverImportacaoPeriodo(ano,mes,importacaoPreferida=null){
    const a=Number(ano),m=Number(mes),periodo=`${a}-${String(m).padStart(2,"0")}`,salvo=importacaoPeriodoCache.get(periodo);if(salvo)return salvo;if(importacaoPeriodoPendentes.has(periodo))return importacaoPeriodoPendentes.get(periodo);
    const promessa=(async()=>{const inicio=`${periodo}-01`,fim=m===12?`${a+1}-01-01`:`${a}-${String(m+1).padStart(2,"0")}-01`,cliente=db(),[operacoes,painel]=await Promise.all([
      global.CCOSupabase.paginar(()=>cliente.from(`operacoes`).select("id,importacao_id,servico,aba,data_operacao").gte("data_operacao",inicio).lt("data_operacao",fim).order("id")),
      global.CCOSupabase.paginar(()=>cliente.from("painel_executivo").select("id,importacao_id,ano,mes,servico").eq("ano",a).eq("mes",m).order("id"))
    ]),normalizar=valor=>global.CCOMetricas?.normalizarServico?.(valor)||String(valor||"").trim().toUpperCase(),ids=new Set([String(importacaoPreferida||""),...operacoes.map(item=>String(item.importacao_id||"")),...painel.map(item=>String(item.importacao_id||""))].filter(Boolean)),candidatos=[...ids].map(id=>{const linhasOperacoes=operacoes.filter(item=>String(item.importacao_id)===id),linhasPainel=painel.filter(item=>String(item.importacao_id)===id),servicosOperacoes=[...new Set(linhasOperacoes.map(item=>normalizar(item.servico||item.aba)).filter(Boolean))],servicosPainel=[...new Set(linhasPainel.map(item=>normalizar(item.servico)).filter(Boolean))],servicos=[...new Set([...servicosPainel,...servicosOperacoes])];return{importacao_id:id,ano:a,mes:m,periodo,operacoesCount:linhasOperacoes.length,painelExecutivoCount:linhasPainel.length,servicosOperacoes,servicosPainel,servicos};}).sort((x,y)=>y.servicos.length-x.servicos.length||(y.operacoesCount+y.painelExecutivoCount)-(x.operacoesCount+x.painelExecutivoCount)||Number(y.importacao_id===String(importacaoPreferida))-Number(x.importacao_id===String(importacaoPreferida))),resultado=candidatos[0]?{...candidatos[0],candidatos}:null;if(resultado)importacaoPeriodoCache.set(periodo,resultado);return resultado;})();
    importacaoPeriodoPendentes.set(periodo,promessa);try{return await promessa;}finally{importacaoPeriodoPendentes.delete(periodo);}
  }
  async function resolverImportacoesCatalogo(catalogo){
    const periodos=(catalogo||[]).map(item=>({...item,ano:Number(item.ano),mes:Number(item.mes),periodo:`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`}));
    const chave=periodos.map(item=>`${item.periodo}:${item.importacao_id||""}`).join("|");
    if(importacoesCatalogoPendentes.has(chave)){perf("cacheHits");return importacoesCatalogoPendentes.get(chave);}
    const promessa=(async()=>{
      const faltantes=periodos.filter(item=>!importacaoPeriodoCache.has(item.periodo));
      perf("cacheHits",periodos.length-faltantes.length);
      if(faltantes.length){
        const desejados=new Set(faltantes.map(item=>item.periodo)),anos=[...new Set(faltantes.map(item=>item.ano))],cliente=db();
        perf("requestsSupabase");
        /* painel_executivo já possui uma linha agregada por serviço. Usá-lo para medir
           cobertura evita transferir todas as operações de todos os 12 serviços. */
        const [resultadoPainel]=await Promise.allSettled([
          global.CCOSupabase.paginar(()=>cliente.from("painel_executivo").select("importacao_id,ano,mes,servico").in("ano",anos).order("id"))
        ]),painel=resultadoPainel.status==="fulfilled"?resultadoPainel.value:[];
        if(resultadoPainel.status==="rejected")console.warn("[EXEC HIST] resolvedor agregado indisponível; catálogo oficial preservado.",resultadoPainel.reason);
        const normalizar=valor=>global.CCOMetricas?.normalizarServico?.(valor)||String(valor||"").trim().toUpperCase();
        for(const item of faltantes){
          const paineis=painel.filter(linha=>`${Number(linha.ano)}-${String(Number(linha.mes)).padStart(2,"0")}`===item.periodo&&desejados.has(item.periodo)),ids=new Set([String(item.importacao_id||""),...paineis.map(linha=>String(linha.importacao_id||""))].filter(Boolean));
          const candidatos=[...ids].map(id=>{const linhasPainel=paineis.filter(linha=>String(linha.importacao_id)===id),servicosPainel=[...new Set(linhasPainel.map(linha=>normalizar(linha.servico)).filter(Boolean))];return{importacao_id:id,ano:item.ano,mes:item.mes,periodo:item.periodo,operacoesCount:0,painelExecutivoCount:linhasPainel.length,servicosOperacoes:[],servicosPainel,servicos:servicosPainel};}).sort((x,y)=>y.servicos.length-x.servicos.length||y.painelExecutivoCount-x.painelExecutivoCount||Number(y.importacao_id===String(item.importacao_id))-Number(x.importacao_id===String(item.importacao_id)));
          if(candidatos[0])importacaoPeriodoCache.set(item.periodo,{...candidatos[0],candidatos});
        }
      }
      return periodos.map(item=>importacaoPeriodoCache.get(item.periodo)||null);
    })();
    importacoesCatalogoPendentes.set(chave,promessa);try{return await promessa;}finally{importacoesCatalogoPendentes.delete(chave);}
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
  global.CCOPainelService = Object.freeze({ catalogo, getCatalogoPeriodos, invalidarCatalogo, invalidarDiasOperacao, recarregarCatalogo, ultimoPeriodo, porImportacao, p9PorPeriodo, obterDiasOperacao, diasOperacaoPorPeriodo, resolverImportacaoPeriodo, resolverImportacoesCatalogo, montarCatalogoPorOperacoes, buscarFallbackLeveCatalogo, carregarDiasOperacao });
})(window);
