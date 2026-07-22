-- CCO | Reconstrução completa do banco principal Supabase
-- Executável em um projeto Supabase vazio. Não depende de migrations antigas.
begin;

create extension if not exists pgcrypto;

create table if not exists public.perfis_usuario (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  perfil text not null default 'operador' check (perfil in ('administrador','operador','diretoria')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.importacoes (
  id uuid primary key default gen_random_uuid(),
  nome_arquivo text not null,
  hash_arquivo text,
  tamanho_arquivo bigint,
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_email text,
  usuario_nome text,
  ano integer check (ano is null or ano between 1900 and 2200),
  mes integer check (mes is null or mes between 1 and 12),
  status text not null default 'processando' check (status in ('processando','concluida','concluida_com_avisos','erro','cancelada')),
  ativa boolean not null default false,
  total_abas integer not null default 0,
  total_linhas bigint not null default 0,
  linhas_importadas bigint not null default 0,
  linhas_rejeitadas bigint not null default 0,
  periodos jsonb not null default '[]'::jsonb,
  abas jsonb not null default '[]'::jsonb,
  detalhes jsonb not null default '{}'::jsonb,
  erro text,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists importacoes_hash_idx on public.importacoes(hash_arquivo);
create index if not exists importacoes_ano_mes_idx on public.importacoes(ano,mes);
create index if not exists importacoes_ativa_idx on public.importacoes(ativa);
create index if not exists importacoes_status_idx on public.importacoes(status);
create index if not exists importacoes_criado_idx on public.importacoes(criado_em desc);
create index if not exists importacoes_usuario_idx on public.importacoes(usuario_id);
create unique index if not exists importacoes_ativa_periodo_uniq on public.importacoes(ano,mes) where ativa and ano is not null and mes is not null;

create table if not exists public.cabecalhos_planilha (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text not null,
  linha_cabecalho integer,
  ordem integer not null,
  cabecalho_original text,
  cabecalho_normalizado text,
  criado_em timestamptz not null default now(),
  unique(importacao_id,aba,ordem)
);
create index if not exists cabecalhos_importacao_idx on public.cabecalhos_planilha(importacao_id);
create index if not exists cabecalhos_aba_idx on public.cabecalhos_planilha(aba);

create table if not exists public.planilha_linhas (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text not null,
  numero_linha integer not null,
  servico text,
  rd text,
  data_operacao date,
  ano integer,
  mes integer,
  chave_linha text not null,
  dados jsonb not null,
  dados_originais jsonb,
  criado_em timestamptz not null default now(),
  unique(importacao_id,aba,numero_linha)
);
create index if not exists planilha_linhas_importacao_idx on public.planilha_linhas(importacao_id);
create index if not exists planilha_linhas_aba_idx on public.planilha_linhas(aba);
create index if not exists planilha_linhas_servico_idx on public.planilha_linhas(servico);
create index if not exists planilha_linhas_data_idx on public.planilha_linhas(data_operacao);
create index if not exists planilha_linhas_ano_mes_idx on public.planilha_linhas(ano,mes);
create index if not exists planilha_linhas_rd_idx on public.planilha_linhas(rd);
create index if not exists planilha_linhas_chave_idx on public.planilha_linhas(chave_linha);
create index if not exists planilha_linhas_dados_gin_idx on public.planilha_linhas using gin(dados);

create table if not exists public.operacoes (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text,
  numero_linha integer,
  rd text,
  servico text not null,
  tipo_servico text,
  data_operacao date,
  hora text,
  turno text,
  ra text,
  setor text,
  circuito text,
  veiculo text,
  motorista text,
  hora_inicio text,
  equipe numeric,
  peso_t numeric,
  viagens numeric,
  km_total numeric,
  qtd_equipe numeric,
  executado numeric,
  velocidade_media numeric,
  velocidade_media_produtiva numeric,
  velocidade_media_improdutiva numeric,
  tempo_produtivo_minutos numeric,
  tempo_total_minutos numeric,
  tempo_parada_minutos numeric,
  tempo_improdutivo_minutos numeric,
  km_produtivo numeric,
  km_improdutivo numeric,
  valor_abastecido numeric,
  odometro_inicial numeric,
  odometro_final numeric,
  horimetro_inicial numeric,
  horimetro_final numeric,
  dados_originais jsonb,
  valor_original jsonb not null default '{}'::jsonb,
  chave_operacao text not null,
  criado_em timestamptz not null default now(),
  unique(importacao_id,chave_operacao)
);
create index if not exists operacoes_importacao_idx on public.operacoes(importacao_id);
create index if not exists operacoes_servico_idx on public.operacoes(servico);
create index if not exists operacoes_data_idx on public.operacoes(data_operacao);
create index if not exists operacoes_ra_idx on public.operacoes(ra);
create index if not exists operacoes_turno_idx on public.operacoes(turno);
create index if not exists operacoes_rd_idx on public.operacoes(rd);
create index if not exists operacoes_importacao_servico_idx on public.operacoes(importacao_id,servico);
create index if not exists operacoes_importacao_data_idx on public.operacoes(importacao_id,data_operacao);
create index if not exists operacoes_importacao_servico_data_idx on public.operacoes(importacao_id,servico,data_operacao);

create table if not exists public.dias_operacao (
  id bigint generated always as identity primary key,
  importacao_id uuid references public.importacoes(id) on delete cascade,
  ano integer not null,
  mes integer not null check (mes between 1 and 12),
  total_dias integer not null check (total_dias >= 0),
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique(importacao_id,ano,mes)
);
create index if not exists dias_operacao_importacao_idx on public.dias_operacao(importacao_id);
create index if not exists dias_operacao_ano_mes_idx on public.dias_operacao(ano,mes);

create table if not exists public.painel_executivo (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  numero_linha integer,
  ano integer,
  mes integer,
  servico text,
  descricao text,
  nome_servico text,
  medicao text,
  previsto numeric,
  acumulado numeric,
  valor_unitario numeric,
  valor_total numeric,
  dias_acumulados integer,
  total_dias_mes integer,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique(importacao_id,numero_linha)
);
create index if not exists painel_importacao_idx on public.painel_executivo(importacao_id);
create index if not exists painel_periodo_servico_idx on public.painel_executivo(ano,mes,servico);

create table if not exists public.importacao_erros (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text,
  numero_linha integer,
  codigo text,
  mensagem text,
  dados jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists importacao_erros_importacao_idx on public.importacao_erros(importacao_id);

-- Estruturas ainda consultadas pelos módulos KPI e planejamento.
create table if not exists public.kpi_mensal (
  id bigint generated always as identity primary key,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  ano integer not null,
  mes integer not null,
  servico text not null,
  total_operacoes bigint not null default 0,
  total_viagens numeric,
  total_peso_t numeric,
  total_km numeric,
  velocidade_media numeric,
  quantidade_dias integer,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique(importacao_id,servico)
);
create index if not exists kpi_mensal_periodo_idx on public.kpi_mensal(ano,mes,servico);

create table if not exists public.planejamento (
  id bigint generated always as identity primary key,
  importacao_id uuid references public.importacoes(id) on delete cascade,
  circuito text,
  ra text,
  frequencia text,
  tipo_servico text,
  turno text,
  km_planejado numeric,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists planejamento_importacao_idx on public.planejamento(importacao_id);

create or replace view public.planilhas_importadas with (security_invoker=true) as
select
  min(pl.id) as id,
  pl.importacao_id,
  i.nome_arquivo,
  pl.aba,
  coalesce(max(pl.servico),'GERAL') as codigo_servico,
  1 as numero_lote,
  count(*)::integer as quantidade_registros,
  jsonb_agg(pl.dados order by pl.numero_linha) as dados,
  min(pl.criado_em) as criado_em
from public.planilha_linhas pl
join public.importacoes i on i.id=pl.importacao_id
group by pl.importacao_id,i.nome_arquivo,pl.aba;

create or replace view public.v_catalogo_periodos with (security_invoker=true) as
select distinct on (ano,mes)
  id as importacao_id, ano, mes, nome_arquivo, status, ativa, concluido_em, criado_em
from public.importacoes
where status in ('concluida','concluida_com_avisos') and ano is not null and mes is not null
order by ano,mes,ativa desc,concluido_em desc nulls last,criado_em desc;

create or replace view public.v_operacoes_ativas with (security_invoker=true) as
select o.* from public.operacoes o
join public.importacoes i on i.id=o.importacao_id
where i.status in ('concluida','concluida_com_avisos') and i.ativa=true;

create or replace view public.v_dias_operacao_ativos with (security_invoker=true) as
select d.* from public.dias_operacao d
join public.importacoes i on i.id=d.importacao_id
where i.status in ('concluida','concluida_com_avisos') and i.ativa=true;

create or replace view public.v_painel_executivo_ativo with (security_invoker=true) as
select p.* from public.painel_executivo p
join public.importacoes i on i.id=p.importacao_id
where i.status in ('concluida','concluida_com_avisos') and i.ativa=true;

create or replace view public.v_kpi_mensal_ativo with (security_invoker=true) as
select k.* from public.kpi_mensal k
join public.importacoes i on i.id=k.importacao_id
where i.status in ('concluida','concluida_com_avisos') and i.ativa=true;

create or replace view public.v_auditoria_importacoes with (security_invoker=true) as
select i.id,i.nome_arquivo,i.ano,i.mes,i.status,i.ativa,i.total_linhas,i.linhas_importadas,i.linhas_rejeitadas,
  (select count(*) from public.planilha_linhas pl where pl.importacao_id=i.id) as linhas_raw,
  (select count(*) from public.operacoes o where o.importacao_id=i.id) as operacoes,
  (select count(distinct o.servico) from public.operacoes o where o.importacao_id=i.id) as servicos,
  (select min(o.data_operacao) from public.operacoes o where o.importacao_id=i.id) as primeira_data,
  (select max(o.data_operacao) from public.operacoes o where o.importacao_id=i.id) as ultima_data,
  (select count(*) from public.importacao_erros e where e.importacao_id=i.id) as erros
from public.importacoes i;

create or replace function public.calcular_dias_acumulados(p_importacao_id uuid,p_servico text,p_ano integer,p_mes integer)
returns integer language sql stable set search_path=public as $$
  select count(distinct o.data_operacao)::integer from public.operacoes o
  where o.importacao_id=p_importacao_id
    and upper(trim(o.servico))=upper(trim(p_servico))
    and extract(year from o.data_operacao)::integer=p_ano
    and extract(month from o.data_operacao)::integer=p_mes;
$$;

create or replace function public.eh_administrador()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.perfis_usuario p where p.usuario_id=auth.uid() and p.ativo and p.perfil='administrador');
$$;

-- Conclusão atômica: somente esta função ativa a importação e desativa a anterior do mesmo período.
create or replace function public.finalizar_importacao(p_importacao_id uuid,p_com_avisos boolean default false)
returns public.importacoes language plpgsql security definer set search_path=public as $$
declare v public.importacoes; esperado bigint; encontrado bigint;
begin
  if not public.eh_administrador() then raise exception 'Apenas administradores podem concluir importações'; end if;
  select * into v from public.importacoes where id=p_importacao_id for update;
  if v.id is null then raise exception 'Importação não encontrada'; end if;
  if v.status<>'processando' then raise exception 'Importação não está em processamento'; end if;
  if not exists(select 1 from public.planilha_linhas where importacao_id=v.id) then raise exception 'Camada RAW vazia'; end if;
  if not exists(select 1 from public.operacoes where importacao_id=v.id) then raise exception 'Camada operacional vazia'; end if;
  esperado=coalesce((v.detalhes->>'esperado_raw')::bigint,v.total_linhas);
  select count(*) into encontrado from public.planilha_linhas where importacao_id=v.id;
  if encontrado<>esperado then raise exception 'Contagem RAW divergente: esperado %, encontrado %',esperado,encontrado; end if;
  esperado=coalesce((v.detalhes->>'esperado_operacoes')::bigint,0);
  select count(*) into encontrado from public.operacoes where importacao_id=v.id;
  if encontrado<>esperado then raise exception 'Contagem de operações divergente: esperado %, encontrado %',esperado,encontrado; end if;
  esperado=coalesce((v.detalhes->>'esperado_dias')::bigint,0);
  select count(*) into encontrado from public.dias_operacao where importacao_id=v.id;
  if encontrado<>esperado then raise exception 'Contagem de dias_operacao divergente: esperado %, encontrado %',esperado,encontrado; end if;
  esperado=coalesce((v.detalhes->>'esperado_painel')::bigint,0);
  select count(*) into encontrado from public.painel_executivo where importacao_id=v.id;
  if encontrado<>esperado then raise exception 'Contagem do painel divergente: esperado %, encontrado %',esperado,encontrado; end if;
  esperado=coalesce((v.detalhes->>'esperado_p12')::bigint,0);
  select count(*) into encontrado from public.operacoes where importacao_id=v.id and servico='P12';
  if encontrado<>esperado then raise exception 'Contagem P12 divergente: esperado %, encontrado %',esperado,encontrado; end if;
  esperado=coalesce((v.detalhes->>'esperado_p12_executado')::bigint,0);
  select count(executado) into encontrado from public.operacoes where importacao_id=v.id and servico='P12';
  if encontrado<>esperado then raise exception 'P12 Executado divergente: esperado %, encontrado %',esperado,encontrado; end if;
  update public.importacoes set ativa=false where ano=v.ano and mes=v.mes and id<>v.id and ativa=true;
  update public.importacoes set
    status=case when p_com_avisos then 'concluida_com_avisos' else 'concluida' end,
    ativa=true, concluido_em=now(),
    linhas_importadas=(select count(*) from public.planilha_linhas where importacao_id=v.id),
    linhas_rejeitadas=(select count(*) from public.importacao_erros where importacao_id=v.id)
  where id=v.id returning * into v;
  return v;
end; $$;

-- RLS: leitura autenticada; escrita apenas por administrador ativo.
alter table public.perfis_usuario enable row level security;
alter table public.importacoes enable row level security;
alter table public.cabecalhos_planilha enable row level security;
alter table public.planilha_linhas enable row level security;
alter table public.operacoes enable row level security;
alter table public.dias_operacao enable row level security;
alter table public.painel_executivo enable row level security;
alter table public.importacao_erros enable row level security;
alter table public.kpi_mensal enable row level security;
alter table public.planejamento enable row level security;

do $$
declare t text;
begin
  foreach t in array array['importacoes','cabecalhos_planilha','planilha_linhas','operacoes','dias_operacao','painel_executivo','importacao_erros','kpi_mensal','planejamento'] loop
    execute format('drop policy if exists leitura_autenticada on public.%I',t);
    execute format('create policy leitura_autenticada on public.%I for select to authenticated using (true)',t);
    execute format('drop policy if exists escrita_administrador on public.%I',t);
    execute format('create policy escrita_administrador on public.%I for all to authenticated using (public.eh_administrador()) with check (public.eh_administrador())',t);
  end loop;
end $$;
drop policy if exists perfil_proprio_leitura on public.perfis_usuario;
create policy perfil_proprio_leitura on public.perfis_usuario for select to authenticated using (usuario_id=auth.uid() or public.eh_administrador());
drop policy if exists perfil_proprio_criacao on public.perfis_usuario;
create policy perfil_proprio_criacao on public.perfis_usuario for insert to authenticated with check (usuario_id=auth.uid() and perfil='operador');
drop policy if exists perfil_admin_atualizacao on public.perfis_usuario;
create policy perfil_admin_atualizacao on public.perfis_usuario for update to authenticated using (public.eh_administrador()) with check (public.eh_administrador());

grant usage on schema public to authenticated;
grant select on public.v_catalogo_periodos,public.v_operacoes_ativas,public.v_dias_operacao_ativos,public.v_painel_executivo_ativo,public.v_kpi_mensal_ativo,public.v_auditoria_importacoes,public.planilhas_importadas to authenticated;
grant execute on function public.calcular_dias_acumulados(uuid,text,integer,integer) to authenticated;
grant execute on function public.finalizar_importacao(uuid,boolean) to authenticated;
grant execute on function public.eh_administrador() to authenticated;

commit;

-- CONSULTAS DE AUDITORIA (execute separadamente após a importação)
-- select aba,count(*) total from public.planilha_linhas group by aba order by aba;
-- select servico,count(*) total,min(data_operacao) primeira_data,max(data_operacao) ultima_data from public.operacoes group by servico order by servico;
-- select servico,count(distinct data_operacao) dias from public.operacoes where importacao_id='<UUID>' group by servico order by servico;
-- select count(*) registros_p12,count(executado) p12_com_executado,sum(executado) soma_executado from public.operacoes where importacao_id='<UUID>' and servico='P12';
-- select * from public.v_auditoria_importacoes order by criado_em desc;

-- ============================================================================
-- CCO V2 | Regras oficiais e APIs de leitura rápida
-- ============================================================================

begin;

create table if not exists public.regras_servicos (
  servico text primary key,
  ordem integer not null unique,
  valor_unitario numeric(16,2) not null,
  equipe_fixa_painel numeric,
  usa_executado boolean not null default false,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

insert into public.regras_servicos(servico,ordem,valor_unitario,equipe_fixa_painel,usa_executado)
values
 ('P1',1,296.00,null,false),
 ('P2.1',2,1027.42,null,false),
 ('P2.2',3,1027.42,null,false),
 ('P3',4,41992.93,12,false),
 ('P4',5,68.80,null,false),
 ('P5',6,160.94,null,false),
 ('P6',7,76.24,null,false),
 ('P7',8,49811.72,2,false),
 ('P8',9,81001.04,2,false),
 ('P9',10,122039.23,11,false),
 ('P10',11,346660.01,3,false),
 ('P11',12,272459.08,1,false),
 ('P12',13,0.83,null,true)
on conflict(servico) do update set
 ordem=excluded.ordem,
 valor_unitario=excluded.valor_unitario,
 equipe_fixa_painel=excluded.equipe_fixa_painel,
 usa_executado=excluded.usa_executado,
 ativo=true,
 atualizado_em=now();

insert into public.dias_operacao(importacao_id,ano,mes,total_dias,dados)
select null,2026,4,26,'{"origem":"regra_oficial"}'::jsonb
where not exists(select 1 from public.dias_operacao where importacao_id is null and ano=2026 and mes=4);

insert into public.dias_operacao(importacao_id,ano,mes,total_dias,dados)
select null,2026,6,26,'{"origem":"regra_oficial"}'::jsonb
where not exists(select 1 from public.dias_operacao where importacao_id is null and ano=2026 and mes=6);

create unique index if not exists dias_operacao_global_periodo_uniq
on public.dias_operacao(ano,mes) where importacao_id is null;

create or replace function public.obter_ultimo_periodo()
returns table(importacao_id uuid, ano integer, mes integer, nome_arquivo text)
language sql stable security invoker set search_path=public as $$
  select i.id,i.ano,i.mes,i.nome_arquivo
  from public.importacoes i
  where i.ativa=true
    and i.status in ('concluida','concluida_com_avisos')
    and i.ano is not null and i.mes is not null
  order by i.ano desc,i.mes desc,i.concluido_em desc nulls last,i.criado_em desc
  limit 1;
$$;

create or replace function public.obter_importacao_periodo(p_ano integer,p_mes integer)
returns table(importacao_id uuid, ano integer, mes integer, nome_arquivo text)
language sql stable security invoker set search_path=public as $$
  select i.id,i.ano,i.mes,i.nome_arquivo
  from public.importacoes i
  where i.ativa=true
    and i.status in ('concluida','concluida_com_avisos')
    and i.ano=p_ano and i.mes=p_mes
  order by i.concluido_em desc nulls last,i.criado_em desc
  limit 1;
$$;

create or replace view public.v_painel_mensal_v2 with (security_invoker=true) as
select
 p.importacao_id,
 i.ano,
 i.mes,
 r.servico,
 coalesce(p.descricao,p.nome_servico,r.servico) as descricao,
 p.medicao,
 coalesce(r.equipe_fixa_painel,p.previsto,0) as previsto,
 case when r.usa_executado then coalesce(p.acumulado,0) else coalesce(p.acumulado,0) end as acumulado,
 r.valor_unitario,
 coalesce(p.acumulado,0)*r.valor_unitario as valor_total,
 p.dias_acumulados,
 coalesce(d.total_dias,p.total_dias_mes,0) as total_dias_mes,
 r.ordem
from public.importacoes i
cross join public.regras_servicos r
left join public.painel_executivo p on p.importacao_id=i.id and upper(trim(p.servico))=r.servico
left join lateral (
 select dx.total_dias
 from public.dias_operacao dx
 where (dx.importacao_id=i.id or dx.importacao_id is null)
   and dx.ano=i.ano and dx.mes=i.mes
 order by (dx.importacao_id is not null) desc
 limit 1
) d on true
where i.ativa=true and i.status in ('concluida','concluida_com_avisos') and r.ativo=true;

create index if not exists operacoes_importacao_ra_turno_idx on public.operacoes(importacao_id,ra,turno);
create index if not exists operacoes_importacao_servico_ra_idx on public.operacoes(importacao_id,servico,ra);

alter table public.regras_servicos enable row level security;
drop policy if exists regras_servicos_select_auth on public.regras_servicos;
create policy regras_servicos_select_auth on public.regras_servicos for select to authenticated using(true);
drop policy if exists regras_servicos_admin_write on public.regras_servicos;
create policy regras_servicos_admin_write on public.regras_servicos for all to authenticated
using(public.usuario_administrador()) with check(public.usuario_administrador());

grant select on public.regras_servicos to authenticated;
grant select on public.v_painel_mensal_v2 to authenticated;
grant execute on function public.obter_ultimo_periodo() to authenticated;
grant execute on function public.obter_importacao_periodo(integer,integer) to authenticated;

commit;
