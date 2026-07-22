-- CCO V2 | Schema canônico enxuto. Executar em um projeto Supabase novo.
begin;
create extension if not exists pgcrypto;

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text, email text unique, ativo boolean not null default true,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table public.perfis_usuario (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  nome text, email text,
  perfil text not null check (perfil in ('administrador','operador','diretoria')),
  ativo boolean not null default true, atualizado_em timestamptz not null default now()
);
create function public.criar_usuario_auth() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.usuarios(id,nome,email) values(new.id,coalesce(new.raw_user_meta_data->>'nome',new.email),new.email);
 insert into public.perfis_usuario(usuario_id,nome,email,perfil) values(new.id,coalesce(new.raw_user_meta_data->>'nome',new.email),new.email,'operador');
 return new;
end $$;
create trigger criar_usuario_apos_auth after insert on auth.users for each row execute function public.criar_usuario_auth();
create table public.regras_servicos (
  servico text primary key, ordem smallint not null unique, valor_unitario numeric(14,2) not null,
  equipe_fixa_painel numeric, usa_executado boolean not null default false, ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
insert into public.regras_servicos(servico,ordem,valor_unitario,equipe_fixa_painel,usa_executado) values
('P1',1,296.00,null,false),('P2.1',2,1027.42,null,false),('P2.2',3,1027.42,null,false),
('P3',4,41992.93,12,false),('P4',5,68.80,null,false),('P5',6,160.94,null,false),
('P6',7,76.24,null,false),('P7',8,49811.72,2,false),('P8',9,81001.04,2,false),
('P9',10,122039.23,11,false),('P10',11,346660.01,3,false),('P11',12,272459.08,1,false),
('P12',13,0.83,null,true);

create table public.importacoes (
  id uuid primary key default gen_random_uuid(), nome_arquivo text not null, hash_arquivo text, tamanho_arquivo bigint,
  usuario_id uuid references public.usuarios(id), usuario_email text, usuario_nome text,
  ano integer not null check (ano between 1900 and 2200), mes integer not null check (mes between 1 and 12),
  status text not null default 'processando' check(status in ('processando','concluida','concluida_com_avisos','erro','cancelada')),
  ativa boolean not null default false, total_abas integer not null default 0, total_linhas bigint not null default 0,
  linhas_importadas bigint not null default 0, linhas_rejeitadas bigint not null default 0,
  periodos jsonb not null default '[]', abas jsonb not null default '[]', detalhes jsonb not null default '{}', erro text,
  iniciado_em timestamptz not null default now(), concluido_em timestamptz, criado_em timestamptz not null default now()
);
create unique index importacoes_periodo_ativo_uniq on public.importacoes(ano,mes) where ativa;
create index importacoes_catalogo_idx on public.importacoes(ativa,status,ano desc,mes desc);

create table public.cabecalhos_planilha (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text not null, linha_cabecalho integer, ordem integer not null, cabecalho_original text, cabecalho_normalizado text,
  criado_em timestamptz not null default now(), unique(importacao_id,aba,ordem)
);
create table public.operacoes (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text, numero_linha integer, rd text, servico text not null references public.regras_servicos(servico), tipo_servico text,
  data_operacao date not null, hora text, turno text, ra text, setor text, circuito text, veiculo text, equipe numeric,
  qtd_equipe numeric, peso_t numeric, viagens numeric, km_total numeric, executado numeric, velocidade_media numeric,
  tempo_produtivo_minutos numeric, tempo_total_minutos numeric, tempo_parada_minutos numeric, km_produtivo numeric,
  km_improdutivo numeric, valor_abastecido numeric, valor_original jsonb not null default '{}', chave_operacao text not null,
  criado_em timestamptz not null default now(), unique(importacao_id,chave_operacao)
);
create index operacoes_importacao_id_idx on public.operacoes(importacao_id,id);
create index operacoes_filtros_idx on public.operacoes(importacao_id,servico,ra,turno);
create index operacoes_data_idx on public.operacoes(importacao_id,data_operacao);
create table public.dias_operacao (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  ano integer not null, mes integer not null, total_dias integer not null check(total_dias>=0), dados jsonb not null default '{}',
  unique(importacao_id,ano,mes)
);
create table public.painel_executivo (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  numero_linha integer not null, ano integer not null, mes integer not null, servico text not null references public.regras_servicos(servico),
  descricao text, nome_servico text, medicao text, previsto numeric, acumulado numeric, valor_unitario numeric, valor_total numeric,
  dias_acumulados integer, total_dias_mes integer, dados jsonb not null default '{}', unique(importacao_id,servico)
);
create index painel_importacao_idx on public.painel_executivo(importacao_id);
create table public.kpi_mensal (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  ano integer not null, mes integer not null, servico text not null references public.regras_servicos(servico), total_operacoes bigint not null,
  total_viagens numeric, total_peso_t numeric, total_km numeric, velocidade_media numeric, quantidade_dias integer,
  dados jsonb not null default '{}', unique(importacao_id,servico)
);
create table public.importacao_erros (
  id bigint generated always as identity primary key, importacao_id uuid not null references public.importacoes(id) on delete cascade,
  aba text, numero_linha integer, codigo text, mensagem text, dados jsonb, criado_em timestamptz not null default now()
);

create view public.v_catalogo_periodos with (security_invoker=true) as
select id importacao_id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em from public.importacoes
where ativa and status in ('concluida','concluida_com_avisos');
create view public.v_auditoria_importacoes with (security_invoker=true) as
select i.id,i.nome_arquivo,i.ano,i.mes,i.status,i.ativa,i.total_linhas,i.linhas_importadas,i.linhas_rejeitadas,
 i.total_linhas linhas_raw,(select count(*) from public.operacoes o where o.importacao_id=i.id) operacoes,
 (select count(distinct o.servico) from public.operacoes o where o.importacao_id=i.id) servicos,
 (select min(o.data_operacao) from public.operacoes o where o.importacao_id=i.id) primeira_data,
 (select max(o.data_operacao) from public.operacoes o where o.importacao_id=i.id) ultima_data,
 (select count(*) from public.importacao_erros e where e.importacao_id=i.id) erros from public.importacoes i;

create function public.eh_administrador() returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.perfis_usuario where usuario_id=auth.uid() and ativo and perfil='administrador') $$;
create function public.finalizar_importacao(p_importacao_id uuid,p_com_avisos boolean default false)
returns public.importacoes language plpgsql security definer set search_path=public as $$
declare v public.importacoes; esperado bigint; encontrado bigint;
begin
 if not public.eh_administrador() then raise exception 'Apenas administradores podem concluir importações'; end if;
 select * into v from public.importacoes where id=p_importacao_id for update;
 if v.id is null or v.status<>'processando' then raise exception 'Importação inválida para conclusão'; end if;
 select count(*) into encontrado from public.operacoes where importacao_id=v.id;
 esperado=coalesce((v.detalhes->>'esperado_operacoes')::bigint,0);
 if encontrado=0 or encontrado<>esperado then raise exception 'Contagem de operações divergente'; end if;
 if (select count(*) from public.painel_executivo where importacao_id=v.id)<>13 then raise exception 'Painel executivo deve conter 13 serviços'; end if;
 update public.importacoes set ativa=false where ano=v.ano and mes=v.mes and id<>v.id and ativa;
 update public.importacoes set ativa=true,status=case when p_com_avisos then 'concluida_com_avisos' else 'concluida' end,
  concluido_em=now(),linhas_importadas=encontrado,
  linhas_rejeitadas=(select count(*) from public.importacao_erros where importacao_id=v.id)
 where id=v.id returning * into v;
 return v;
end $$;

alter table public.usuarios enable row level security; alter table public.perfis_usuario enable row level security;
alter table public.regras_servicos enable row level security; alter table public.importacoes enable row level security;
alter table public.cabecalhos_planilha enable row level security; alter table public.operacoes enable row level security;
alter table public.dias_operacao enable row level security; alter table public.painel_executivo enable row level security;
alter table public.kpi_mensal enable row level security; alter table public.importacao_erros enable row level security;
create policy usuarios_leitura on public.usuarios for select to authenticated using (id=auth.uid() or public.eh_administrador());
create policy usuarios_escrita_admin on public.usuarios for all to authenticated using (public.eh_administrador()) with check (public.eh_administrador());
create policy perfis_leitura on public.perfis_usuario for select to authenticated using (usuario_id=auth.uid() or public.eh_administrador());
create policy perfis_escrita_admin on public.perfis_usuario for all to authenticated using (public.eh_administrador()) with check (public.eh_administrador());
do $$ declare t text; begin foreach t in array array['regras_servicos','importacoes','cabecalhos_planilha','operacoes','dias_operacao','painel_executivo','kpi_mensal','importacao_erros'] loop
 execute format('create policy leitura_%I on public.%I for select to authenticated using (true)',t,t);
 execute format('create policy escrita_%I on public.%I for all to authenticated using (public.eh_administrador()) with check (public.eh_administrador())',t,t);
end loop; end $$;
grant select on all tables in schema public to authenticated;
grant insert,update,delete on public.importacoes,public.cabecalhos_planilha,public.operacoes,public.dias_operacao,public.painel_executivo,public.kpi_mensal,public.importacao_erros to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant execute on function public.finalizar_importacao(uuid,boolean) to authenticated;
commit;
