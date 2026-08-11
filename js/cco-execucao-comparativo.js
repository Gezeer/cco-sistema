(function criarComparativoMensalExecucao(global){
  "use strict";
  const INICIO=Object.freeze({ano:2025,mes:11});
  const MESES=Object.freeze(["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]);
  const chave=(ano,mes)=>`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
  const numeroOficial=valor=>valor===null||valor===undefined||valor===""?null:(Number.isFinite(Number(valor))?Number(valor):null);
  function montar({catalogo=[],linhas=[]}={}){
    const PERIODOS=[...new Map(catalogo.filter(item=>Number(item.ano)*12+Number(item.mes)>=INICIO.ano*12+INICIO.mes).map(item=>[chave(item.ano,item.mes),{ano:Number(item.ano),mes:Number(item.mes),rotulo:`${MESES[Number(item.mes)-1]}/${Number(item.ano)}`}])).values()].sort((a,b)=>a.ano-b.ano||a.mes-b.mes);
    const catalogoPorPeriodo=new Map(catalogo.map(item=>[chave(item.ano,item.mes),item]));
    const linhaPorImportacao=new Map(linhas.map(item=>[`${String(item.importacao_id)}|${chave(item.ano,item.mes)}`,item]));
    const itens=PERIODOS.map(periodo=>{
      const itemCatalogo=catalogoPorPeriodo.get(chave(periodo.ano,periodo.mes))||null;
      const importacaoId=itemCatalogo?.importacao_id??itemCatalogo?.id??null;
      const linha=importacaoId===null?null:linhaPorImportacao.get(`${String(importacaoId)}|${chave(periodo.ano,periodo.mes)}`)||null;
      return{...periodo,periodo:chave(periodo.ano,periodo.mes),importacaoId,previsto:numeroOficial(linha?.previsto),acumulado:numeroOficial(linha?.acumulado)};
    });
    return{
      itens,
      labels:itens.map(item=>item.rotulo),
      importacoes:itens.map(item=>item.importacaoId),
      previstos:itens.map(item=>item.previsto),
      acumulados:itens.map(item=>item.acumulado),
      percentuais:itens.map(item=>item.previsto!==null&&item.previsto!==0&&item.acumulado!==null?item.acumulado/item.previsto*100:null)
    };
  }
  global.CCOExecucaoComparativoMensal=Object.freeze({INICIO,chave,montar});
})(window);
