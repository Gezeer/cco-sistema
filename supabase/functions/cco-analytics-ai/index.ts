import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const authorization=req.headers.get("Authorization")||"";
    if(!authorization.startsWith("Bearer "))return resposta({erro:"Sessão obrigatória."},401);
    const url=Deno.env.get("SUPABASE_URL")||"",anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
    const supabase=createClient(url,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const{data:{user},error}=await supabase.auth.getUser();
    if(error||!user)return resposta({erro:"Sessão inválida."},401);
    const corpo=await req.json(),pergunta=String(corpo?.pergunta||"").slice(0,1600),plano=corpo?.planoConsulta||{},dados=corpo?.dadosAgregados||{};
    if(!pergunta)return resposta({erro:"Pergunta obrigatória."},400);
    const permitidas=new Set(["resumo_geral","resumo_diretoria","melhor_periodo","pior_periodo","consultar_servico","comparar_periodos","evolucao_mensal","ranking_financeiro","ranking_servicos","ranking_ra","ranking_turnos","consultar_dia","consultar_valor","consultar_velocidade","consultar_equipes","consultar_p12","qualidade_dados","importacoes","erros","anomalias","tendencia","pergunta_livre"]);
    if(!permitidas.has(plano.intencao))return resposta({erro:"Intenção não permitida."},400);
    // Sem provedor externo configurado, preserva o fallback estruturado recebido do frontend.
    return resposta({resumo:dados.resumo||"Análise automática baseada nos dados do CCO.",destaques:Array.isArray(dados.destaques)?dados.destaques:[],tabela:dados.tabela||null,grafico:null,fontes:["Dados agregados consultados sob RLS"],alertas:[],modo:"deterministico"});
  }catch(error){return resposta({erro:error instanceof Error?error.message:"Erro interno."},500);}
});

function resposta(corpo:unknown,status=200){return new Response(JSON.stringify(corpo),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});}
