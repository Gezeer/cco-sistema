import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const DEFAULT_MODEL="gpt-5.4-nano",TIMEOUT_MS=8000,CACHE_TTL_MS=5*60*1000;
const cache=new Map<string,{expires:number,value:unknown}>();
const allowedIntents=new Set(["resumo_geral","resumo_diretoria","melhor_periodo","pior_periodo","consultar_servico","consultar_total","analisar_periodo","comparar_periodos","evolucao_mensal","ranking","ranking_financeiro","ranking_servicos","ranking_ra","ranking_turnos","consultar_dia","consultar_valor","consultar_velocidade","consultar_equipes","consultar_p12","qualidade_dados","importacoes","erros","anomalias","tendencia","pergunta_livre","metrica_ambigua","operacao_invalida"]);
const SYSTEM_PROMPT=`Você é o CCO Analytics AI.
Você não calcula indicadores do zero. Use somente os números existentes no Evidence Package.
Nunca invente números, datas, percentuais, rankings ou causas. Se a informação não estiver disponível, diga que os dados são insuficientes.
Não atribua culpa. Não transforme correlação em causalidade.
Diferencie fato, tendência, anomalia e hipótese. Hipóteses devem ser explicitamente rotuladas.
Toda resposta deve ser fundamentada no evidenceId recebido. numbersUsed deve conter cada número quantitativo citado nos textos, sem incluir números que não foram citados.`;
const OUTPUT_SCHEMA={type:"object",additionalProperties:false,properties:{evidenceId:{type:"string"},summary:{type:"string"},findings:{type:"array",items:{type:"object",additionalProperties:false,properties:{type:{type:"string",enum:["fact","trend","anomaly","hypothesis"]},text:{type:"string"},evidenceKeys:{type:"array",items:{type:"string"}}},required:["type","text","evidenceKeys"]}},attentionPoints:{type:"array",items:{type:"string"}},conclusion:{type:"string"},recommendation:{type:"string"},numbersUsed:{type:"array",items:{type:"number"}}},required:["evidenceId","summary","findings","attentionPoints","conclusion","recommendation","numbersUsed"]};

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  const fallback=(reason:string,status=200)=>respond({mode:"deterministic",fallbackUsed:true,reason},status);
  try{
    const authorization=req.headers.get("Authorization")||"";
    if(!authorization.startsWith("Bearer "))return fallback("authentication_required",401);
    const url=Deno.env.get("SUPABASE_URL")||"",anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
    const supabase=createClient(url,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const{data:{user},error}=await supabase.auth.getUser();if(error||!user)return fallback("invalid_session",401);
    const body=await req.json(),question=normalizeText(body?.question||body?.pergunta,1600),plan=body?.plan||body?.planoConsulta||{},evidence=sanitizeEvidence(body?.evidence),responseMode=normalizeText(body?.responseMode||"simple",32);
    if(!question||!evidence?.evidenceId||JSON.stringify(evidence).length>60000)return fallback("invalid_request",400);
    if(!allowedIntents.has(plan.intent||plan.intencao))return fallback("invalid_intent",400);
    if(Deno.env.get("CCO_LLM_ENABLED")!=="true")return fallback("llm_disabled");
    const apiKey=Deno.env.get("OPENAI_API_KEY")||"";if(!apiKey)return fallback("missing_api_key");
    const model=normalizeText(Deno.env.get("OPENAI_MODEL")||DEFAULT_MODEL,100),cacheKey=[evidence.datasetVersion,evidence.digest,normalizeQuestion(question),responseMode,model].join("|");
    const cached=cache.get(cacheKey);if(cached&&cached.expires>Date.now())return respond({...cached.value as object,cacheHit:true});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT_MS),started=performance.now();let apiResponse:Response;
    try{apiResponse=await fetch("https://api.openai.com/v1/responses",{method:"POST",signal:controller.signal,headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,input:[{role:"system",content:SYSTEM_PROMPT},{role:"user",content:JSON.stringify({question,responseMode,intent:plan.intent||plan.intencao,domain:plan.domain,periods:plan.periods,filters:plan.filters,metrics:plan.metrics,evidence})}],text:{format:{type:"json_schema",name:"cco_analytics_response",strict:true,schema:OUTPUT_SCHEMA}},max_output_tokens:1200})});}catch(error){return fallback(error instanceof DOMException&&error.name==="AbortError"?"timeout":"network_error");}finally{clearTimeout(timer);}
    if(!apiResponse.ok)return fallback(apiResponse.status===429?"rate_limited":apiResponse.status>=500?"openai_server_error":"openai_http_error");
    let raw:Record<string,unknown>;try{raw=await apiResponse.json();}catch{return fallback("invalid_openai_json");}
    const outputText=extractOutputText(raw);if(!outputText)return fallback("empty_openai_response");
    let structured:Record<string,unknown>;try{structured=JSON.parse(outputText);}catch{return fallback("invalid_structured_output");}
    if(structured.evidenceId!==evidence.evidenceId)return fallback("evidence_id_mismatch");
    const usage=normalizeUsage(raw.usage),value={mode:"openai",fallbackUsed:false,cacheHit:false,model,latencyMs:Math.round(performance.now()-started),structured,evidenceId:evidence.evidenceId,usage};cache.set(cacheKey,{expires:Date.now()+CACHE_TTL_MS,value});
    if(Deno.env.get("CCO_LLM_DEBUG")==="true")console.log("[CCO AI LLM USAGE]",{model,latencyMs:value.latencyMs,inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens,fallbackUsed:false});
    return respond(value);
  }catch{return fallback("internal_error");}
});

function normalizeText(value:unknown,max:number){return String(value||"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function normalizeQuestion(value:string){return normalizeText(value,1600).toLocaleLowerCase("pt-BR");}
function sanitizeEvidence(value:any){if(!value||typeof value!=="object")return null;return{evidenceId:normalizeText(value.evidenceId,100),datasetVersion:normalizeText(value.datasetVersion,500),digest:normalizeText(value.digest,100),intent:normalizeText(value.intent,80),domain:normalizeText(value.domain,40),periods:Array.isArray(value.periods)?value.periods.slice(0,36):[],filters:value.filters&&typeof value.filters==="object"?value.filters:{},metrics:Array.isArray(value.metrics)?value.metrics.slice(0,20):[],values:value.values&&typeof value.values==="object"?value.values:{},insights:Array.isArray(value.insights)?value.insights.slice(0,20):[],limitations:Array.isArray(value.limitations)?value.limitations.slice(0,20).map((x:unknown)=>normalizeText(x,500)):[]};}
function extractOutputText(raw:any){if(typeof raw?.output_text==="string")return raw.output_text;for(const item of raw?.output||[])for(const content of item?.content||[])if(content?.type==="output_text"&&typeof content.text==="string")return content.text;return"";}
function normalizeUsage(usage:any){const inputTokens=Number(usage?.input_tokens)||0,outputTokens=Number(usage?.output_tokens)||0,totalTokens=Number(usage?.total_tokens)||inputTokens+outputTokens;return{inputTokens,outputTokens,totalTokens};}
function respond(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});}
