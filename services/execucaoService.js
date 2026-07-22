(function criarExecucaoService(global) {
  "use strict";
  async function carregar(importacaoId, filtros = {}) {
    if (!importacaoId) throw new Error("importacao_id é obrigatório para consultar Execução.");
    const ano=Number(filtros.ano),mes=Number(filtros.mes);
    if(!ano||!mes)return global.CCOKpiService.operacoes(importacaoId,filtros);
    const inicio=`${ano}-${String(mes).padStart(2,"0")}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${String(mes+1).padStart(2,"0")}-01`;
    const campos="id,importacao_id,rd,servico,tipo_servico,data_operacao,turno,ra,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
    const banco=global.supabaseClient;
    if(!banco)throw new Error("Supabase indisponível.");
    return global.CCOSupabase.paginar(()=>banco.from("operacoes").select(campos).eq("importacao_id",importacaoId).gte("data_operacao",inicio).lt("data_operacao",fim).order("id"));
  }
  async function comparar(importacoes) {
    return Promise.all((importacoes || []).map(item => carregar(item.importacao_id).then(operacoes => ({ ...item, operacoes }))));
  }
  global.CCOExecucaoService = Object.freeze({ carregar, comparar });
})(window);
