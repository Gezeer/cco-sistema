-- CCO Analytics AI: views agregadas somente leitura e índices de consulta.
begin;

create index if not exists operacoes_analytics_importacao_idx on public.operacoes(importacao_id);
create index if not exists operacoes_analytics_servico_idx on public.operacoes(importacao_id,servico);
create index if not exists operacoes_analytics_data_idx on public.operacoes(importacao_id,data_operacao);
create index if not exists operacoes_analytics_ra_idx on public.operacoes(importacao_id,ra);
create index if not exists operacoes_analytics_turno_idx on public.operacoes(importacao_id,turno);
create index if not exists painel_analytics_periodo_servico_idx on public.painel_executivo(importacao_id,ano,mes,servico);
create index if not exists importacao_erros_analytics_idx on public.importacao_erros(importacao_id);

drop view if exists public.v_analytics_qualidade;
drop view if exists public.v_analytics_operacional;
drop view if exists public.v_analytics_mensal;

create view public.v_analytics_mensal with (security_invoker=true) as
select
  i.ano,
  i.mes,
  i.id as importacao_id,
  p.servico,
  p.medicao,
  p.acumulado,
  p.previsto,
  case when coalesce(p.previsto,0)>0 then p.acumulado/p.previsto*100 else null end as percentual_execucao,
  p.dias_acumulados,
  coalesce(p.total_dias_mes,d.total_dias) as total_dias_mes,
  p.valor_unitario,
  coalesce(p.valor_total,p.acumulado*p.valor_unitario) as valor_total,
  case
    when p.acumulado is null then 'Sem dados'
    when coalesce(p.previsto,0)>0 and p.acumulado<p.previsto then 'Em atenção'
    else 'Com dados'
  end as status
from public.importacoes i
join public.painel_executivo p on p.importacao_id=i.id
left join public.dias_operacao d on d.importacao_id=i.id and d.ano=i.ano and d.mes=i.mes
where i.ativa=true and i.status in ('concluida','concluida_com_avisos');

create view public.v_analytics_operacional with (security_invoker=true) as
select
  i.ano,
  i.mes,
  i.id as importacao_id,
  o.servico,
  coalesce(nullif(trim(o.ra),''),'Não informado') as ra,
  coalesce(nullif(trim(o.turno),''),'Não informado') as turno,
  o.data_operacao,
  count(*)::bigint as registros,
  sum(coalesce(o.peso_t,0)) as peso_total,
  sum(coalesce(o.viagens,0)) as viagens_total,
  sum(coalesce(o.km_total,0)) as km_total,
  sum(coalesce(o.qtd_equipe,o.equipe,0)) as equipes,
  sum(coalesce(o.executado,0)) as executado_total,
  avg(o.velocidade_media) filter (where o.velocidade_media>0) as velocidade_media
from public.importacoes i
join public.operacoes o on o.importacao_id=i.id
where i.ativa=true and i.status in ('concluida','concluida_com_avisos')
group by i.ano,i.mes,i.id,o.servico,coalesce(nullif(trim(o.ra),''),'Não informado'),coalesce(nullif(trim(o.turno),''),'Não informado'),o.data_operacao;

create view public.v_analytics_qualidade with (security_invoker=true) as
select
  i.ano,
  i.mes,
  i.id as importacao_id,
  i.nome_arquivo,
  i.status,
  i.total_linhas as total_raw,
  coalesce(op.quantidade,0) as operacoes_validas,
  coalesce(er.quantidade,0) as rejeicoes,
  case when i.total_linhas>0 then coalesce(op.quantidade,0)::numeric/i.total_linhas*100 else null end as percentual_valido,
  coalesce(er.por_codigo,'{}'::jsonb) as erros_por_codigo
from public.importacoes i
left join lateral (select count(*)::bigint quantidade from public.operacoes o where o.importacao_id=i.id) op on true
left join lateral (
  select count(*)::bigint quantidade,jsonb_object_agg(codigo,total) por_codigo
  from (select coalesce(e.codigo,'SEM_CODIGO') codigo,count(*)::bigint total from public.importacao_erros e where e.importacao_id=i.id group by coalesce(e.codigo,'SEM_CODIGO')) agrupado
) er on true
where i.ativa=true and i.status in ('concluida','concluida_com_avisos');

grant select on public.v_analytics_mensal,public.v_analytics_operacional,public.v_analytics_qualidade to authenticated;
commit;
