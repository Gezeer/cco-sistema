(function criarClassificadorSinistro(global){
  "use strict";

  const cache=new Map();
  const CATEGORIAS=Object.freeze(["Incidente","Pequena proporção","Média proporção","Grande proporção"]);
  const normalizar=valor=>String(valor??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const ehSinistro=registro=>normalizar(registro?.tipo_defeito)==="sinistro";
  const regras=Object.freeze({
    grande:[
      [/\bcapot(?:amento|ou|ado|ada)\b/,5,"capotamento"],[/\btomb(?:amento|ou|ado|ada)\b/,5,"tombamento"],[/\bincendio\b|\bpegou fogo\b/,5,"incêndio"],[/\bobito\b|\bfaleceu\b|\bmorte\b/,5,"óbito"],
      [/\bvitima(?:s)? grave(?:s)?\b/,4,"vítima grave"],[/\bmultiplas vitimas\b|\bvarias vitimas\b/,4,"múltiplas vítimas"],[/\binterdicao total\b|\bvia totalmente interditada\b|\bbloqueio total(?: da via)?\b/,4,"interdição total"],[/\bperda total\b/,4,"perda total"],
      [/\bcolisao multipla grave\b|\bacidente de grande porte\b/,5,"acidente de grande porte"],[/\bderramamento\b/,5,"derramamento"],[/\bveiculo preso\b/,5,"veículo preso"],[/\bresgate\b|\bsamu\b|\bbombeiros?\b/,5,"resgate emergencial"],[/\b(?:houve|com|deixou|causou) vitima(?:s)?\b/,5,"vítima"]
    ],
    media:[
      [/\b(?:acionado|necessitou|precisou|solicitado|chamado) (?:o )?guincho\b|\bnecessidade de guincho\b/,3,"guincho"],[/\bveiculo sem condicao de (?:seguir|rodar)\b|\bsem condicao de (?:seguir|rodar)\b/,3,"veículo sem condição de seguir"],
      [/\bremocao do veiculo\b|\bveiculo removido\b/,3,"remoção"],[/\bbloqueio parcial\b|\binterdicao parcial\b/,3,"bloqueio parcial"],[/\bmultiplos veiculos\b|\bvarios veiculos\b/,2,"múltiplos veículos"],[/\bdanos? (?:relevantes?|moderados?)\b|\bdano moderado\b/,2,"dano relevante"],[/\bpane decorrente da colisao\b|\bapoio operacional\b/,2,"apoio operacional"]
    ],
    pequena:[
      [/\bcolisao leve\b|\bbatida leve\b|\bcontato lateral leve\b/,1,"colisão leve"],[/\bpequenos? danos?\b|\barranhao\b/,1,"pequeno dano"],[/\bretrovisor\b|\bpara choque\b/,1,"dano localizado"],
      [/\bsem vitima(?:s)?\b|\bnao houve vitima(?:s)?\b/,1,"sem vítima"],[/\bsem interdicao\b|\bnao houve interdicao\b/,1,"sem interdição"],[/\bveiculo (?:permaneceu )?operacional\b|\bseguiu viagem\b/,1,"veículo operacional"],[/\bsem necessidade de guincho\b|\bnao (?:precisou|necessitou) de guincho\b/,1,"sem necessidade de guincho"]
    ]
  });
  function resultadoForaDoEscopo(){return{categoria:null,confianca:null,evidencias:[],scores:{grande:0,media:0,pequena:0}};}
  function resultadoIncidente(){return{categoria:"Incidente",confianca:"baixa",evidencias:[],scores:{grande:0,media:0,pequena:0}};}
  function classificarProporcaoSinistro(registro={}){
    if(!ehSinistro(registro))return resultadoForaDoEscopo();
    const texto=normalizar(registro.descricao),chave=`${registro.id??registro.rd??""}|${texto}`;
    if(cache.has(chave))return cache.get(chave);
    if(!texto)return resultadoIncidente();
    const textoRisco=texto.replace(/\b(?:sem vitimas?|nao houve vitimas?|sem interdicao|nao houve interdicao|sem necessidade de guincho|nao (?:precisou|necessitou) de guincho)\b/g," "),scores={grande:0,media:0,pequena:0},achadas={grande:[],media:[],pequena:[]};
    for(const nivel of ["grande","media","pequena"]){const fonte=nivel==="pequena"?texto:textoRisco;for(const [padrao,pontos,evidencia] of regras[nivel])if(padrao.test(fonte)&&!achadas[nivel].includes(evidencia)){scores[nivel]+=pontos;achadas[nivel].push(evidencia);}}
    let categoria="Incidente",nivel=null;
    if(scores.grande>=5){categoria="Grande proporção";nivel="grande";}else if(scores.media>=3){categoria="Média proporção";nivel="media";}else if(scores.pequena>=2){categoria="Pequena proporção";nivel="pequena";}
    const evidencias=nivel?achadas[nivel]:[...achadas.grande,...achadas.media,...achadas.pequena];
    const confianca=categoria==="Incidente"?"baixa":nivel==="grande"&&scores.grande>=8||nivel==="media"&&scores.media>=5||nivel==="pequena"&&scores.pequena>=3?"alta":evidencias.length>=2?"média":"baixa";
    const resultado=Object.freeze({categoria,confianca,evidencias:Object.freeze(evidencias),scores:Object.freeze({...scores})});cache.set(chave,resultado);
    if(global.CCO_DEBUG_SINISTRO_PROPORCAO)console.info("[SINISTRO PROPORCAO]",{id:registro.id,rd:registro.rd,descricao:registro.descricao,...resultado});
    return resultado;
  }
  function contarProporcoes(registros=[]){const contagens=Object.fromEntries(CATEGORIAS.map(c=>[c,0]));registros.filter(ehSinistro).forEach(r=>contagens[classificarProporcaoSinistro(r).categoria]++);return{total:Object.values(contagens).reduce((a,b)=>a+b,0),contagens};}
  const api=Object.freeze({CATEGORIAS,normalizar,ehSinistro,classificarProporcaoSinistro,contarProporcoes});global.InterrupcaoSinistroProporcao=api;global.classificarProporcaoSinistro=classificarProporcaoSinistro;
  if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
