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
})(window);
