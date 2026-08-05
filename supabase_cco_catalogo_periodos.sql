begin;

-- Cobre exatamente as expressões de agrupamento e o critério que seleciona
-- a última operação de cada mês. INCLUDE permite obter importacao_id no índice.
create index if not exists operacoes_catalogo_ano_mes_id_idx
on public.operacoes (
  (extract(year from data_operacao)::integer),
  (extract(month from data_operacao)::integer),
  id desc
)
include (importacao_id)
where data_operacao is not null;

create or replace function public.cco_catalogo_periodos()
returns table (
  ano integer,
  mes integer,
  periodo text,
  importacao_id uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  with ultima_operacao_por_mes as (
    select
      extract(year from o.data_operacao)::integer as ano,
      extract(month from o.data_operacao)::integer as mes,
      max(o.id) as operacao_id
    from public.operacoes as o
    where o.data_operacao is not null
    group by
      extract(year from o.data_operacao)::integer,
      extract(month from o.data_operacao)::integer
  )
  select
    u.ano,
    u.mes,
    (u.ano::text || '-' || lpad(u.mes::text, 2, '0'))::text as periodo,
    o.importacao_id
  from ultima_operacao_por_mes as u
  join public.operacoes as o on o.id = u.operacao_id
  order by u.ano desc, u.mes desc;
$$;

grant execute on function public.cco_catalogo_periodos() to authenticated;

commit;

-- Execute no SQL Editor antes da troca para registrar o plano antigo:
-- explain (analyze, buffers, verbose, settings)
-- with operacoes_ranqueadas as (
--   select o.id, o.importacao_id, o.data_operacao,
--     row_number() over (
--       partition by date_trunc('month', o.data_operacao::timestamp)
--       order by o.id desc
--     ) as posicao
--   from public.operacoes o
--   where o.data_operacao is not null
-- )
-- select * from operacoes_ranqueadas where posicao = 1;

-- Execute depois do commit para registrar o plano novo real:
-- explain (analyze, buffers, verbose, settings)
-- select * from public.cco_catalogo_periodos();
