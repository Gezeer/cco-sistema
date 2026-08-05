(function criarComparativoMensalExecucao(global){
  "use strict";
  const PERIODOS=Object.freeze([
    Object.freeze({ano:2025,mes:11,rotulo:"Nov/2025"}),
    Object.freeze({ano:2025,mes:12,rotulo:"Dez/2025"}),
    Object.freeze({ano:2026,mes:1,rotulo:"Jan/2026"}),
    Object.freeze({ano:2026,mes:2,rotulo:"Fev/2026"}),
    Object.freeze({ano:2026,mes:3,rotulo:"Mar/2026"}),
    Object.freeze({ano:2026,mes:4,rotulo:"Abr/2026"}),
    Object.freeze({ano:2026,mes:5,rotulo:"Mai/2026"}),
    Object.freeze({ano:2026,mes:6,rotulo:"Jun/2026"}),
    Object.freeze({ano:2026,mes:7,rotulo:"Jul/2026"})
  ]);
  const chave=(ano,mes)=>`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
  const numeroOficial=valor=>valor===null||valor===undefined||valor===""?null:(Number.isFinite(Number(valor))?Number(valor):null);
  function montar({catalogo=[],linhas=[]}={}){
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
  global.CCOExecucaoComparativoMensal=Object.freeze({PERIODOS,chave,montar});
})(window);
