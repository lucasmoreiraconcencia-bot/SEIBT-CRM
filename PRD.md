# PRD — Bolão Copa do Mundo 2026

## Contexto

Grupo fechado de amigos (~15 pessoas, expansível) quer um sistema web para gerenciar um bolão da FIFA World Cup 2026. O sistema deve permitir palpites individuais por fase, pontuação automática baseada em resultados reais via API, e um placar geral e por rodada.

---

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend + Backend | **Next.js 14** (App Router) | Full-stack em um só repositório, SSR, responsivo |
| Banco de dados + Auth | **Supabase** | PostgreSQL gratuito, Auth Google nativa, Realtime |
| Hospedagem | **Vercel** (free tier) | Deploy automático, integração nativa com Next.js |
| API de resultados | **API-Football** (RapidAPI free) ou **football-data.org** | Gratuitas, cobrem Copa 2026 |

---

## Personas

### Administrador
- Cria e configura o bolão
- Convida participantes via link/código
- Fecha palpites manualmente se necessário
- Corrige resultados em caso de falha da API
- Marca quem pagou a taxa (controle manual)
- Remove participantes

### Participante
- Faz login via Google
- Registra palpites dentro dos prazos
- Consulta placar geral e por rodada
- Visualiza os palpites de outros jogadores (após fechamento dos prazos)

---

## Funcionalidades

### Autenticação
- Login social via **Google OAuth** (Supabase Auth)
- Acesso apenas para contas convidadas pelo admin (grupo fechado)
- Roles: `admin` e `player`

### Palpite de Campeão (pré-torneio)
- Cada jogador escolhe **uma seleção** como campeã antes da copa começar
- Prazo: antes do **primeiro jogo da Copa 2026** (fixo no sistema)
- Após o prazo: campo bloqueado, palpite visível para todos
- **Pontuação: 40 pontos** se acertar

### Fase de Grupos (8 grupos, 4 seleções cada)
- Jogador prevê a **classificação final completa** de cada grupo (1°, 2°, 3°, 4°)
- Prazo: até o **início do primeiro jogo de cada grupo** (cada grupo tem prazo independente)
- Após o prazo do grupo: campo bloqueado

**Pontuação por grupo:**
| Posição acertada | Pontos |
|---|---|
| 1° lugar | 5 pts |
| 2° lugar | 3 pts |
| 3° lugar | 2 pts |
| 4° lugar | 0 pts |

### Oitavas de Final
- Jogador prevê **quem avança** em cada confronto
- Prazo: antes do **início da rodada de oitavas** (primeiro jogo das oitavas)
- **Pontuação: 3 pontos** por acerto

### Quartas de Final
- Jogador prevê **quem avança** em cada confronto
- Prazo: antes do **início da rodada de quartas**
- **Pontuação: 3 pontos** por acerto

### Semifinais
- Jogador prevê **quem avança** em cada confronto
- Prazo: antes do **início das semifinais**
- **Pontuação: 5 pontos** por acerto

### Disputa de 3° Lugar
- Jogador prevê **quem vence**
- Prazo: antes do jogo
- **Pontuação: 10 pontos** por acerto

### Final
- Jogador prevê **quem vence** (campeão)
- Prazo: antes do jogo
- **Pontuação: 20 pontos** por acerto

> **Regra geral eliminatórias:** prorrogação e pênaltis não importam — vale quem avançou/venceu.

---

## Placar e Ranking

### Ranking Geral
- Soma de todos os pontos acumulados em todas as fases
- Atualizado automaticamente após cada resultado

### Ranking por Fase ("Rodada")
- Placar separado para: Fase de Grupos | Oitavas | Quartas | Semifinal | 3° Lugar | Final
- Permite ver quem foi melhor em cada etapa

### Empate no ranking final
- Em caso de empate na pontuação total ao final da copa: **prêmio dividido igualmente** entre os empatados

---

## Regras de Palpite

- Palpite não enviado dentro do prazo = **0 pontos automático** para aquela fase/grupo
- Após o prazo: campos ficam **bloqueados** (não é possível editar)
- Palpites de outros jogadores ficam **visíveis apenas após o fechamento** do prazo daquela fase
- Admin pode fechar prazos manualmente antes do horário automático

---

## Painel do Administrador

| Funcionalidade | Descrição |
|---|---|
| Gestão de participantes | Convidar (link/código), remover, ver status de pagamento |
| Controle de pagamento | Marcar manualmente quem pagou a taxa |
| Fechar palpites | Encerrar prazo de uma fase antes do horário automático |
| Corrigir resultados | Editar manualmente resultado de um jogo (fallback da API) |
| Visualizar todos os palpites | Ver palpites de todos os participantes |

---

## Integração com API de Resultados

- Fonte primária: **API-Football** (via RapidAPI, plano gratuito) ou **football-data.org**
- Sincronização automática via **cron job** (Vercel Cron) a cada 5 minutos durante jogos
- Admin pode corrigir resultado manualmente caso a API falhe ou atrase
- Dados sincronizados: resultados dos jogos, classificação dos grupos, confrontos das fases eliminatórias

---

## Design e UX

- **Web responsiva** (mobile-first), sem app nativo
- Apenas internet (sem suporte offline)
- Idioma: **Português (BR)**
- Estilo: **moderno**, com cores inspiradas na Copa do Mundo (verde, amarelo, azul — paleta FIFA 2026)
- Sem notificações (email ou push)

---

## Fora do Escopo (v1)

- Chat ou comentários entre participantes
- Histórico de edições de palpites
- Múltiplos bolões simultâneos
- App nativo iOS/Android
- Suporte a outras competições além da Copa 2026
- Integração de pagamento (PIX, cartão, etc.)

---

## Pontuação — Resumo Completo

| Evento | Pontos |
|---|---|
| Acertar 1° lugar do grupo | 5 |
| Acertar 2° lugar do grupo | 3 |
| Acertar 3° lugar do grupo | 2 |
| Acertar 4° lugar do grupo | 0 |
| Acertar classificado nas oitavas | 3 |
| Acertar classificado nas quartas | 3 |
| Acertar classificado na semi | 5 |
| Acertar vencedor do 3° lugar | 10 |
| Acertar campeão (final) | 20 |
| Palpite de campeão pré-torneio | 40 |

---

## Verificação (como testar ao final)

1. Criar conta admin e convidar 2 contas de teste via Google
2. Registrar palpite de campeão em todas as contas
3. Simular início de um grupo — verificar bloqueio de palpites após prazo
4. Admin corrigir resultado manualmente e verificar pontuação atualizada
5. Verificar ranking geral e por fase refletindo pontos corretamente
6. Testar em mobile (Chrome DevTools e dispositivo real)
7. Testar empate de pontuação e exibição de divisão de prêmio
