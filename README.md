# 🏆 Bolão Copa do Mundo 2026

Aplicativo web (Next.js + Supabase) para um bolão entre amigos da Copa de 2026.
Login com Google, palpites por fase, pontuação automática via API e ranking
geral + por fase.

> Regras e escopo completos em [PRD.md](./PRD.md).

---

## ✨ Como funciona a pontuação

| Evento | Pontos |
|---|---|
| Acertar 1º / 2º / 3º / 4º do grupo | 5 / 3 / 2 / 0 |
| Acertar quem avança na Rodada de 32 / Oitavas / Quartas | 3 cada |
| Acertar quem avança na Semifinal | 5 |
| Acertar o vencedor da disputa de 3º lugar | 10 |
| Acertar o campeão (final) | 20 |
| **Palpite de campeão** (antes da Copa) | **40** |

- **Prazos:** cada grupo fecha no horário do seu 1º jogo; cada rodada do mata-mata
  fecha no 1º jogo da rodada; o palpite de campeão fecha no 1º jogo da Copa.
- **Palpite não enviado a tempo = 0 ponto.**
- Mata-mata: vale **quem avança** (prorrogação/pênaltis não importam).
- **Empate no fim da Copa → prêmio dividido** igualmente.

---

## 🚀 Instalação (passo a passo)

### Pré-requisitos
- Node.js 18+ (testado com Node 24)
- Conta no [Supabase](https://supabase.com) (grátis)
- Conta no [Google Cloud](https://console.cloud.google.com) (para o OAuth)
- Conta na [API-Football](https://www.api-football.com) (grátis, 100 req/dia)
- (Deploy) Conta na [Vercel](https://vercel.com) (grátis)

---

### 1) Supabase — banco e autenticação
1. Crie um projeto novo em https://supabase.com/dashboard.
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de
   [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
3. Repita com [`supabase/seed.sql`](./supabase/seed.sql) (cria os 12 grupos e as rodadas).
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta, só servidor)

### 2) Login com Google
1. No **Google Cloud Console → APIs & Services → Credentials**, crie um
   **OAuth client ID** (tipo *Web application*).
2. Em **Authorized redirect URIs**, adicione a URL de callback do Supabase:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
3. Copie o **Client ID** e **Client Secret**.
4. No Supabase: **Authentication → Providers → Google** → cole Client ID/Secret → **Save**.
5. No Supabase: **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (troque para a URL da Vercel em produção)
   - **Redirect URLs**: adicione `http://localhost:3000/auth/callback`
     e depois `https://SEU-APP.vercel.app/auth/callback`.

### 3) API de resultados (API-Football)
1. Crie a conta gratuita em https://www.api-football.com e copie a **API key**.
2. A liga da Copa do Mundo é `league=1`, temporada `season=2026`
   (já são os padrões em `.env`).

### 4) Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha tudo:
```bash
cp .env.example .env.local
```
Defina também `ADMIN_EMAIL` com o **seu e-mail do Google** — esse e-mail vira
administrador automaticamente no primeiro login.

### 5) Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000, entre com o Google, vá em **Admin → Sincronizar**
para puxar times, jogos e prazos da API.

---

## ☁️ Deploy na Vercel
1. Suba o projeto para um repositório Git e importe na Vercel.
2. Em **Settings → Environment Variables**, recrie todas as variáveis do `.env.local`
   (inclua `CRON_SECRET` e troque `NEXT_PUBLIC_SITE_URL` para a URL da Vercel).
3. Atualize no Supabase a **Site URL** e as **Redirect URLs** com o domínio da Vercel
   (`https://SEU-APP.vercel.app/auth/callback`).
4. O arquivo [`vercel.json`](./vercel.json) já agenda o cron de sincronização.
   > ⚠️ No plano **Hobby** (grátis) da Vercel o cron roda **1x por dia**. Durante os
   > jogos, use o botão **Sincronizar** no painel admin para atualizar na hora
   > (ou faça upgrade para crons mais frequentes).

---

## 🛠️ Comandos
```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm start       # rodar o build
npm test        # testes do motor de pontuação (Vitest)
npm run lint    # ESLint
```

---

## 🧱 Estrutura
```
src/
  app/
    (app)/            # área logada (ranking, palpites, jogos, admin)
    api/sync/         # endpoint de sincronização (cron + admin)
    auth/callback/    # callback do OAuth
    login/            # tela de login
  components/         # UI (formulários de palpite, ranking, admin)
  lib/
    scoring.ts        # ⭐ regras de pontos (funções puras, testadas)
    score.ts          # recálculo de pontos no banco
    sync.ts           # API de futebol -> banco
    football-api.ts   # cliente da API-Football
    deadlines.ts      # regras de prazo
    data.ts           # leitura de dados (server)
    actions/          # server actions (palpites + admin)
    supabase/         # clientes (browser, server, service role, middleware)
supabase/
  schema.sql          # tabelas, views, RLS, triggers
  seed.sql            # estrutura do torneio (grupos + rodadas)
tests/
  scoring.test.ts     # 20 testes da pontuação
```

---

## 🔒 Segurança
- Segredos só em variáveis de ambiente (nunca commitados — ver `.gitignore`).
- **RLS** ativo: cada um só edita os próprios palpites e só enquanto a fase está aberta.
- Palpites alheios só aparecem **depois** que a fase fecha.
- A chave `service_role` é usada apenas no servidor (sync, cálculo de pontos e
  revelação pós-fechamento).
- O endpoint `/api/sync` exige o header `Authorization: Bearer ${CRON_SECRET}`.

---

## 📋 Fluxo do administrador
1. **Sincronizar** (Admin) → puxa times, jogos, classificação e prazos.
2. Acompanhar o **Ranking** e os **Jogos** (atualizados pela API/cron).
3. Se a API atrasar/errar: **Admin → Corrigir resultados** (ajuste manual; recalcula pontos).
4. **Participantes**: marcar quem pagou, remover/reativar, copiar o link de convite.
5. **Travas manuais**: fechar/abrir uma fase antes do horário automático, se precisar.
