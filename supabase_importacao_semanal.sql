-- Compatibilidade necessária para os upserts do motor semanal.
-- As tabelas e colunas principais já devem existir conforme o novo banco CCO.

-- RD aceita tanto valores vindos da planilha quanto chaves AUTO determinísticas.
alter table public.operacoes
  alter column rd type text using rd::text;

update public.operacoes
set rd = 'AUTO|' || coalesce(servico, '') || '|' ||
  coalesce(data_operacao::text, '') || '|' || coalesce(veiculo, '') || '|' ||
  coalesce(hora_inicio::text, '') || '|' || coalesce(ra, '') || '|' || coalesce(setor, '')
where rd is null or btrim(rd) = '';

alter table public.operacoes
  alter column rd set not null;

alter table public.importacoes
  add column if not exists usuario_id uuid references auth.users(id),
  add column if not exists usuario text,
  add column if not exists usuario_email text,
  add column if not exists usuario_perfil text;

alter table public.importacoes enable row level security;

drop policy if exists "usuarios autenticados gravam importacoes" on public.importacoes;
drop policy if exists "usuario cria sua propria importacao" on public.importacoes;
drop policy if exists "usuarios autenticados atualizam importacoes" on public.importacoes;
drop policy if exists "usuarios autenticados visualizam importacoes" on public.importacoes;
drop policy if exists "importacoes_select_authenticated" on public.importacoes;
drop policy if exists "importacoes_insert_owner" on public.importacoes;
drop policy if exists "importacoes_update_owner" on public.importacoes;

create policy "importacoes_select_authenticated"
on public.importacoes for select to authenticated
using (true);

create policy "importacoes_insert_owner"
on public.importacoes for insert to authenticated
with check (usuario_id = auth.uid());

create policy "importacoes_update_owner"
on public.importacoes for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

drop index if exists public.operacoes_rd_servico_uidx;
create unique index if not exists operacoes_rd_servico_data_uidx
  on public.operacoes (rd, servico, data_operacao);

create unique index if not exists dias_operacao_ano_mes_uidx
  on public.dias_operacao (ano, mes);

create unique index if not exists planejamento_chave_uidx
  on public.planejamento (circuito, tipo_servico, turno);

create unique index if not exists painel_executivo_periodo_servico_uidx
  on public.painel_executivo (ano, mes, servico);

create unique index if not exists kpi_mensal_periodo_servico_uidx
  on public.kpi_mensal (ano, mes, servico);

alter table public.planilhas_importadas
  alter column dados type jsonb using dados::jsonb;

create or replace view public.periodos_disponiveis as
select distinct
  extract(year from data_operacao)::integer as ano,
  extract(month from data_operacao)::integer as mes
from public.operacoes
where data_operacao is not null;

grant select on public.periodos_disponiveis to anon, authenticated;
notify pgrst, 'reload schema';
