(function criarMapaInterrupcoes(global){
  "use strict";

  const CORES=Object.freeze({mecanico:"#22c55e",borracharia:"#f59e0b",eletrica:"#22d3ee",hidraulico:"#3b82f6",sinistro:"#ef4444",atolado:"#a78bfa",outros:"#94a3b8"});
  const AREA_OPERACIONAL=Object.freeze({minLat:-16.5,maxLat:-15.3,minLng:-49,maxLng:-47.2});
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
  function coordenadaNaAreaOperacional({latitude,longitude}={}){return Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=AREA_OPERACIONAL.minLat&&latitude<=AREA_OPERACIONAL.maxLat&&longitude>=AREA_OPERACIONAL.minLng&&longitude<=AREA_OPERACIONAL.maxLng;}
  function limitarAreaOperacional(preparados){const validos=[],foraArea=[];preparados.validos.forEach(item=>(coordenadaNaAreaOperacional(item.coordenada)?validos:foraArea).push(item));return{validos,invalidos:preparados.invalidos,foraArea};}
  function calcularDiagnosticoBounds(preparados,totalRegistros=0){
    const pontos=preparados.validos.map(item=>item.coordenada);
    if(!pontos.length)return{totalRegistros,coordenadasValidas:0,minLat:null,maxLat:null,minLng:null,maxLng:null,centroCalculado:null,outliers:[]};
    const latitudes=pontos.map(ponto=>ponto.latitude),longitudes=pontos.map(ponto=>ponto.longitude);
    const centroCalculado={latitude:(Math.min(...latitudes)+Math.max(...latitudes))/2,longitude:(Math.min(...longitudes)+Math.max(...longitudes))/2};
    const mediana=valores=>{const lista=[...valores].sort((a,b)=>a-b),meio=Math.floor(lista.length/2);return lista.length%2?lista[meio]:(lista[meio-1]+lista[meio])/2;};
    const centroRobusto={latitude:mediana(latitudes),longitude:mediana(longitudes)};
    const distanciaKm=(a,b)=>{const rad=Math.PI/180,dLat=(b.latitude-a.latitude)*rad,dLng=(b.longitude-a.longitude)*rad,lat1=a.latitude*rad,lat2=b.latitude*rad,h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
    const distancias=pontos.map(ponto=>distanciaKm(centroRobusto,ponto)),distanciaMediana=mediana(distancias),limite=Math.max(1000,distanciaMediana*5);
    const outliers=preparados.validos.map((item,indice)=>({registro:item.registro,coordenada:item.coordenada,distanciaDoCentroKm:distancias[indice]})).filter(item=>item.distanciaDoCentroKm>limite);
    return{totalRegistros,coordenadasValidas:pontos.length,minLat:Math.min(...latitudes),maxLat:Math.max(...latitudes),minLng:Math.min(...longitudes),maxLng:Math.max(...longitudes),centroCalculado,outliers};
  }
  function linhaPopup(rotulo,valor){return limparTexto(valor)?`<div><strong>${rotulo}:</strong> ${escapar(valor)}</div>`:"";}
  function popup(registro){return `<div class="interrupcao-map-popup">${linhaPopup("Data",registro.data_ocorrencia)}${linhaPopup("RD",registro.rd)}${linhaPopup("Veículo",registro.veiculo)}${linhaPopup("Serviço",registro.servico)}${linhaPopup("RA",registro.ra)}${linhaPopup("Defeito",registro.tipo_defeito)}${linhaPopup("Atendimento",registro.atendimento)}${linhaPopup("Perímetro",registro.perimetro)}${linhaPopup("Descrição",registro.descricao)}</div>`;}
  function tooltip(registro){const partes=[registro.rd&&`RD ${escapar(registro.rd)}`,registro.veiculo&&escapar(registro.veiculo),registro.tipo_defeito&&escapar(registro.tipo_defeito)].filter(Boolean);return partes.join(" · ")||"Ocorrência";}
  function criarMapa(){
    const L=global.L,elemento=document.getElementById("mapaOcorrencias");
    if(estado.mapa||!L||!elemento)return estado.mapa;
    estado.mapa=L.map(elemento,{zoomControl:true,preferCanvas:true,worldCopyJump:false,minZoom:2,maxBounds:[[-90,-180],[90,180]],maxBoundsViscosity:1}).setView([0,0],2);
    estado.camadaBase=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,noWrap:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(estado.mapa);
    estado.grupo=L.markerClusterGroup({chunkedLoading:true,chunkInterval:100,chunkDelay:25,showCoverageOnHover:false,spiderfyOnMaxZoom:true,maxClusterRadius:48}).addTo(estado.mapa);
    estado.legenda=L.control({position:"bottomright"});
    estado.legenda.onAdd=()=>{const div=L.DomUtil.create("div","interrupcao-map-legend");L.DomEvent.disableClickPropagation(div);return div;};
    estado.legenda.addTo(estado.mapa);
    return estado.mapa;
  }
  function atualizarLegenda(chaves){const elemento=estado.legenda?.getContainer?.();if(!elemento)return;const nomes={mecanico:"Mecânico",borracharia:"Borracharia",eletrica:"Elétrica",hidraulico:"Hidráulico",sinistro:"Sinistro",atolado:"Atolado",outros:"Outros"},itens=[...chaves].map(chave=>`<span><i style="--marker-color:${CORES[chave]}"></i>${nomes[chave]}</span>`).join("");elemento.innerHTML=`<details open><summary>Defeitos</summary>${itens}</details>`;}
  function renderizarMapaOcorrencias(registros=[]){
    const preparados=limitarAreaOperacional(prepararRegistrosMapa(registros)),contador=document.getElementById("mapaOcorrenciasContador"),vazio=document.getElementById("mapaOcorrenciasVazio"),mapa=criarMapa();
    preparados.foraArea.forEach(({registro})=>console.warn("[INTERRUPCAO COORDENADA FORA DA AREA]",{id:registro?.id,rd:registro?.rd,ra:registro?.ra,lat_long:registro?.lat_long,motivo:"coordenada válida, porém fora da área operacional plausível; mantida na tabela e ignorada somente no mapa"}));
    const diagnostico=calcularDiagnosticoBounds(preparados,registros?.length||0);
    if(global.CCO_DEBUG_MAPA_BOUNDS)console.info("[INTERRUPÇÃO MAPA BOUNDS]",diagnostico);
    if(diagnostico.outliers.length)console.warn("[INTERRUPÇÃO MAPA BOUNDS] Coordenadas geograficamente distantes (mantidas no mapa):",diagnostico.outliers);
    if(contador)contador.textContent=`${preparados.validos.length.toLocaleString("pt-BR")} georreferenciadas • ${preparados.invalidos.length.toLocaleString("pt-BR")} sem coordenada • ${preparados.foraArea.length.toLocaleString("pt-BR")} fora da área`;
    if(!mapa||!estado.grupo)return preparados;
    estado.grupo.clearLayers();
    const categorias=new Set();
    preparados.validos.forEach(({registro,coordenada})=>{const categoria=chaveDefeito(registro.tipo_defeito),cor=CORES[categoria];categorias.add(categoria);const icone=global.L.divIcon({className:"interrupcao-map-marker-wrap",html:`<span class="interrupcao-map-marker" style="--marker-color:${cor}"></span>`,iconSize:[18,18],iconAnchor:[9,9],popupAnchor:[0,-10]});global.L.marker([coordenada.latitude,coordenada.longitude],{icon:icone,title:limparTexto(registro.tipo_defeito)||"Ocorrência"}).bindTooltip(tooltip(registro),{direction:"top",offset:[0,-8],opacity:.96}).bindPopup(popup(registro),{maxWidth:300,autoPanPadding:[24,24]}).addTo(estado.grupo);});
    atualizarLegenda(categorias);
    if(vazio)vazio.hidden=preparados.validos.length>0;
    requestAnimationFrame(()=>{mapa.invalidateSize(false);if(preparados.validos.length===1){const {latitude,longitude}=preparados.validos[0].coordenada;mapa.setView([latitude,longitude],15);}else if(preparados.validos.length>1){const pontos=preparados.validos.map(({coordenada})=>[coordenada.latitude,coordenada.longitude]),limites=global.L.latLngBounds(pontos);if(limites.isValid())mapa.fitBounds(limites,{padding:[30,30],maxZoom:15});}else mapa.setView([0,0],2);});
    return preparados;
  }
  const api=Object.freeze({AREA_OPERACIONAL,parseLatLong,prepararRegistrosMapa,coordenadaNaAreaOperacional,limitarAreaOperacional,calcularDiagnosticoBounds,renderizarMapaOcorrencias});
  global.InterrupcaoTrechoMapa=api;global.renderizarMapaOcorrencias=renderizarMapaOcorrencias;
  if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
