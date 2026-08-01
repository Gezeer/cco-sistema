begin;

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
  select
    extract(year from o.data_operacao)::integer as ano,
    extract(month from o.data_operacao)::integer as mes,
    to_char(o.data_operacao, 'YYYY-MM') as periodo,
    (array_agg(o.importacao_id order by o.id desc))[1] as importacao_id
  from public.operacoes o
  where o.data_operacao is not null
  group by
    extract(year from o.data_operacao),
    extract(month from o.data_operacao),
    to_char(o.data_operacao, 'YYYY-MM')
  order by periodo desc;
$$;

grant execute on function public.cco_catalogo_periodos() to authenticated;

commit;
