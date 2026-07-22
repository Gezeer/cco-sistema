# Regras de Negócio — CCO V2

Este arquivo é a referência obrigatória para banco, importação, Painel Geral, KPI, Execução e Analytics AI. O visual atual deve ser preservado.

## 1. Períodos e importações

- Cada combinação **ano/mês** possui somente uma importação ativa.
- Uma planilha pode conter um ou vários meses.
- A importação substitui somente os períodos encontrados no arquivo e preserva os demais.
- Uma nova versão de um período é criada como inativa; só é ativada depois que todas as linhas, operações e resumos forem gravados com sucesso.
- Ao ativar a nova versão, a versão anterior do mesmo ano/mês é desativada.
- O sistema sempre abre no período ativo mais recente, ordenado por ano e mês. Atualmente, com os dados existentes, o período esperado é Julho/2026.
- Os filtros devem listar todos os períodos válidos, inclusive Nov/2025, Dez/2025 e Jan–Jul/2026.
- Nenhuma página pode somar meses diferentes.
- Toda consulta deve usar `importacao_id` do período selecionado.
- Registros duplicados devem ser eliminados pela chave de operação dentro da mesma importação.
- O histórico das importações antigas deve ser mantido.

## 2. Serviços

Ordem oficial: P1, P2.1, P2.2, P3, P4, P5, P6, P7, P8, P9, P10, P11 e P12.

Valores unitários oficiais:

| Serviço | Valor unitário |
|---|---:|
| P1 | R$ 296,00 |
| P2.1 | R$ 1.027,42 |
| P2.2 | R$ 1.027,42 |
| P3 | R$ 41.992,93 |
| P4 | R$ 68,80 |
| P5 | R$ 160,94 |
| P6 | R$ 76,24 |
| P7 | R$ 49.811,72 |
| P8 | R$ 81.001,04 |
| P9 | R$ 122.039,23 |
| P10 | R$ 346.660,01 |
| P11 | R$ 272.459,08 |
| P12 | R$ 0,83 |

- Valor financeiro = acumulado do mês × valor unitário.
- Para P12, acumulado = soma da coluna **Executado**.
- Cabeçalhos aceitos para P12: Executado, Executado Total, Quantidade Executada, Qtd Executado, Qtd Executada e Execução.
- A coluna `rd` é sempre texto.
- A data oficial é `data_operacao` no tipo DATE.

## 3. Equipes fixas no Painel Geral

| Serviço | Previsto/equipe fixa |
|---|---:|
| P3 | 12 |
| P7 | 2 |
| P8 | 2 |
| P9 | 11 |
| P10 | 3 |
| P11 | 1 |

- Essas equipes fixas valem para o **Painel Geral**.
- Em KPI, Execução e Dados, devem ser usados os totais amplos da planilha.
- P3 deve seguir a regra de 12 equipes no Painel Geral.

## 4. Dias de operação

- Nesta fase, usar exclusivamente `window.CCO_REGRAS.obterDiasOperacao(ano, mes)`, definido em `js/cco-regras-negocio.js`.
- Abril/2026 = 26 dias.
- Junho/2026 = 26 dias.
- Dias acumulados = quantidade de datas reais distintas por serviço no período selecionado.
- `total_dias_mes` vem do mapa compartilhado por ano/mês; períodos ausentes retornam zero e geram aviso.

## 5. Painel Geral

- Preservar integralmente o visual atual.
- Abrir primeiro e buscar apenas o resumo do período selecionado.
- Ler prioritariamente `painel_executivo`/view ativa por `importacao_id`.
- Não carregar todas as operações de todos os meses na abertura.
- Todos os 13 serviços devem aparecer quando houver dados.
- O gráfico financeiro usa os valores calculados pelas regras oficiais.
- O filtro de período deve trocar os dados sem recarregar toda a aplicação.

## 6. KPI

- Consultar somente as operações do `importacao_id` selecionado.
- Velocidade Média = média simples da coluna `velocidade_media` dos registros válidos.
- Execução Diária deve respeitar o mês selecionado.
- Comparação com o mês anterior deve usar a importação ativa do período imediatamente anterior disponível.
- Não misturar períodos e não aplicar limite global de 1.000 registros sem paginação.

## 7. Execução

- Consultar somente o período selecionado.
- Acumulado P12 = soma de `executado`.
- Manter comparativo mensal e gráfico de rosca.
- Usar o rótulo “km por turno” quando essa for a métrica exibida.
- Filtros devem funcionar para 2025 e 2026.

## 8. Analytics AI

- Manter filtros por ano, mês, serviço, RA e turno.
- Consultar somente o período selecionado e aplicar filtros no banco sempre que possível.
- Comparação histórica não pode alterar os dados do período principal.
- Cache deve ser separado por `importacao_id` e combinação de filtros.

## 9. Perfis e segurança

- Perfis: administrador, operador e diretoria.
- Diretoria não deve visualizar KPI nem ações de importar, limpar ou exportar quando essa for a permissão vigente.
- Importação exige usuário autenticado.
- RLS deve impedir que usuário sem permissão altere dados administrativos.
- Chaves privadas nunca devem ficar no frontend.

## 10. Critérios de aceite

1. O sistema abre no último mês ativo.
2. Julho/2026 abre automaticamente quando for o último período.
3. Trocar de mês não mistura dados.
4. Todos os meses válidos aparecem no filtro.
5. Painel Geral abre rapidamente usando resumo mensal.
6. P1–P12 aparecem corretamente.
7. Valores, equipes fixas, P12 e dias de operação seguem este documento.
8. Nova importação substitui somente seus próprios períodos.
9. O visual atual permanece inalterado.
