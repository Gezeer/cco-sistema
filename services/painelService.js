(function criarPainelService(global) {
  "use strict";
  const TTL = 5 * 60 * 1000;
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const validarId = id => { if (!id) throw new Error("importacao_id é obrigatório."); return String(id); };

  async function catalogo() {
    const chave = global.CCOCache.chave("periodos", ["ativos"]);
    return global.CCOCache.lembrar(chave, async () => {
      const data = await global.CCOSupabase.paginar(() => db().from("importacoes")
        .select("id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em")
        .eq("ativa", true).in("status", ["concluida", "concluida_com_avisos"])
        .order("ano", { ascending:false }).order("mes", { ascending:false }).order("criado_em",{ascending:false}));
      return (data || []).map(item => ({ ...item, importacao_id:item.id, periodo:`${item.ano}-${String(item.mes).padStart(2,"0")}` }));
    }, TTL);
  }
  async function ultimoPeriodo() { return (await catalogo())[0] || null; }
  async function porImportacao(importacaoId) {
    const id = validarId(importacaoId), chave = global.CCOCache.chave("painel", [id]);
    return global.CCOCache.lembrar(chave, async () => {
      const { data, error } = await db().from("painel_executivo").select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados").eq("importacao_id", id).order("numero_linha");
      if (error) throw error;
      return data || [];
    }, TTL);
  }
  async function p9PorPeriodo(importacaoId,ano,mes) {
    const id=validarId(importacaoId),{data,error}=await db().from("painel_executivo")
      .select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados")
      .eq("importacao_id",id).eq("ano",Number(ano)).eq("mes",Number(mes)).eq("servico","P9").maybeSingle();
    if(error)throw error;
    return data||null;
  }
  global.CCOPainelService = Object.freeze({ catalogo, ultimoPeriodo, porImportacao, p9PorPeriodo });
})(window);
