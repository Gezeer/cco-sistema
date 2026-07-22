(function criarKpiService(global) {
  "use strict";
  const CAMPOS = "id,importacao_id,rd,servico,tipo_servico,data_operacao,turno,ra,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  async function operacoes(importacaoId, filtros = {}) {
    if (!importacaoId) throw new Error("importacao_id é obrigatório para consultar KPI.");
    const partes = [importacaoId, filtros.servico, filtros.ra, filtros.turno], cacheKey = global.CCOCache.chave("kpi", partes);
    return global.CCOCache.lembrar(cacheKey, async () => {
      return global.CCOSupabase.paginar(() => {
        let consulta = db().from("operacoes").select(CAMPOS).eq("importacao_id", importacaoId).order("id");
        if (filtros.servico) consulta = consulta.eq("servico", filtros.servico);
        if (filtros.ra) consulta = consulta.eq("ra", filtros.ra);
        if (filtros.turno) consulta = consulta.eq("turno", filtros.turno);
        return consulta;
      });
    }, 5 * 60 * 1000);
  }
  async function mensal(importacaoId){
    if(!importacaoId)throw new Error("importacao_id é obrigatório para consultar kpi_mensal.");
    const cacheKey=global.CCOCache.chave("kpi-mensal",[importacaoId]);
    return global.CCOCache.lembrar(cacheKey,()=>global.CCOSupabase.paginar(()=>db().from("kpi_mensal")
      .select("id,importacao_id,ano,mes,servico,total_operacoes,total_viagens,total_peso_t,total_km,velocidade_media,quantidade_dias,dados")
      .eq("importacao_id",importacaoId).order("servico")),5*60*1000);
  }
  async function carregar(importacaoId,filtros={}){const[kpis,registros]=await Promise.all([mensal(importacaoId),operacoes(importacaoId,filtros)]);return{kpis,operacoes:registros};}
  global.CCOKpiService = Object.freeze({ operacoes, mensal, carregar });
})(window);
