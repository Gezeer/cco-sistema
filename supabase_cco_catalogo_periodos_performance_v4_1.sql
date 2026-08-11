begin;

-- Captura o catálogo atualmente instalado antes de qualquer substituição.
-- pg_temp torna explícito que esta tabela existe somente nesta sessão/transação.
create temporary table pg_temp.cco_catalogo_periodos_antes
on commit drop
as
select ano,mes,periodo,importacao_id
from public.cco_catalogo_periodos();

-- O V3 já define este índice. IF NOT EXISTS impede índice redundante.
create index if not exists operacoes_catalogo_ano_mes_id_idx
on public.operacoes (
  (extract(year from data_operacao)::integer),
  (extract(month from data_operacao)::integer),
  id desc
)
include (importacao_id)
where data_operacao is not null;

-- Atualiza somente estatísticas do planner; não altera linhas operacionais.
analyze public.operacoes;

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

-- Materializa o resultado da implementação recém-instalada enquanto a tabela
-- "antes" ainda existe na mesma transação.
create temporary table pg_temp.cco_catalogo_periodos_depois
on commit drop
as
select ano,mes,periodo,importacao_id
from public.cco_catalogo_periodos();

-- Prova de equivalência em ambos os sentidos. Uma divergência gera erro e
-- reverte índice, função, permissões e tabelas temporárias desta transação.
do $$
begin
  if exists (
    select 1
    from (
      (
        select ano,mes,periodo,importacao_id
        from pg_temp.cco_catalogo_periodos_antes
        except
        select ano,mes,periodo,importacao_id
        from pg_temp.cco_catalogo_periodos_depois
      )
      union all
      (
        select ano,mes,periodo,importacao_id
        from pg_temp.cco_catalogo_periodos_depois
        except
        select ano,mes,periodo,importacao_id
        from pg_temp.cco_catalogo_periodos_antes
      )
    ) diferencas
  ) then
    raise exception 'Catálogo V4.1 não é equivalente ao catálogo anterior. Transação revertida.';
  end if;
end;
$$;

commit;

-- ================================================================
-- VALIDAÇÃO DE PERFORMANCE — executar separadamente após o commit.
-- Não há estimativa de ganho: o tempo deve ser medido no Supabase.
-- ================================================================
-- explain (analyze,buffers,verbose,settings)
-- select * from public.cco_catalogo_periodos();

-- Confirmar o índice efetivamente instalado/usado pelo novo EXPLAIN:
-- select indexname,indexdef
-- from pg_indexes
-- where schemaname='public'
--   and tablename='operacoes'
--   and indexname='operacoes_catalogo_ano_mes_id_idx';
