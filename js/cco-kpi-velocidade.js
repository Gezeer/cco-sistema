(function criarKpiVelocidade(global){
  "use strict";
  function normalizarNumero(valor){
    if(valor===null||valor===undefined||typeof valor==="string"&&!valor.trim())return null;
    if(typeof valor==="string"&&valor.trim()==="-")return null;
    const numero=typeof valor==="number"?valor:Number(String(valor).trim().replace(",","."));
    return Number.isFinite(numero)?numero:null;
  }
  function resumir(registros=[]){
    const valores=[],rejeitados=[];
    for(const item of registros){const valor=normalizarNumero(item?.velocidade_media);if(valor===null)rejeitados.push(item?.velocidade_media);else valores.push(valor);}
    return{valores,rejeitados,media:valores.length?valores.reduce((soma,valor)=>soma+valor,0)/valores.length:null};
  }
  function agrupar(registros=[],tamanhoChave=10){
    const mapa=new Map();
    for(const item of registros){const data=String(item?.data_normalizada||item?.data_operacao||"").slice(0,tamanhoChave),valor=normalizarNumero(item?.velocidade_media);if(!data||valor===null)continue;const atual=mapa.get(data)||{soma:0,quantidade:0};atual.soma+=valor;atual.quantidade+=1;mapa.set(data,atual);}
    return[...mapa].sort(([a],[b])=>a.localeCompare(b)).map(([periodo,item])=>({periodo,media:item.soma/item.quantidade,quantidade:item.quantidade}));
  }
  const api=Object.freeze({normalizarNumero,resumir,agruparPorDia:registros=>agrupar(registros,10),agruparPorMes:registros=>agrupar(registros,7)});
  global.CCOKpiVelocidade=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
