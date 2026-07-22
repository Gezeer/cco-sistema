# CCO Analytics AI — Fase 2

## Arquitetura e fluxo

`analytics-ai.js` autentica, consulta `operacoes` por período, normaliza os registros e publica `cco:analytics-loaded`. Perguntas usam somente esse conjunto em memória; o texto do usuário nunca produz SQL.

- `analytics-calculations.js`: estatística, rankings, P12 e comparação múltipla.
- `analytics-memory.js`: memória de até 50 mensagens em `sessionStorage`.
- `analytics-agent.js`: classificação, contexto, allowlist e interface do chat.
- `analytics-charts.js`: um Chart.js por mensagem, com registro e destruição.
- `analytics-forecast.js`: projeção linear, média móvel e três cenários.
- `analytics-alerts.js`: alertas somente leitura e comportamento fora do padrão.
- `analytics-map.js`: carregamento sob demanda e fallback quando não há geometria.
- `analytics-reports.js` e `analytics-export.js`: relatório, impressão, CSV e Markdown.
- `analytics-providers.js`: provedor local ativo e placeholders externos bloqueados.

## Regras preservadas

- Velocidade: média simples apenas de valores positivos de `velocidade_media`.
- P12: soma exclusiva de `executado` em cards, chat, gráficos, comparação, previsão e exportação.

## Segurança

Não há `eval`, `new Function`, chaves de IA ou SQL baseado em perguntas. Markdown possui renderização limitada e escape HTML. Provedores externos lançam erro até existir backend seguro.

Uma integração futura deve usar Supabase Edge Function ou backend Node autenticado, credencial no servidor, dados agregados, allowlist de ferramentas, validação de entrada, timeout, logs e limites de uso.

## Limitações

O projeto não contém Leaflet, GeoJSON, latitude ou longitude. O mapa informa a indisponibilidade sem inventar coordenadas. XLSX só é exportado se SheetJS já estiver carregado; CSV sempre está disponível.

## Teste e publicação

Execute o projeto por Live Server ou servidor HTTP estático, autentique-se e abra `analytics-ai.html`. Teste filtros, continuidade de perguntas, gráficos, relatório, alertas, impressão e CSV. Os arquivos são relativos e compatíveis com GitHub Pages; publique a pasta preservando a mesma estrutura.
