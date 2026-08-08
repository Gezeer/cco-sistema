(function criarCacheCCO(global) {
  "use strict";

  const memoria = new Map();
  const pendentes = new Map();
  const prefixo = "cco:v2:";

  function agora() { return Date.now(); }
  function chave(namespace, partes) {
    return `${prefixo}${namespace}:${(partes || []).map(valor => String(valor ?? "")).join(":")}`;
  }
  function lerEntrada(chaveCache) {
    const local = memoria.get(chaveCache);
    if (local) return local;
    try {
      const persistido = JSON.parse(sessionStorage.getItem(chaveCache) || "null");
      if (persistido) memoria.set(chaveCache, persistido);
      return persistido;
    } catch (_) { return null; }
  }
  function get(chaveCache) {
    const entrada = lerEntrada(chaveCache);
    if (!entrada) return undefined;
    if (entrada.expiraEm <= agora()) { remove(chaveCache); return undefined; }
    return entrada.valor;
  }
  function set(chaveCache, valor, ttlMs = 300000) {
    const entrada = { valor, expiraEm: agora() + ttlMs };
    memoria.set(chaveCache, entrada);
    try { sessionStorage.setItem(chaveCache, JSON.stringify(entrada)); } catch (_) {}
    return valor;
  }
  function remove(chaveCache) {
    memoria.delete(chaveCache);
    pendentes.delete(chaveCache);
    try { sessionStorage.removeItem(chaveCache); } catch (_) {}
  }
  function invalidar(namespace = "") {
    const inicio = `${prefixo}${namespace}`;
    [...memoria.keys()].filter(item => item.startsWith(inicio)).forEach(remove);
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const item = sessionStorage.key(i);
        if (item?.startsWith(inicio)) sessionStorage.removeItem(item);
      }
    } catch (_) {}
  }
  async function lembrar(chaveCache, produtor, ttlMs) {
    const existente = get(chaveCache);
    if (existente !== undefined) return existente;
    if (pendentes.has(chaveCache)) return pendentes.get(chaveCache);
    const promessa = Promise.resolve().then(produtor).then(valor => set(chaveCache, valor, ttlMs));
    pendentes.set(chaveCache, promessa);
    try { return await promessa; } finally { pendentes.delete(chaveCache); }
  }

  global.CCOCache = Object.freeze({ chave, get, set, remove, invalidar, lembrar });

  const contextos=new Map(),inicializacoes=new Map(),listeners=new WeakMap(),TTL_PAGINA=5*60*1000;
  function normalizarContexto(contexto={}){return{pagina:String(contexto.pagina||global.CCO_PAGE||""),servico:String(contexto.servico||""),ano:String(contexto.ano||""),mes:String(contexto.mes||""),dia:String(contexto.dia||""),importacaoId:String(contexto.importacaoId||contexto.importacao_id||""),token:contexto.token||0};}
  function chavePagina(contexto){const c=normalizarContexto(contexto);return[c.pagina,c.servico,c.ano,c.mes,c.dia,c.importacaoId].join("|");}
  function dados(contexto,produtor,ttlMs=TTL_PAGINA){return lembrar(chave("page-data",[chavePagina(contexto)]),produtor,ttlMs);}
  function definirContexto(pagina,alteracoes={}){const nome=String(pagina||global.CCO_PAGE||"").toLowerCase(),anterior=contextos.get(nome)||normalizarContexto({pagina:nome}),proximo=Object.freeze(normalizarContexto({...anterior,...alteracoes,pagina:nome}));contextos.set(nome,proximo);return proximo;}
  function obterContexto(pagina=global.CCO_PAGE){return contextos.get(String(pagina||"").toLowerCase())||null;}
  function inicializar(pagina,produtor){const nome=String(pagina||global.CCO_PAGE||"").toUpperCase(),globalKey=`__CCO_${nome}_INIT_PROMISE__`;if(global[globalKey])return global[globalKey];if(inicializacoes.has(nome))return inicializacoes.get(nome);const promessa=Promise.resolve().then(produtor).catch(error=>{inicializacoes.delete(nome);global[globalKey]=null;throw error;});inicializacoes.set(nome,promessa);global[globalKey]=promessa;return promessa;}
  function ouvirUmaVez(chaveListener,alvo,tipo,handler,opcoes){if(!alvo?.addEventListener)return false;let registros=listeners.get(alvo);if(!registros){registros=new Set();listeners.set(alvo,registros);}const assinatura=`${tipo}|${chaveListener}`;if(registros.has(assinatura))return false;registros.add(assinatura);alvo.addEventListener(tipo,handler,opcoes);return true;}
  function invalidarDadosPagina(pagina=""){invalidar(`page-data:${pagina}`);}
  global.CCOPageDataCache=Object.freeze({chave:chavePagina,obter:dados,invalidar:invalidarDadosPagina,TTL:TTL_PAGINA});
  global.CCOPageContext=Object.freeze({definir:definirContexto,obter:obterContexto});
  global.CCOPageRuntime=Object.freeze({inicializar,ouvirUmaVez});
})(window);
