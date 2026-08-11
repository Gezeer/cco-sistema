begin;

-- O V3 já define este índice. IF NOT EXISTS garante que não seja criado um
-- índice redundante. A ordem coincide exatamente com os ORDER BY da busca.
create index if not exists operacoes_catalogo_ano_mes_id_idx
on public.operacoes (
  (extract(year from data_operacao)::integer),
  (extract(month from data_operacao)::integer),
  id desc
)
include (importacao_id)
where data_operacao is not null;

-- Atualiza as estatísticas do planner sem modificar linhas operacionais.
analyze public.operacoes;

-- Guarda o resultado instalado atualmente. A transação será revertida se a
-- implementação V4 escolher um importacao_id diferente em qualquer período.
create temporary table cco_catalogo_periodos_antes
on commit drop
as
select ano,mes,periodo,importacao_id
from public.cco_catalogo_periodos();

create or replace function public.cco_catalogo_periodos()
returns table (
  ano integer,
  mes integer,
  periodo text,
  importacao_id uuid
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with recursive primeiros_por_mes(ano,mes,importacao_id) as (
    (
      select
        extract(year from o.data_operacao)::integer,
        extract(month from o.data_operacao)::integer,
        o.importacao_id
      from public.operacoes o
      where o.data_operacao is not null
      order by
        extract(year from o.data_operacao)::integer,
        extract(month from o.data_operacao)::integer,
        o.id desc
      limit 1
    )

    union all

    select proximo.ano,proximo.mes,proximo.importacao_id
    from primeiros_por_mes anterior
    cross join lateral (
      select
        extract(year from o.data_operacao)::integer as ano,
        extract(month from o.data_operacao)::integer as mes,
        o.importacao_id
      from public.operacoes o
      where o.data_operacao is not null
        and (
          extract(year from o.data_operacao)::integer,
          extract(month from o.data_operacao)::integer
        ) > (anterior.ano,anterior.mes)
      order by
        extract(year from o.data_operacao)::integer,
        extract(month from o.data_operacao)::integer,
        o.id desc
      limit 1
    ) proximo
  )
  select
    c.ano,
    c.mes,
    (c.ano::text || '-' || lpad(c.mes::text,2,'0'))::text as periodo,
    c.importacao_id
  from primeiros_por_mes c
  order by c.ano desc,c.mes desc;
$$;

revoke all on function public.cco_catalogo_periodos() from public;
grant execute on function public.cco_catalogo_periodos() to authenticated;

-- Prova obrigatória de equivalência. EXCEPT em ambas as direções compara
-- ano, mês, período e UUID. Qualquer diferença aborta todo este arquivo.
do $$
declare
  divergencias integer;
begin
  select count(*) into divergencias
  from (
    (select ano,mes,periodo,importacao_id from cco_catalogo_periodos_antes
     except
     select ano,mes,periodo,importacao_id from public.cco_catalogo_periodos())
    union all
    (select ano,mes,periodo,importacao_id from public.cco_catalogo_periodos()
     except
     select ano,mes,periodo,importacao_id from cco_catalogo_periodos_antes)
  ) diferencas;

  if divergencias <> 0 then
    raise exception 'CCO catálogo V4 divergente: % linha(s). Transação revertida.',divergencias;
  end if;
end;
$$;

commit;

-- ================================================================
-- VALIDAÇÃO DE PERFORMANCE — executar separadamente após o commit.
-- O plano esperado contém buscas Limit + Index Scan/Index Only Scan
-- repetidas apenas uma vez por período, não Unique sobre o índice inteiro.
-- ================================================================
-- explain (analyze,buffers,verbose,settings)
-- select * from public.cco_catalogo_periodos();

-- ================================================================
-- COMPARAÇÃO MANUAL OPCIONAL
-- A comparação automática acima já aborta o V4 se houver divergência.
-- Para exibir o catálogo final:
-- ================================================================
-- select ano,mes,periodo,importacao_id
-- from public.cco_catalogo_periodos()
-- order by ano desc,mes desc;

-- Confirmar o índice efetivamente instalado:
-- select indexname,indexdef
-- from pg_indexes
-- where schemaname='public'
--   and tablename='operacoes'
--   and indexname='operacoes_catalogo_ano_mes_id_idx';
