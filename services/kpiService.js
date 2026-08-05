(function criarKpiService(global) {
  "use strict";
  const CAMPOS = "importacao_id,servico,tipo_servico,data_operacao,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  async function operacoes(importacaoId, filtros = {}) {
    const ano=Number(filtros.ano),mes=Number(filtros.mes),servico=global.CCOMetricas?.normalizarServico?.(filtros.servico)||String(filtros.servico||"").trim().toUpperCase();
    if(!importacaoId&&(!ano||!mes))throw new Error("importacao_id ou período válido é obrigatório para consultar KPI.");
    const partes = [importacaoId, filtros.ano, filtros.mes, servico, filtros.ra, filtros.turno], cacheKey = global.CCOCache.chave("kpi", partes);
    const produtor=()=>global.CCOCache.lembrar(cacheKey, async () => {
      const registros=await global.CCOSupabase.paginar(() => {
        let consulta = db().from("operacoes").select(CAMPOS).order("id");
        if(importacaoId)consulta=consulta.eq("importacao_id",importacaoId);
        if(ano&&mes){const inicio=`${ano}-${String(mes).padStart(2,"0")}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${String(mes+1).padStart(2,"0")}-01`;consulta=consulta.gte("data_operacao",inicio).lt("data_operacao",fim);}
        if (servico) consulta = consulta.eq("servico", servico);
        if (filtros.ra) consulta = consulta.eq("ra", filtros.ra);
        if (filtros.turno) consulta = consulta.eq("turno", filtros.turno);
        return consulta;
      });
      const velocidade=global.CCOKpiVelocidade,validos=(registros||[]).filter(item=>velocidade?velocidade.normalizarNumero(item?.velocidade_media)!==null:item?.velocidade_media!==null&&item?.velocidade_media!==undefined&&item?.velocidade_media!=="");
      if(global.CCO_DEBUG_PERFORMANCE===true)console.log("[KPI VELOCIDADE][CONSULTA]",{ano,mes,periodo:ano&&mes?`${ano}-${String(mes).padStart(2,"0")}`:null,importacaoId,servico:servico||null,registrosRecebidos:registros.length,registrosComVelocidade:validos.length});
      return registros;
    }, 5 * 60 * 1000);
    return global.CCOMobilePerformance?.dados({pagina:"kpi",ano,mes,servico,importacaoId},produtor)||produtor();
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
  global.CCOKpiService = Object.freeze({ operacoes, mensal, carregar });
})(window);
