(function(global){
  "use strict";
  const DOMAINS=Object.freeze({OPERACAO:"OPERACAO",PAINEL:"PAINEL",KPI:"KPI",EXECUCAO:"EXECUCAO",INTERRUPCOES:"INTERRUPCOES",SINISTROS:"SINISTROS",IMPORTACOES:"IMPORTACOES"});
  const METRICS=Object.freeze({
    OPERACAO:new Set(["registros","peso_total","viagens_total","km_total","equipes"]),
    PAINEL:new Set(["acumulado","previsto","diferenca","percentual_execucao","valor_total"]),
    KPI:new Set(["velocidade_media","equipes","km_total","peso_total","viagens_total"]),
    EXECUCAO:new Set(["acumulado","previsto","diferenca","percentual_execucao"]),
    INTERRUPCOES:new Set(["ocorrencias","tipo_defeito","ra","veiculo","servico","socorros","tempo_medio_resposta"]),
    SINISTROS:new Set(["sinistros","proporcao_sinistros","ra","veiculo","servico"]),
    IMPORTACOES:new Set(["importacoes","operacoes_validas","rejeicoes","percentual_valido"])
  });
  function infer(text,services=[]){const t=String(text||"");if(/sinistr|acidente/.test(t))return DOMAINS.SINISTROS;if(/ocorrenc|interrup|defeito|socorro|veicul|motorista|tempo.*resposta/.test(t))return DOMAINS.INTERRUPCOES;if(/velocidade|kpi/.test(t))return DOMAINS.KPI;if(/importa|rejei|qualidade.*dados/.test(t))return DOMAINS.IMPORTACOES;if(/\bkm\b|quilometr|equipe|peso|viage/.test(t)&&!services.length)return DOMAINS.OPERACAO;if(/execu|previsto|acumulado|desempenho|percent|p\s*12/.test(t)||services.length)return DOMAINS.EXECUCAO;if(/financeir|valor/.test(t))return DOMAINS.PAINEL;return DOMAINS.OPERACAO;}
  function metric(domain,text,current){const t=String(text||"");if(domain===DOMAINS.SINISTROS)return /propor/.test(t)?"proporcao_sinistros":"sinistros";if(domain===DOMAINS.INTERRUPCOES){if(/defeito/.test(t))return"tipo_defeito";if(/socorro/.test(t))return"socorros";if(/tempo.*resposta/.test(t))return"tempo_medio_resposta";if(/veicul/.test(t))return"veiculo";return"ocorrencias";}if(/velocidade/.test(t))return"velocidade_media";if(/percent|desempenho|maior execucao|menor execucao/.test(t))return"percentual_execucao";if(/previsto/.test(t))return"previsto";if(/valor|financeir/.test(t))return"valor_total";if(/\bkm\b|quilometr/.test(t))return"km_total";if(/equipe/.test(t))return"equipes";return current||"acumulado";}
  global.CCOAnalyticsDomains=Object.freeze({DOMAINS,METRICS,infer,metric,supports:(d,m)=>METRICS[d]?.has(m)===true});
})(window);
