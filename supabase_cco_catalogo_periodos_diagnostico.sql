-- Diagnóstico somente leitura. Execute no SQL Editor antes e depois da correção.

-- 1. Todas as assinaturas existentes e seus proprietários.
select n.nspname as schema,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.oid::regprocedure as assinatura,
       r.rolname as proprietario,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
join pg_roles r on r.oid=p.proowner
where p.proname='cco_catalogo_periodos'
order by n.nspname,p.oid;

-- 2. Definição realmente instalada.
select p.oid::regprocedure as assinatura,
       pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='cco_catalogo_periodos';

-- 3. Índices disponíveis em operacoes.
select schemaname,tablename,indexname,indexdef
from pg_indexes
where schemaname='public' and tablename='operacoes'
order by indexname;

-- 4. Plano da consulta otimizada, sem modificar dados.
explain (analyze,buffers,verbose,settings)
select catalogo.ano,
       catalogo.mes,
       catalogo.importacao_id
from (
  select distinct on (
    extract(year from o.data_operacao)::integer,
    extract(month from o.data_operacao)::integer
  )
    extract(year from o.data_operacao)::integer as ano,
    extract(month from o.data_operacao)::integer as mes,
    o.importacao_id
  from public.operacoes o
  where o.data_operacao is not null
  order by
    extract(year from o.data_operacao)::integer,
    extract(month from o.data_operacao)::integer,
    o.id desc
) catalogo
order by catalogo.ano desc,catalogo.mes desc;
