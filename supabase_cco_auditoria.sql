-- CCO | Auditoria pós-importação
-- Substitua <UUID> pelo id exibido no bloco de auditoria do Painel Geral.

select aba,count(*) as total
from public.planilha_linhas
where importacao_id='<UUID>'::uuid
group by aba order by aba;

select servico,count(*) as total,min(data_operacao) as primeira_data,max(data_operacao) as ultima_data
from public.operacoes
where importacao_id='<UUID>'::uuid
group by servico order by servico;

select servico,count(distinct data_operacao) as dias
from public.operacoes
where importacao_id='<UUID>'::uuid
group by servico order by servico;

select count(*) as registros_p12,count(executado) as p12_com_executado,sum(executado) as soma_executado
from public.operacoes
where importacao_id='<UUID>'::uuid and servico='P12';

select count(*) as total_rd,count(distinct rd) as rd_distintos,count(*) filter(where rd is null or btrim(rd)='') as rd_vazios
from public.operacoes where importacao_id='<UUID>'::uuid;

select * from public.dias_operacao where importacao_id='<UUID>'::uuid order by ano,mes;
select * from public.v_auditoria_importacoes where id='<UUID>'::uuid;
select * from public.v_catalogo_periodos order by ano desc,mes desc;
select codigo,mensagem,aba,numero_linha,dados from public.importacao_erros where importacao_id='<UUID>'::uuid order by aba,numero_linha;
