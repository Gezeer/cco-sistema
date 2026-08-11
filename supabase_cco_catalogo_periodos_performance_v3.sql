begin;

-- Índice coberto pela mesma ordenação usada na RPC. O IF NOT EXISTS evita
-- recriação quando a versão anterior já foi aplicada.
create index if not exists operacoes_catalogo_ano_mes_id_idx
on public.operacoes (
  (extract(year from data_operacao)::integer),
  (extract(month from data_operacao)::integer),
  id desc
)
include (importacao_id)
where data_operacao is not null;

-- Mantém exatamente a regra vigente: para cada mês, retorna o importacao_id
-- da operação de maior id. DISTINCT ON remove o GROUP BY + join anterior.
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
  select catalogo.ano,
         catalogo.mes,
         (catalogo.ano::text || '-' || lpad(catalogo.mes::text, 2, '0'))::text,
         catalogo.importacao_id
  from (
    select distinct on (
      extract(year from o.data_operacao)::integer,
      extract(month from o.data_operacao)::integer
    )
      extract(year from o.data_operacao)::integer as ano,
      extract(month from o.data_operacao)::integer as mes,
      o.importacao_id
    from public.operacoes as o
    where o.data_operacao is not null
    order by
      extract(year from o.data_operacao)::integer,
      extract(month from o.data_operacao)::integer,
      o.id desc
  ) as catalogo
  order by catalogo.ano desc, catalogo.mes desc;
$$;

grant execute on function public.cco_catalogo_periodos() to authenticated;

commit;

-- Executar separadamente após o commit e confirmar Index Only Scan/Unique:
-- explain (analyze, buffers, verbose, settings)
-- select * from public.cco_catalogo_periodos();
