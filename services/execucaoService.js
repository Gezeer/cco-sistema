(function criarExecucaoService(global) {
  "use strict";
  async function carregar(importacaoId, filtros = {}) {
    if (!importacaoId) throw new Error("importacao_id é obrigatório para consultar Execução.");
    const ano=Number(filtros.ano),mes=Number(filtros.mes);
    if(!ano||!mes)return global.CCOKpiService.operacoes(importacaoId,filtros);
    const inicio=`${ano}-${String(mes).padStart(2,"0")}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${String(mes+1).padStart(2,"0")}-01`;
    const campos="id,importacao_id,chave_operacao,rd,servico,tipo_servico,data_operacao,turno,ra,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
    const banco=global.supabaseClient;
    if(!banco)throw new Error("Supabase indisponível.");
    const operacoes=await global.CCOSupabase.paginar(()=>banco.from("operacoes").select(campos).eq("importacao_id",importacaoId).gte("data_operacao",inicio).lt("data_operacao",fim).order("id"));
    const p1=operacoes.filter(item=>String(item.servico||"").trim().toUpperCase()==="P1");
    if(!p1.length){global.__CCO_P1_KM_RAW__={importacaoId,linhasRaw:0,somaKmTotal:0};return operacoes;}
    try{
      const raw=await global.carregarRawP1CCO(importacaoId);
      const resultadosKmP1=raw.map(linha=>global.obterKmTotalP1DoRawCCO(linha));
      const valoresRaw=resultadosKmP1.filter(item=>Number.isFinite(item.valor));
      const somaRaw=valoresRaw.reduce((s,item)=>s+item.valor,0);
      const chavesRaw={dados:Object.keys(raw[0]?.dados||{}),dadosOriginais:Object.keys(raw[0]?.dados_originais||{})};
      global.__CCO_P1_KM_RAW__={importacaoId,linhasRaw:raw.length,camposEncontrados:valoresRaw.length,linhasSemCampo:raw.length-valoresRaw.length,somaKmTotal:somaRaw,chavesRaw};
      console.log("[P1 Km_Total CORRETO]",{importacaoId,linhasRaw:raw.length,linhasValidas:valoresRaw.length,campo:"Km_Total",fallback:"km_total_2",soma:somaRaw});
      const porChave=new Map(),duplicadas=new Set();
      for(const linha of raw){if(porChave.has(linha.chave_linha))duplicadas.add(linha.chave_linha);porChave.set(linha.chave_linha,linha);}
      if(duplicadas.size)throw new Error(`RAW P1 possui ${duplicadas.size} chave(s) duplicada(s).`);
      let vinculadas=0,semVinculo=0;
      const resultado=operacoes.map(item=>{
        if(String(item.servico||"").trim().toUpperCase()!=="P1")return item;
        const linha=porChave.get(item.chave_operacao),resultado=global.obterKmTotalP1DoRawCCO(linha);
        if(!linha||!Number.isFinite(resultado.valor)){semVinculo++;return{...item,km_total:null};}
        vinculadas++;return{...item,km_total:resultado.valor};
      });
      console.log("[P1 KM TOTAL][RAW]",{importacaoId,registros:p1.length,linhasRaw:raw.length,vinculadas,semVinculo,somaRaw});
      return resultado;
    }catch(error){
      global.__CCO_P1_KM_RAW__={importacaoId,linhasRaw:0,somaKmTotal:0,error:error?.message||String(error)};
      console.error("[P1 KM TOTAL][RAW] falha na auditoria; o valor contaminado não será exibido.",{importacaoId,code:error?.code,message:error?.message});
      return operacoes.map(item=>String(item.servico||"").trim().toUpperCase()==="P1"?{...item,km_total:null}:item);
    }
  }
  async function comparar(importacoes) {
    return Promise.all((importacoes || []).map(item => carregar(item.importacao_id).then(operacoes => ({ ...item, operacoes }))));
  }
  global.CCOExecucaoService = Object.freeze({ carregar, comparar });
})(window);
