(function criarPainelService(global) {
  "use strict";
  const TTL = 5 * 60 * 1000;
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const validarId = id => { if (!id) throw new Error("importacao_id é obrigatório."); return String(id); };

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

  async function catalogo() {
    const chave = global.CCOCache.chave("periodos", ["operacoes-data-v1"]);
    return global.CCOCache.lembrar(chave, async () => {
      console.log("[CATÁLOGO] consulta executada",{
        operacoes:"select importacao_id,data_operacao; data_operacao not null; paginação completa",
        importacoes:"select metadados; sem filtro ativa/ativo; paginação completa"
      });
      const[operacoes,importacoes]=await Promise.all([
        global.CCOSupabase.paginar(()=>db().from("operacoes").select("importacao_id,data_operacao").not("data_operacao","is",null).order("data_operacao",{ascending:false})),
        global.CCOSupabase.paginar(()=>db().from("importacoes").select("id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em").order("criado_em",{ascending:false}))
      ]);
      const resultado=montarCatalogoPorOperacoes(operacoes,importacoes);
      console.log("[CATÁLOGO] períodos encontrados",resultado.map(item=>item.periodo));
      console.table(resultado.map(item=>({periodo:item.periodo,importacao_id:item.importacao_id,status:item.status||null,ativa:Boolean(item.ativa),origem:item.origem})));
      console.log("[CATÁLOGO] origem dos períodos","operacoes.data_operacao",{operacoesLidas:operacoes.length,importacoesLidas:importacoes.length});
      return resultado;
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
  global.CCOPainelService = Object.freeze({ catalogo, ultimoPeriodo, porImportacao, p9PorPeriodo, montarCatalogoPorOperacoes });
})(window);
