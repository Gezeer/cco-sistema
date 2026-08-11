/* CCO | Cliente único do novo Supabase principal. */
(function iniciarSupabaseCCO() {
  "use strict";

  if (window.CCOSupabase?.getClient?.()) {
    return;
  }

  const configuracao = window.CCO_SUPABASE_CONFIG || {};
  const url = String(configuracao.url || "").trim();
  const anonKey = String(configuracao.anonKey || "").trim();
  const projectRef = String(configuracao.projectRef || url.match(/^https:\/\/([^.]+)\./)?.[1] || "").trim();
  const chavePrivada = (() => {
    if (/service[_-]?role/i.test(anonKey)) return true;
    if (!/^eyJ[^.]*\.[^.]*\.[^.]*$/.test(anonKey)) return false;
    try { return /service_role/i.test(atob(anonKey.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); }
    catch (_) { return false; }
  })();
  const urlValida = /^https:\/\/[a-z0-9-]+\.(supabase\.co|supabase\.in)$/i.test(url);

  if (!urlValida || anonKey.length < 20 || chavePrivada) {
    console.error("Supabase não configurado. Verifique js/config.js.");
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Biblioteca oficial do Supabase não foi carregada.");
    return;
  }

  function limparCachesConexaoUmaVez() {
    const marcador=`cco_conexao_cache_limpo:${projectRef || "projeto"}:v1`;
    try {
      if(localStorage.getItem(marcador)==="1")return false;
      [localStorage,sessionStorage].forEach(storage=>{
        const remover=[];
        for(let indice=0;indice<storage.length;indice+=1){
          const chave=storage.key(indice)||"",normalizada=chave.toLowerCase();
          if(normalizada.startsWith("sb-")||normalizada.startsWith("cco_supabase")||normalizada==="cco_cache"||normalizada.startsWith("cco:v2:"))remover.push(chave);
        }
        remover.forEach(chave=>storage.removeItem(chave));
      });
      delete window.CCO_CACHE;
      localStorage.setItem(marcador,"1");
      console.info("[CCO] Cache de conexão antigo removido uma única vez.");
      return true;
    } catch(error) {
      console.error("[CCO] Falha ao limpar cache de conexão",error);
      return false;
    }
  }

  limparCachesConexaoUmaVez();

  const cliente = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        "x-cco-client": "web-20260720"
      }
    }
  });

  const exporAlias = nome => Object.defineProperty(window, nome, {
    configurable:false, enumerable:true, get:() => cliente,
    set:valor => { if (valor !== cliente) console.error(`Tentativa bloqueada de substituir o cliente Supabase global: ${nome}`); }
  });
  exporAlias("supabaseClient");
  exporAlias("banco");

  async function paginar(criarConsulta, { tamanhoPagina=1000, maximoPaginas=10000 } = {}) {
    const resultado=[];
    for(let pagina=0;pagina<maximoPaginas;pagina+=1){
      const inicio=pagina*tamanhoPagina;
      const {data,error}=await criarConsulta().range(inicio,inicio+tamanhoPagina-1);
      if(error)throw error;
      const lote=data||[];resultado.push(...lote);
      console.log("[PAGINAÇÃO]",{offset:inicio,quantidadeRetornada:lote.length,totalAcumulado:resultado.length});
      if(lote.length===0||lote.length<tamanhoPagina)return resultado;
    }
    throw new Error("Paginação interrompida por exceder o limite de segurança.");
  }
  async function exigirSessao({ redirecionar=true }={}) {
    const {data,error}=await cliente.auth.getUser();
    if(error||!data?.user){if(redirecionar)window.location.replace("login.html");return null;}
    return data.user;
  }
  async function obterPerfilAtual() {
    const usuario=await exigirSessao({redirecionar:false});if(!usuario)return null;
    const {data,error}=await cliente.from("perfis_usuario").select("usuario_id,nome,email,perfil,ativo").eq("usuario_id",usuario.id).maybeSingle();
    if(error)throw error;
    if(!data?.ativo)return null;
    return data;
  }

  window.CCOSupabase = Object.freeze({ getClient:() => cliente, paginar, exigirSessao, obterPerfilAtual, config:Object.freeze({url,projectRef}) });

  async function testarConexaoCCO() {
    console.log("Testando conexão...");
    const consulta='importacoes.select("id").limit(1)';
    const {data,error}=await window.supabaseClient.from("importacoes").select("id").limit(1);
    console.log({data,error});
    if(error)console.error("[CCO] Erro de banco",{codigo:error.code,status:error.status,mensagem:error.message,tabela:"importacoes",consulta});
    return !error;
  }

  async function testarTabelaCCO(tabela) {
    const consulta=`${tabela}.select("*").limit(1)`;
    try {
      const {data,error}=await window.supabaseClient.from(tabela).select("*").limit(1);
      if(error){console.error("[CCO] Erro de tabela",{codigo:error.code,status:error.status,mensagem:error.message,tabela,consulta});return{tabela,ok:false,error};}
      console.info(`✅ Tabela acessada: ${tabela}`,{registros:(data||[]).length});
      return{tabela,ok:true,data:data||[]};
    } catch(error) {
      console.error("[CCO] Exceção de tabela",{codigo:error?.code,status:error?.status,mensagem:error?.message||String(error),tabela,consulta});
      return{tabela,ok:false,error};
    }
  }

  async function diagnosticarSupabaseCCO() {
    console.info("✅ URL utilizada",url);
    const [sessao,usuario]=await Promise.all([window.supabaseClient.auth.getSession(),window.supabaseClient.auth.getUser()]);
    const usuarioAtual=usuario.data?.user||sessao.data?.session?.user||null;
    console.log("[CCO] Sessão",{ativa:Boolean(sessao.data?.session),error:sessao.error?{message:sessao.error.message,status:sessao.error.status,code:sessao.error.code}:null});
    console.log("[CCO] Usuário",{email:usuarioAtual?.email||null,uid:usuarioAtual?.id||null,error:usuario.error?{message:usuario.error.message,status:usuario.error.status,code:usuario.error.code}:null});
    console.info("✅ Usuário autenticado",usuarioAtual?.email||"nenhum");
    const conexao=await testarConexaoCCO();
    const tabelas=await Promise.all([
      testarTabelaCCO("importacoes"),testarTabelaCCO("operacoes"),
      testarTabelaCCO("painel_executivo"),testarTabelaCCO("dias_operacao"),
      testarTabelaCCO("perfis_usuario")
    ]);
    const {count,error:erroContagem}=await window.supabaseClient.from("importacoes").select("id",{count:"exact",head:true});
    if(erroContagem)console.error("[CCO] Erro de banco",{codigo:erroContagem.code,status:erroContagem.status,mensagem:erroContagem.message,tabela:"importacoes",consulta:'select("id", {count:"exact",head:true})'});
    console.info("✅ Projeto conectado",projectRef||url);
    console.info("✅ Banco respondeu",conexao);
    console.info("✅ Número de importações",count??0);
    return{url,projectRef,conexao,usuario:{email:usuarioAtual?.email||null,uid:usuarioAtual?.id||null},tabelas,numeroImportacoes:count??0};
  }

  window.testarConexaoCCO=testarConexaoCCO;
  window.diagnosticarSupabaseCCO=diagnosticarSupabaseCCO;
  if(window.CCO_DEBUG_BOOT===true||window.CCO_DEBUG_SUPABASE===true||window.sessionStorage?.getItem?.("cco_debug_boot")==="1")Promise.resolve().then(diagnosticarSupabaseCCO).catch(error=>console.error("Erro ao conectar ao Supabase",{codigo:error?.code,status:error?.status,mensagem:error?.message||String(error),tabela:null,consulta:"diagnosticarSupabaseCCO"}));

  window.testarConexaoSupabase = async function testarConexaoSupabase() {
    const resultado = { cliente:Boolean(window.supabaseClient),sessao:null,usuario:null,importacoes:null,erro:null };
    try {
      const sessao = await cliente.auth.getSession();
      resultado.sessao = Boolean(sessao.data?.session);
      const usuario = await cliente.auth.getUser();
      resultado.usuario = usuario.data?.user?.email || null;
      const consulta = await cliente.from("importacoes").select("id", { count:"exact",head:true });
      if (consulta.error) throw consulta.error;
      resultado.importacoes = consulta.count ?? 0;
    } catch (erro) {
      resultado.erro = erro?.message || String(erro);
    }
    console.table(resultado);
    return resultado;
  };

  console.info("Cliente do novo Supabase principal inicializado.");
})();
