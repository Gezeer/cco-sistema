(function criarKpiService(global) {
  "use strict";
  const CAMPOS = "importacao_id,servico,tipo_servico,data_operacao,peso_t,viagens,km_total,velocidade_media,qtd_equipe,equipe,executado,turno,ra";
  const TTL=5*60*1000;
  global.__CCO_KPI_DADOS_PROMISES__=global.__CCO_KPI_DADOS_PROMISES__||new Map();
  global.__CCO_KPI_DADOS_CACHE__=global.__CCO_KPI_DADOS_CACHE__||new Map();
  const metricas=global.__CCO_KPI_PERFORMANCE_METRICAS__=global.__CCO_KPI_PERFORMANCE_METRICAS__||{consultasSupabase:0,registrosRecebidos:0,cacheHits:0,cacheMisses:0,graficosCriados:0,graficosReutilizados:0};
  const debug=()=>global.CCO_DEBUG_KPI_PERFORMANCE===true;
  const SERVICOS_VALIDOS=new Set(["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const dadosPagina=(contexto,produtor,ttl)=>global.CCOPageDataCache?.obter?global.CCOPageDataCache.obter(contexto,produtor,ttl):global.CCOCache.lembrar(global.CCOCache.chave("page-data",[contexto.pagina,contexto.servico,contexto.ano,contexto.mes,contexto.dia,contexto.importacaoId]),produtor,ttl);
  async function operacoes(importacaoId, filtros = {}) {
    const ano=Number(filtros.ano),mes=Number(filtros.mes),normalizado=global.CCONormalizarServicoKPIObrigatorio?.(filtros.servico)||global.CCOMetricas?.normalizarServico?.(filtros.servico)||String(filtros.servico||"").trim().toUpperCase(),servico=SERVICOS_VALIDOS.has(normalizado)?normalizado:"P1";
    if(!importacaoId&&(!ano||!mes))throw new Error("importacao_id ou período válido é obrigatório para consultar KPI.");
    const dia=String(filtros.dia||"").padStart(filtros.dia?2:0,"0"),contexto={pagina:"kpi",ano:ano||"",mes:mes||"",servico,importacaoId:importacaoId||"",dia};
    return dadosPagina(contexto,async()=>{
      metricas.cacheMisses++;metricas.consultasSupabase++;
      const registros=await global.CCOSupabase.paginar(() => {
        let consulta = db().from("operacoes").select(CAMPOS).order("id");
        if(importacaoId)consulta=consulta.eq("importacao_id",importacaoId);
        if(ano&&mes){const inicio=`${ano}-${String(mes).padStart(2,"0")}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${String(mes+1).padStart(2,"0")}-01`;consulta=consulta.gte("data_operacao",inicio).lt("data_operacao",fim);}
        consulta = consulta.eq("servico", servico);
        if(dia&&ano&&mes)consulta=consulta.eq("data_operacao",`${ano}-${String(mes).padStart(2,"0")}-${dia}`);
        if (filtros.ra) consulta = consulta.eq("ra", filtros.ra);
        if (filtros.turno) consulta = consulta.eq("turno", filtros.turno);
        return consulta;
      });
      const velocidade=global.CCOKpiVelocidade,validos=(registros||[]).filter(item=>velocidade?velocidade.normalizarNumero(item?.velocidade_media)!==null:item?.velocidade_media!==null&&item?.velocidade_media!==undefined&&item?.velocidade_media!=="");
      metricas.registrosRecebidos+=registros.length;
      if(debug())console.log("[KPI PERFORMANCE][OPERAÇÕES]",{servico,ano,mes,dia,importacaoId,consultasSupabase:metricas.consultasSupabase,registrosRecebidos:registros.length,cacheHits:metricas.cacheHits,cacheMisses:metricas.cacheMisses,registrosComVelocidade:validos.length});
      return registros;
    },TTL);
  }
  async function mensal(importacaoId){
    if(!importacaoId)throw new Error("importacao_id é obrigatório para consultar kpi_mensal.");
    const cacheKey=global.CCOCache.chave("kpi-mensal",[importacaoId]);
    const produtor=()=>global.CCOCache.lembrar(cacheKey,()=>global.CCOSupabase.paginar(()=>db().from("kpi_mensal")
      .select("id,importacao_id,ano,mes,servico,total_operacoes,total_viagens,total_peso_t,total_km,velocidade_media,quantidade_dias,dados")
      .eq("importacao_id",importacaoId).order("servico")),5*60*1000);
    return global.CCOMobilePerformance?.dados({pagina:"kpi-mensal",ano:"",mes:"",servico:"",importacaoId},produtor)||produtor();
  }
  async function carregar(importacaoId,filtros={}){const[kpis,registros]=await Promise.all([mensal(importacaoId),operacoes(importacaoId,filtros)]);return{kpis,operacoes:registros};}
  function invalidarCache(){global.__CCO_KPI_DADOS_CACHE__.clear();global.__CCO_KPI_DADOS_PROMISES__.clear();global.CCOPageDataCache?.invalidar?.("kpi");}
  global.document?.addEventListener?.("cco:importacao-concluida",invalidarCache,{passive:true});
  global.CCOKpiService = Object.freeze({ operacoes, mensal, carregar, invalidarCache, CAMPOS });
})(window);
