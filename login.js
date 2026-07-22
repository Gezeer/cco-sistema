const EMAIL_ADMIN_CCO = "cco@local.com";

document.addEventListener("DOMContentLoaded", async () => {
  const usuarioSalvo = localStorage.getItem("ultimoUsuarioCCO");
  if (usuarioSalvo) {
    document.getElementById("usuario").value = usuarioSalvo;
    document.getElementById("lembrarUsuario").checked = true;
  }
  document.getElementById("usuario")?.addEventListener("keydown", acionarLoginComEnter);
  document.getElementById("senha")?.addEventListener("keydown", acionarLoginComEnter);

  const cliente = window.supabaseClient;
  const { data } = await cliente?.auth?.getSession?.() || {};
  if (data?.session?.user) {
    try { await concluirEntrada(cliente, data.session.user); }
    catch (falha) { console.error("Não foi possível restaurar a sessão:", falha); }
  }
});

function obterPerfil(usuario) {
  if (usuario === "admin") return "Administrador";
  if (usuario === "cco") return "Operador";
  if (usuario === "diretoria") return "Diretoria";
  return "Usuário";
}

async function entrar() {
  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const emailInformado = usuario === "cco" ? EMAIL_ADMIN_CCO : (usuario.includes("@") ? usuario : `${usuario}@local.com`);
  const emailNormalizado = String(emailInformado || "").trim().toLowerCase();
  const senhaNormalizada = String(document.getElementById("senha").value || "");
  const lembrar = document.getElementById("lembrarUsuario").checked;
  const erro = document.getElementById("erro");
  const botao = document.getElementById("botaoEntrar");
  erro.textContent = "";
  if (!emailNormalizado || !senhaNormalizada) { erro.textContent = "Informe usuário e senha."; return; }

  const cliente = window.supabaseClient;
  if (!cliente?.auth) { erro.textContent = "Cliente Supabase indisponível."; return; }
  if (botao) { botao.disabled = true; botao.textContent = "Entrando..."; }
  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email:emailNormalizado, password:senhaNormalizada });
    if (error) {
      console.error("[CCO] Falha real de autenticação:", { message:error.message, status:error.status, code:error.code });
      erro.textContent = traduzirErroAutenticacao(error);
      return;
    }
    const usuarioAutenticado=data?.user;
    if(!usuarioAutenticado)throw new Error("Supabase não retornou o usuário autenticado.");
    if (lembrar) localStorage.setItem("ultimoUsuarioCCO", usuario);
    else localStorage.removeItem("ultimoUsuarioCCO");
    await concluirEntrada(window.supabaseClient, usuarioAutenticado);
  } catch (falha) {
    console.error("[CCO] Falha inesperada após autenticação:", falha);
    erro.textContent = falha?.message === "Supabase não retornou o usuário autenticado."
      ? falha.message : "Não foi possível conectar ao Supabase.";
  } finally {
    if (botao) { botao.disabled = false; botao.textContent = "Acessar painel"; }
  }
}

async function concluirEntrada(cliente, usuarioAuth) {
  const erro = document.getElementById("erro");
  const { data:perfilBanco, error:erroPerfil } = await window.supabaseClient.from("perfis_usuario")
    .select("usuario_id,nome,email,perfil,ativo").eq("usuario_id",usuarioAuth.id).maybeSingle();
  if (erroPerfil) {
    console.error("[CCO] Autenticação concluída; falha ao carregar perfil:",{message:erroPerfil.message,status:erroPerfil.status,code:erroPerfil.code});
    erro.textContent = "Login realizado, mas não foi possível carregar o perfil.";
    return false;
  }
  if (!perfilBanco) {
    console.warn("[CCO] Usuário autenticado sem perfil.",{usuario_id:usuarioAuth.id});
    erro.textContent = "Usuário autenticado, mas sem perfil no sistema.";
    return false;
  }
  if (perfilBanco.ativo !== true) {
    await cliente.auth.signOut();
    erro.textContent = "Usuário desativado.";
    return false;
  }
  const nome = perfilBanco.nome || usuarioAuth.user_metadata?.nome || usuarioAuth.user_metadata?.name || usuarioAuth.email;
  const perfil = perfilBanco.perfil;
  localStorage.setItem("usuario_nome", nome || usuarioAuth.email);
  localStorage.setItem("usuario_perfil", perfil || "Usuário");
  localStorage.setItem("usuarioLogado", JSON.stringify({ id:usuarioAuth.id, usuario:nome, email:usuarioAuth.email, perfil }));
  window.location.replace("index.html");
  return true;
}

function acionarLoginComEnter(evento) {
  if (evento.key === "Enter") { evento.preventDefault(); entrar(); }
}

function traduzirErroAutenticacao(error) {
  const mensagem = String(error?.message || "").toLowerCase();
  if (mensagem.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (mensagem.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (mensagem.includes("fetch") || mensagem.includes("network") || mensagem.includes("failed to fetch")) return "Não foi possível conectar ao Supabase.";
  if (mensagem.includes("rate limit")) return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  return error?.message || "Falha de autenticação no Supabase.";
}

window.testarLoginCCO = async function testarLoginCCO(email, senha) {
  const resultado = await window.supabaseClient.auth.signInWithPassword({
    email:String(email || "").trim().toLowerCase(),
    password:String(senha || "")
  });
  console.log(resultado);
  return resultado;
};
