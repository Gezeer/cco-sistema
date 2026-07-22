(function iniciarCCOV2Data(){
  "use strict";
  const cache = new Map();
  function cliente(){
    const c = window.CCOSupabase?.getClient?.();
    if(!c || typeof c.from !== "function") throw new Error("Cliente Supabase não inicializado.");
    return c;
  }
  async function ultimoPeriodo(){
    const {data,error}=await cliente().rpc("obter_ultimo_periodo");
    if(error) throw error;
    return Array.isArray(data) ? (data[0] || null) : data;
  }
  async function catalogo(){
    const {data,error}=await cliente().from("v_catalogo_periodos")
      .select("importacao_id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em")
      .order("ano",{ascending:true}).order("mes",{ascending:true});
    if(error) throw error;
    return data || [];
  }
  async function painel(importacaoId,{recarregar=false}={}){
    const chave=`painel:${importacaoId}`;
    if(!recarregar && cache.has(chave)) return cache.get(chave);
    const {data,error}=await cliente().from("v_painel_mensal_v2")
      .select("*").eq("importacao_id",importacaoId).order("ordem",{ascending:true});
    if(error) throw error;
    cache.set(chave,data || []);
    return data || [];
  }
  async function operacoes(importacaoId,{servico=null,ra=null,turno=null,inicio=0,fim=999}={}){
    const campos="id,importacao_id,rd,servico,tipo_servico,data_operacao,turno,ra,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
    let q=cliente().from("operacoes").select(campos).eq("importacao_id",importacaoId).order("id",{ascending:true}).range(inicio,fim);
    if(servico) q=q.eq("servico",servico);
    if(ra) q=q.eq("ra",ra);
    if(turno) q=q.eq("turno",turno);
    const {data,error}=await q;
    if(error) throw error;
    return data || [];
  }
  function limpar(importacaoId=null){
    if(!importacaoId){cache.clear();return;}
    [...cache.keys()].filter(k=>k.endsWith(`:${importacaoId}`)).forEach(k=>cache.delete(k));
  }
  window.CCOV2Data=Object.freeze({ultimoPeriodo,catalogo,painel,operacoes,limpar});
})();
