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
  with operacoes_ranqueadas as (
    select
      extract(year from o.data_operacao)::integer as ano_calculado,
      extract(month from o.data_operacao)::integer as mes_calculado,
      to_char(o.data_operacao, 'YYYY-MM')::text as periodo_calculado,
      o.importacao_id as importacao_id_calculado,
      row_number() over (
        partition by date_trunc('month', o.data_operacao::timestamp)
        order by o.id desc
      ) as posicao
    from public.operacoes as o
    where o.data_operacao is not null
  )
  select
    r.ano_calculado,
    r.mes_calculado,
    r.periodo_calculado,
    r.importacao_id_calculado
  from operacoes_ranqueadas as r
  where r.posicao = 1
  order by r.periodo_calculado desc;
$$;

grant execute on function public.cco_catalogo_periodos() to authenticated;

commit;
