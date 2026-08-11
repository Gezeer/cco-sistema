(function criarMapaInterrupcoes(global){
  "use strict";

  const CORES=Object.freeze({mecanico:"#22c55e",borracharia:"#f59e0b",eletrica:"#22d3ee",hidraulico:"#3b82f6",sinistro:"#ef4444",atolado:"#a78bfa",outros:"#94a3b8"});
  const estado={mapa:null,grupo:null,legenda:null,camadaBase:null};
  const limparTexto=valor=>String(valor??"").trim();
  const escapar=valor=>limparTexto(valor).replace(/[&<>"']/g,caractere=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[caractere]));
  const chaveDefeito=valor=>{const texto=limparTexto(valor).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return Object.hasOwn(CORES,texto)?texto:"outros";};
  function parseLatLong(valor){
    const texto=limparTexto(valor);
    if(!texto||texto.toUpperCase()==="XXX")return null;
    const partes=texto.match(/^([+-]?\d+(?:\.\d+)?)\s*[,;]\s*([+-]?\d+(?:\.\d+)?)$/);
    if(!partes)return null;
    const latitude=Number(partes[1]),longitude=Number(partes[2]);
    return Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=-90&&latitude<=90&&longitude>=-180&&longitude<=180?{latitude,longitude}:null;
  }
  function prepararRegistrosMapa(registros=[]){const validos=[],invalidos=[];(registros||[]).forEach(registro=>{const coordenada=parseLatLong(registro?.lat_long);(coordenada?validos:invalidos).push(coordenada?{registro,coordenada}:registro)});return{validos,invalidos};}
  function linhaPopup(rotulo,valor){return limparTexto(valor)?`<div><strong>${rotulo}:</strong> ${escapar(valor)}</div>`:"";}
  function popup(registro){return `<div class="interrupcao-map-popup">${linhaPopup("Data",registro.data_ocorrencia)}${linhaPopup("RD",registro.rd)}${linhaPopup("Veículo",registro.veiculo)}${linhaPopup("Serviço",registro.servico)}${linhaPopup("RA",registro.ra)}${linhaPopup("Defeito",registro.tipo_defeito)}${linhaPopup("Atendimento",registro.atendimento)}${linhaPopup("Perímetro",registro.perimetro)}${linhaPopup("Descrição",registro.descricao)}</div>`;}
  function tooltip(registro){const partes=[registro.rd&&`RD ${escapar(registro.rd)}`,registro.veiculo&&escapar(registro.veiculo),registro.tipo_defeito&&escapar(registro.tipo_defeito)].filter(Boolean);return partes.join(" · ")||"Ocorrência";}
  function criarMapa(){
    const L=global.L,elemento=document.getElementById("mapaOcorrencias");
    if(estado.mapa||!L||!elemento)return estado.mapa;
    estado.mapa=L.map(elemento,{zoomControl:true,preferCanvas:true}).setView([0,0],2);
    estado.camadaBase=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(estado.mapa);
    estado.grupo=L.markerClusterGroup({chunkedLoading:true,chunkInterval:100,chunkDelay:25,showCoverageOnHover:false,spiderfyOnMaxZoom:true,maxClusterRadius:48}).addTo(estado.mapa);
    estado.legenda=L.control({position:"bottomright"});
    estado.legenda.onAdd=()=>{const div=L.DomUtil.create("div","interrupcao-map-legend");L.DomEvent.disableClickPropagation(div);return div;};
    estado.legenda.addTo(estado.mapa);
    return estado.mapa;
  }
  function atualizarLegenda(chaves){const elemento=estado.legenda?.getContainer?.();if(!elemento)return;const nomes={mecanico:"Mecânico",borracharia:"Borracharia",eletrica:"Elétrica",hidraulico:"Hidráulico",sinistro:"Sinistro",atolado:"Atolado",outros:"Outros"},itens=[...chaves].map(chave=>`<span><i style="--marker-color:${CORES[chave]}"></i>${nomes[chave]}</span>`).join("");elemento.innerHTML=`<details open><summary>Defeitos</summary>${itens}</details>`;}
  function renderizarMapaOcorrencias(registros=[]){
    const preparados=prepararRegistrosMapa(registros),contador=document.getElementById("mapaOcorrenciasContador"),vazio=document.getElementById("mapaOcorrenciasVazio"),mapa=criarMapa();
    if(contador)contador.textContent=`${preparados.validos.length.toLocaleString("pt-BR")} georreferenciadas • ${preparados.invalidos.length.toLocaleString("pt-BR")} sem coordenada`;
    if(!mapa||!estado.grupo)return preparados;
    estado.grupo.clearLayers();
    const categorias=new Set();
    preparados.validos.forEach(({registro,coordenada})=>{const categoria=chaveDefeito(registro.tipo_defeito),cor=CORES[categoria];categorias.add(categoria);const icone=global.L.divIcon({className:"interrupcao-map-marker-wrap",html:`<span class="interrupcao-map-marker" style="--marker-color:${cor}"></span>`,iconSize:[18,18],iconAnchor:[9,9],popupAnchor:[0,-10]});global.L.marker([coordenada.latitude,coordenada.longitude],{icon:icone,title:limparTexto(registro.tipo_defeito)||"Ocorrência"}).bindTooltip(tooltip(registro),{direction:"top",offset:[0,-8],opacity:.96}).bindPopup(popup(registro),{maxWidth:300,autoPanPadding:[24,24]}).addTo(estado.grupo);});
    atualizarLegenda(categorias);
    if(vazio)vazio.hidden=preparados.validos.length>0;
    requestAnimationFrame(()=>{mapa.invalidateSize(false);if(preparados.validos.length===1){const {latitude,longitude}=preparados.validos[0].coordenada;mapa.setView([latitude,longitude],15);}else if(preparados.validos.length>1){const limites=estado.grupo.getBounds();if(limites.isValid())mapa.fitBounds(limites,{padding:[28,28],maxZoom:16});}});
    return preparados;
  }
  const api=Object.freeze({parseLatLong,prepararRegistrosMapa,renderizarMapaOcorrencias});
  global.InterrupcaoTrechoMapa=api;global.renderizarMapaOcorrencias=renderizarMapaOcorrencias;
  if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
