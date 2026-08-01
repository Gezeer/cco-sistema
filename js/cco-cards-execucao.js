(function configurarCardsExecucaoCCO(global){
  "use strict";
  const animacoes=new WeakMap(),containersAnimados=new WeakSet(),valoresAnteriores=new Map();
  const titulosNumericos=new Set(["PREVISTO MENSAL","ACUMULADO NO PERÍODO","% EXECUÇÃO","DIAS COM DADOS","PESO","VIAGENS","KM EXECUTADO","PRODUTIVIDADE","DISTÂNCIA MÉDIA"]);
  const reduzirMovimento=()=>Boolean(global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const numeroPtBR=texto=>{let valor=String(texto??"").replace(/\s/g,"").replace(/R\$/gi,"").replace(/[^0-9,.-]/g,"");if(valor.includes(",")&&valor.includes("."))valor=valor.replace(/\./g,"").replace(",",".");else if(valor.includes(","))valor=valor.replace(",", ".");const numero=Number(valor);return Number.isFinite(numero)?numero:null;};
  function partesValor(texto){const original=String(texto??""),match=original.match(/^(.*?)([-+]?\d[\d.]*?(?:,\d+)?)([^\d]*)$/);if(!match)return{original,prefixo:"",sufixo:"",numero:null,casas:0};return{original,prefixo:match[1],sufixo:match[3],numero:numeroPtBR(match[2]),casas:(match[2].split(",")[1]||"").length};}
  function cancelarAnimacao(elemento){const id=animacoes.get(elemento);if(id!==undefined){global.cancelAnimationFrame?.(id);animacoes.delete(elemento);}}
  function animarNumeroCardCCO(elemento,valorFinal,opcoes={}){
    if(!elemento)return;
    cancelarAnimacao(elemento);
    const final=Number(valorFinal),textoFinal=opcoes.textoFinal??String(valorFinal);if(!Number.isFinite(final)){elemento.textContent=textoFinal;return;}
    const inicio=Number.isFinite(Number(opcoes.valorInicial))?Number(opcoes.valorInicial):numeroPtBR(elemento.textContent)??0,duracao=Math.min(800,Math.max(0,Number(opcoes.duracao??650))),casas=Math.max(0,Number(opcoes.casas??0)),prefixo=opcoes.prefixo??"",sufixo=opcoes.sufixo??"";
    if(reduzirMovimento()||duracao===0||typeof global.requestAnimationFrame!=="function"){elemento.textContent=textoFinal;return;}
    const formatador=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:casas,maximumFractionDigits:casas}),inicioTempo=global.performance?.now?.()??Date.now();
    const quadro=agora=>{const progresso=Math.min(1,(agora-inicioTempo)/duracao),suave=1-Math.pow(1-progresso,3),atual=inicio+(final-inicio)*suave;elemento.textContent=`${prefixo}${formatador.format(atual)}${sufixo}`;if(progresso<1){animacoes.set(elemento,global.requestAnimationFrame(quadro));}else{elemento.textContent=textoFinal;animacoes.delete(elemento);}};
    animacoes.set(elemento,global.requestAnimationFrame(quadro));
  }
  function prepararHover(card){if(card.dataset.ccoHover3d==="sim")return;card.dataset.ccoHover3d="sim";if(!global.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches)return;card.addEventListener("pointermove",evento=>{const caixa=card.getBoundingClientRect(),x=(evento.clientX-caixa.left)/caixa.width-.5,y=(evento.clientY-caixa.top)/caixa.height-.5;card.style.setProperty("--cco-card-rx",`${(-y*2.5).toFixed(2)}deg`);card.style.setProperty("--cco-card-ry",`${(x*3.5).toFixed(2)}deg`);});card.addEventListener("pointerleave",()=>{card.style.removeProperty("--cco-card-rx");card.style.removeProperty("--cco-card-ry");});}
  function definirCarregamento(carregando,erro){const area=document.getElementById("detalheServico");area?.classList.toggle("cco-cards-carregando",Boolean(carregando));if(!carregando)area?.classList.remove("cco-cards-carregando");if(erro)console.error("[CARDS EXECUÇÃO] carregamento encerrado com erro; cards preservados.",erro);}
  function animarCardsExecucaoCCO(opcoes={}){
    if(Object.prototype.hasOwnProperty.call(opcoes,"carregando")){definirCarregamento(opcoes.carregando,opcoes.erro);if(opcoes.carregando)return;}
    const container=document.querySelector("#detalheServico > .cards");if(!container)return;
    definirCarregamento(false,opcoes.erro);const cards=[...container.querySelectorAll(":scope > .card")],entrada=!containersAnimados.has(container);containersAnimados.add(container);
    cards.forEach((card,indice)=>{const titulo=card.querySelector(":scope > span")?.textContent?.trim().toUpperCase()||"",valor=card.querySelector(":scope > strong");prepararHover(card);if(entrada&&!reduzirMovimento()){card.classList.add("cco-card-entrada");card.style.setProperty("--cco-card-delay",`${Math.min(indice*45,360)}ms`);}if(titulo==="STATUS"&&/^atingido$/i.test(valor?.textContent?.trim()||""))card.classList.add("cco-card-meta-atingida");if(!valor||!titulosNumericos.has(titulo))return;const partes=partesValor(valor.textContent),anterior=valoresAnteriores.get(titulo);valoresAnteriores.set(titulo,partes.numero);if(partes.numero===null)return;animarNumeroCardCCO(valor,partes.numero,{valorInicial:Number.isFinite(anterior)?anterior:partes.numero,textoFinal:partes.original,prefixo:partes.prefixo,sufixo:partes.sufixo,casas:partes.casas,duracao:opcoes.duracao??650});});
    document.querySelector(".execucao-tendencia.is-crescimento, .execucao-tendencia.is-queda")?.classList.add("cco-tendencia-animada");
  }
  global.animarNumeroCardCCO=animarNumeroCardCCO;global.animarCardsExecucaoCCO=animarCardsExecucaoCCO;
  global.CCOCardsExecucao=Object.freeze({animarNumeroCardCCO,animarCardsExecucaoCCO,partesValor,cancelarAnimacao,definirCarregamento});
})(window);
