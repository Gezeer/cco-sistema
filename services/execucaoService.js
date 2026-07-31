(function criarExecucaoService(global) {
  "use strict";
  async function carregar(importacaoId, filtros = {}) {
    const ano=Number(filtros.ano),mes=Number(filtros.mes);
    if(!importacaoId&&(!ano||!mes))throw new Error("importacao_id ou período válido é obrigatório para consultar Execução.");
    if(!ano||!mes)return global.CCOKpiService.operacoes(importacaoId,filtros);
    const inicio=`${ano}-${String(mes).padStart(2,"0")}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${String(mes+1).padStart(2,"0")}-01`;
    const campos="id,importacao_id,chave_operacao,rd,servico,tipo_servico,data_operacao,turno,ra,equipe,qtd_equipe,peso_t,viagens,km_total,executado,velocidade_media";
    const banco=global.supabaseClient;
    if(!banco)throw new Error("Supabase indisponível.");
    const operacoes=await global.CCOSupabase.paginar(()=>{let consulta=banco.from("operacoes").select(campos).gte("data_operacao",inicio).lt("data_operacao",fim).order("id");if(importacaoId)consulta=consulta.eq("importacao_id",importacaoId);return consulta;});
    const p9Banco=operacoes.filter(item=>String(item.servico||"").trim().toUpperCase()==="P9");
    console.log("[P9 BANCO]",{registros:p9Banco.length,executado:p9Banco.reduce((t,x)=>t+(Number(x.executado)||0),0),peso_t:p9Banco.reduce((t,x)=>t+(Number(x.peso_t)||0),0),km_total:p9Banco.reduce((t,x)=>t+(Number(x.km_total)||0),0),importacaoId:importacaoId||null,datas:[...new Set(p9Banco.map(x=>String(x.data_operacao||"").slice(0,10)).filter(Boolean))].sort()});
    const p1=operacoes.filter(item=>String(item.servico||"").trim().toUpperCase()==="P1");
    if(!p1.length){global.__CCO_P1_KM_RAW__={importacaoId,linhasRaw:0,somaKmTotal:0};return operacoes;}
    try{
      const raw=await global.carregarRawP1CCO(importacaoId,{ano,mes});
      const resultadosKmP1=raw.map(linha=>global.obterKmTotalP1DoRawCCO(linha));
      const valoresRaw=resultadosKmP1.filter(item=>Number.isFinite(item.valor));
      const somaRaw=global.somarKmTotalP1PeriodoCCO(raw,{ano,mes,importacaoId},global.obterKmTotalP1DoRawCCO).somaKmTotal;
      const chavesRaw={dados:Object.keys(raw[0]?.dados||{}),dadosOriginais:Object.keys(raw[0]?.dados_originais||{})};
      global.__CCO_P1_KM_RAW__={importacaoId,linhasRaw:raw.length,camposEncontrados:valoresRaw.length,linhasSemCampo:raw.length-valoresRaw.length,somaKmTotal:somaRaw,chavesRaw,registrosRaw:raw};
      const origemExemplo=valoresRaw[0]||null;
      console.log("[P1 KM TOTAL][ORIGEM]",{cabecalhoLiteral:"Km_Total",chaveUnica:origemExemplo?.chaveUnica||null,valorExemplo:origemExemplo?.valor??null,colunaRejeitada:"KM Total"});
      if(!valoresRaw.length)console.warn("[P1 KM TOTAL] coluna literal Km_Total não encontrada");
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
      console.log("[P1 KM TOTAL][SOMA]",{periodo:`${ano}-${String(mes).padStart(2,"0")}`,registros:vinculadas,somaKmTotal:somaRaw,origem:"Km_Total"});
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
