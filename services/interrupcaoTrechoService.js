(function (global) {
  "use strict";

  const BUILD = "20260810-interrupcao-trecho-v1";
  const TABELA = "interrupcoes_trecho";
  const TABELA_IMPORTACOES = "interrupcoes_importacoes";
  const LOTE = 200;
  const INVALIDOS = new Set(["", "XXX", "RG", "NAO INFORMADO", "NÃO INFORMADO"]);
  const MESES = Object.freeze({ janeiro:1, fevereiro:2, marco:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12 });
  const ALIASES = Object.freeze({
    mes:["mes"], data_ocorrencia:["data","data_ocorrencia"], servico:["servico"], veiculo:["veiculo"],
    rd:["n_da_rd","n_rd","numero_da_rd","numero_rd","rd"], mat_motorista:["mat_motorista","matricula_motorista","motorista"],
    hora_saida_garagem:["hora_saida_da_garagem","saida_da_garagem","hora_saida_garagem"], ra:["ra","regiao_administrativa"],
    lat_long:["lat_long","latitude_longitude"], hora_solicitacao:["hr_solicitacao","hora_solicitacao","solicitacao"],
    tipo_defeito:["tipo_de_defeito","tipo_defeito","defeito"], atendimento:["atendimento","empresa_atendimento"],
    veiculo_atendimento:["veiculo_atendimento"], local_saida_socorro:["local_de_saida_do_socorro","local_saida_socorro"],
    hora_deslocamento_socorro:["hr_desl_socorro","hora_deslocamento_socorro","deslocamento_socorro"],
    mat_socorrista:["mat_socorrista","matricula_socorrista"], termino_socorro:["termino_socorro"],
    acionamento_sesmt:["acionamento_de_sesmt","acionamento_sesmt"], acionamento_perito:["acionamento_de_perito","acionamento_perito"],
    perimetro:["perimetro"], descricao:["descricao"]
  });
  const CAMPOS = Object.keys(ALIASES);

  const limpar = valor => String(valor ?? "").replace(/[\uFEFF\u200B-\u200D]/g, "").replace(/\u00a0/g, " ").trim();
  function normalizarCabecalho(valor) { return limpar(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[º°]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
  function normalizarTexto(valor) { const texto=limpar(valor); return INVALIDOS.has(texto.toUpperCase()) ? null : texto; }
  function normalizarData(valor) {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) return `${valor.getFullYear()}-${String(valor.getMonth()+1).padStart(2,"0")}-${String(valor.getDate()).padStart(2,"0")}`;
    if (typeof valor === "number" && valor > 0) { const d=global.XLSX?.SSF?.parse_date_code?.(valor); if(d?.y) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; }
    const v=limpar(valor); let m=v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/); if(m)return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    m=v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})(?:\D|$)/); if(m){const a=m[3].length===2?2000+Number(m[3]):Number(m[3]);return `${a}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;} return null;
  }
  function normalizarHora(valor) {
    if (typeof valor === "number" && valor >= 0 && valor < 1) { const segundos=Math.round(valor*86400)%86400; return `${String(Math.floor(segundos/3600)).padStart(2,"0")}:${String(Math.floor((segundos%3600)/60)).padStart(2,"0")}:${String(segundos%60).padStart(2,"0")}`; }
    const v=limpar(valor); if(INVALIDOS.has(v.toUpperCase()))return null; const m=v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/); if(!m||Number(m[1])>23||Number(m[2])>59||Number(m[3]||0)>59)return null; return `${m[1].padStart(2,"0")}:${m[2]}:${String(m[3]||"00").padStart(2,"0")}`;
  }
  function valorPorAlias(linha,campo){for(const alias of ALIASES[campo])if(Object.prototype.hasOwnProperty.call(linha,alias)&&limpar(linha[alias])!=="")return linha[alias];return null;}
  function gerarChaveBase(registro){return [registro.rd,registro.data_ocorrencia,registro.veiculo,registro.hora_solicitacao].map(v=>limpar(v).toUpperCase().replace(/\s+/g," ")||"SEM-VALOR").join("|");}
  function mapearLinha(original, numeroLinha=0) {
    const linha=Object.fromEntries(Object.entries(original||{}).map(([k,v])=>[normalizarCabecalho(k),v]));
    const r={}; CAMPOS.forEach(c=>r[c]=normalizarTexto(valorPorAlias(linha,c)));
    r.data_ocorrencia=normalizarData(valorPorAlias(linha,"data_ocorrencia"));
    ["hora_saida_garagem","hora_solicitacao","hora_deslocamento_socorro","termino_socorro"].forEach(c=>r[c]=normalizarHora(valorPorAlias(linha,c)));
    const mesBruto=normalizarCabecalho(valorPorAlias(linha,"mes")); r.mes=MESES[mesBruto]||Number(mesBruto)||Number(r.data_ocorrencia?.slice(5,7))||null;
    r.__linha=numeroLinha; r.chave_registro=gerarChaveBase(r); return r;
  }
  function validarEstrutura(cabecalhos){const n=cabecalhos.map(normalizarCabecalho),faltantes=["data_ocorrencia","veiculo","hora_solicitacao"].filter(c=>!ALIASES[c].some(a=>n.includes(a)));return {valida:!faltantes.length,faltantes};}
  function prepararRegistros(linhas) {
    const rejeitadas=[],validas=[]; (linhas||[]).forEach((linha,i)=>{const r=mapearLinha(linha,i+2);if(!r.data_ocorrencia||!r.veiculo)rejeitadas.push({linha:i+2,motivo:"Data ou veículo inválidos."});else validas.push(r);});
    const grupos=new Map(); validas.forEach(r=>{const lista=grupos.get(r.chave_registro)||[];lista.push(r);grupos.set(r.chave_registro,lista);});
    grupos.forEach(lista=>lista.forEach((r,i)=>{if(lista.length>1)r.chave_registro=`${r.chave_registro}|${String(i+1).padStart(3,"0")}`;delete r.__linha;})); return {registros:validas,rejeitadas};
  }
  function assinatura(r){return CAMPOS.concat(["chave_registro"]).map(c=>`${c}:${r[c]??""}`).join("\u001f");}
  function diferenciar(registros, existentes=[]) { const mapa=new Map(existentes.map(r=>[r.chave_registro,r])),novos=[],atualizados=[],ignorados=[];registros.forEach(r=>{const velho=mapa.get(r.chave_registro);if(!velho)novos.push(r);else if(assinatura(r)!==assinatura(velho))atualizados.push(r);else ignorados.push(r);});return {novos,atualizados,ignorados}; }
  function minutosResposta(r){if(!r.hora_solicitacao||!r.hora_deslocamento_socorro)return null;const min=h=>Number(h.slice(0,2))*60+Number(h.slice(3,5));let d=min(r.hora_deslocamento_socorro)-min(r.hora_solicitacao);if(d<0)d+=1440;return d;}
  function consolidar(registros){const unicos=c=>new Set(registros.map(r=>r[c]).filter(Boolean)).size,contar=c=>registros.reduce((m,r)=>(r[c]&&(m[r[c]]=(m[r[c]]||0)+1),m),{}),top=c=>Object.entries(contar(c)).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—",tempos=registros.map(minutosResposta).filter(Number.isFinite),aplicaveis=registros.filter(r=>r.atendimento||r.hora_deslocamento_socorro||r.termino_socorro),concluidos=aplicaveis.filter(r=>Boolean(r.termino_socorro));return {total:registros.length,veiculos:unicos("veiculo"),motoristas:unicos("mat_motorista"),principalDefeito:top("tipo_defeito"),tempoMedio:tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length:null,concluidos:aplicaveis.length?concluidos.length/aplicaveis.length*100:0,contagens:{datas:contar("data_ocorrencia"),defeitos:contar("tipo_defeito"),veiculos:contar("veiculo"),ras:contar("ra"),servicos:contar("servico"),atendimentos:contar("atendimento"),motoristas:contar("mat_motorista")}};}
  const db=()=>global.CCOSupabase?.getClient?.()||global.supabaseClient;
  async function consultar(filtros={}){const chave=global.CCOCache?.chave?.("interrupcao",[filtros.ano,filtros.mes,filtros.servico,filtros.defeito,filtros.ra,filtros.perimetro,filtros.pesquisa])||JSON.stringify(filtros);const produtor=async()=>{const criar=()=>{let q=db().from(TABELA).select("*").order("data_ocorrencia",{ascending:false}).order("id",{ascending:false});if(filtros.ano)q=q.gte("data_ocorrencia",`${filtros.ano}-01-01`).lt("data_ocorrencia",`${Number(filtros.ano)+1}-01-01`);if(filtros.mes){const a=Number(filtros.ano)||new Date().getFullYear(),m=Number(filtros.mes),fim=m===12?`${a+1}-01-01`:`${a}-${String(m+1).padStart(2,"0")}-01`;q=q.gte("data_ocorrencia",`${a}-${String(m).padStart(2,"0")}-01`).lt("data_ocorrencia",fim);}for(const [campo,chaveFiltro] of [["servico","servico"],["tipo_defeito","defeito"],["ra","ra"],["perimetro","perimetro"]])if(filtros[chaveFiltro])q=q.eq(campo,filtros[chaveFiltro]);return q;};const dados=global.CCOSupabase?.paginar?await global.CCOSupabase.paginar(criar,{tamanhoPagina:1000}):(await criar()).data||[];const termo=limpar(filtros.pesquisa).toLowerCase();return termo?dados.filter(r=>[r.rd,r.veiculo,r.mat_motorista,r.descricao].some(v=>limpar(v).toLowerCase().includes(termo))):dados;};return global.CCOCache?.lembrar?global.CCOCache.lembrar(chave,produtor,300000):produtor();}
  async function metadados(){const [{data,error},{count,error:erroCount}]=await Promise.all([db().from(TABELA_IMPORTACOES).select("*").eq("status","concluida").order("criado_em",{ascending:false}).limit(1).maybeSingle(),db().from(TABELA).select("id",{count:"exact",head:true})]);if(error)throw error;if(erroCount)throw erroCount;return {ultima:data||null,total:count||0};}
  async function hashArquivo(arquivo){if(!global.crypto?.subtle)return `${arquivo.name}:${arquivo.size}:${arquivo.lastModified}`;const digest=await crypto.subtle.digest("SHA-256",await arquivo.arrayBuffer());return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");}
  async function importar(arquivo,{progresso=()=>{}}={}){const inicio=performance.now(),usuario=await global.CCOSupabase.exigirSessao(),perfil=await global.CCOSupabase.obterPerfilAtual();if(!usuario||!perfil?.ativo||!["administrador","operador"].includes(perfil.perfil))throw new Error("Importação permitida somente para Administrador ou Operador ativo.");progresso("Preparando arquivo",0,1);const wb=global.XLSX.read(await arquivo.arrayBuffer(),{type:"array",cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],matriz=global.XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});let cab=0,pontos=-1;matriz.slice(0,30).forEach((l,i)=>{const p=(l||[]).map(normalizarCabecalho).filter(h=>Object.values(ALIASES).flat().includes(h)).length;if(p>pontos){cab=i;pontos=p;}});const headers=matriz[cab]||[],estrutura=validarEstrutura(headers);if(!estrutura.valida)throw new Error(`Colunas obrigatórias ausentes: ${estrutura.faltantes.join(", ")}`);const linhas=global.XLSX.utils.sheet_to_json(ws,{range:cab,defval:null,raw:true});progresso("Validando linhas",linhas.length,linhas.length);const preparados=prepararRegistros(linhas),id=global.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,hash=await hashArquivo(arquivo),baseImportacao={id,nome_arquivo:arquivo.name,hash_arquivo:hash,total_linhas:linhas.length,linhas_inseridas:0,linhas_atualizadas:0,linhas_ignoradas:0,linhas_rejeitadas:preparados.rejeitadas.length,usuario_id:usuario.id,status:"processando"};const {error:erroInicio}=await db().from(TABELA_IMPORTACOES).insert(baseImportacao);if(erroInicio)throw erroInicio;try{let existentes=[];progresso("Comparando registros",0,preparados.registros.length);for(let i=0;i<preparados.registros.length;i+=LOTE){const keys=preparados.registros.slice(i,i+LOTE).map(r=>r.chave_registro),{data,error}=await db().from(TABELA).select("*").in("chave_registro",keys);if(error)throw error;existentes.push(...(data||[]));progresso("Comparando registros",Math.min(i+LOTE,preparados.registros.length),preparados.registros.length);}const dif=diferenciar(preparados.registros,existentes),salvar=dif.novos.concat(dif.atualizados).map(r=>({...r,importacao_id:id}));for(let i=0;i<salvar.length;i+=LOTE){const {error}=await db().from(TABELA).upsert(salvar.slice(i,i+LOTE),{onConflict:"chave_registro"});if(error)throw error;progresso("Salvando",Math.min(i+LOTE,salvar.length),salvar.length);}const relatorio={...baseImportacao,linhas_inseridas:dif.novos.length,linhas_atualizadas:dif.atualizados.length,linhas_ignoradas:dif.ignorados.length,status:"concluida"};const {error}=await db().from(TABELA_IMPORTACOES).update(relatorio).eq("id",id);if(error)throw error;global.CCOCache?.invalidar?.("interrupcao");progresso("Finalizado",linhas.length,linhas.length);return {...relatorio,rejeitadas:preparados.rejeitadas,tempo_ms:performance.now()-inicio};}catch(error){await db().from(TABELA_IMPORTACOES).update({status:"falhou"}).eq("id",id);throw error;}}
  global.InterrupcaoTrechoService=Object.freeze({BUILD,TABELA,TABELA_IMPORTACOES,normalizarCabecalho,normalizarData,normalizarHora,mapearLinha,prepararRegistros,gerarChaveBase,diferenciar,minutosResposta,consolidar,consultar,metadados,importar});
  if(typeof module!=="undefined")module.exports=global.InterrupcaoTrechoService;
})(typeof window!=="undefined"?window:globalThis);
