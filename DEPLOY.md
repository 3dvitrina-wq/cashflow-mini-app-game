# Деплой: онлайн-игра в Telegram (бюджет < $5/мес)

Архитектура: **веб** (статика, React+Vite) на Cloudflare Pages + **сервер**
(Fastify + WebSocket, комнаты в памяти) на Fly.io. Бот в Telegram создаётся
через BotFather и просто открывает веб как Mini App.

```
Telegram → бот (кнопка) → Cloudflare Pages (web, HTTPS)
                                   │  fetch /rooms (HTTP)  + wss://…/ws
                                   ▼
                          Fly.io (Node-сервер, один порт)
```

Стоимость: Cloudflare Pages — бесплатно. Fly.io — pay-as-you-go: машина
256MB 24/7 ≈ $2/мес, а с авто-засыпанием при простое (настроено в `fly.toml`)
≈ $0. Холодный старт при первом заходе ≈ 1-3 сек.

---

## 0. Что уже готово в репозитории

- `apps/server/src/index.ts` — HTTP и WebSocket работают на **одном порту**
  (WS на пути `/ws`), что нужно для одно-портового хостинга.
- `apps/server/Dockerfile` + `.dockerignore` — образ сервера для Fly.
- `fly.toml` — конфиг Fly с авто-стартом/стопом машины.
- `apps/web/.env.production.example` — шаблон URL сервера для веба.
- `apps/web/public/_redirects` — SPA-фоллбэк для Cloudflare Pages.

---

## 1. Сервер на Fly.io

```bash
# Установить CLI (один раз)
brew install flyctl            # или: curl -L https://fly.io/install.sh | sh

flyctl auth signup             # регистрация (нужна карта для верификации)
# или: flyctl auth login

# Из корня репозитория. fly.toml уже есть — деплоим без пересоздания конфига.
flyctl launch --no-deploy --copy-config --name cashflow-game-server --region fra
flyctl deploy
```

- `--region fra` — Франкфурт. Замени на ближайший к игрокам (`fra`, `waw`,
  `cdg`, `iad` и т.д.). Полный список: `flyctl platform regions`.
- Если имя `cashflow-game-server` занято — задай своё и поправь `app = …`
  в `fly.toml`.

Проверка:

```bash
flyctl info                    # покажет hostname, напр. cashflow-game-server.fly.dev
curl https://<твой-app>.fly.dev/health     # → {"ok":true}
```

Запомни URL — он нужен вебу на шаге 2.

---

## 2. Веб на Cloudflare Pages

Cloudflare Pages → **Create a project** → подключить GitHub-репозиторий
(сначала запушь репо на GitHub).

Настройки сборки:

| Поле | Значение |
|------|----------|
| Framework preset | None |
| Build command | `npm install && npm run build --workspace=apps/web` |
| Build output directory | `apps/web/dist` |
| Root directory | `/` (корень репо) |

Environment variables (раздел **Build** → Variables) — подставь URL из шага 1:

```
VITE_HTTP_URL = https://<твой-app>.fly.dev
VITE_WS_URL   = wss://<твой-app>.fly.dev/ws
```

> Vite вшивает эти переменные на этапе сборки. Если изменишь URL — нужно
> пересобрать (Retry deployment).

После деплоя Pages даст URL вида `https://<project>.pages.dev`. Открой его в
браузере — игра должна загрузиться.

### Альтернатива без GitHub (прямой аплоад)

```bash
npm i -g wrangler
npm run build --workspace=apps/web   # сначала задай env, см. .env.production.example
wrangler pages deploy apps/web/dist --project-name cashflow-game
```

---

## 3. CORS

Сервер уже отвечает с `origin: true` (разрешает любой источник) — менять
ничего не нужно. Если захочешь ограничить только своим доменом Pages,
правь `app.register(cors, …)` в `apps/server/src/index.ts`.

---

## 4. Бот и Mini App в Telegram

1. В Telegram открой [@BotFather](https://t.me/BotFather) → `/newbot` →
   задай имя и username. Получишь токен (для MVP токен даже не нужен в коде).
2. `/newapp` (или `/mybots` → твой бот → **Bot Settings → Menu Button** →
   **Configure menu button**) → укажи URL веба: `https://<project>.pages.dev`.
3. Открой бота → нажми кнопку меню → откроется Mini App с игрой.
4. Для ссылки-приглашения на конкретную игру используй
   `https://t.me/<bot_username>/<app_short_name>` или прямую кнопку меню.

> Telegram требует HTTPS для Mini App — Cloudflare Pages даёт его из коробки.

---

## 5. Проверка end-to-end

1. Открой Mini App в Telegram (или `https://<project>.pages.dev?autostart=0`).
2. Создай комнату → получишь код. Первый HTTP-запрос разбудит машину Fly.
3. На втором устройстве/в другом аккаунте войди по коду — должны увидеть
   друг друга в лобби, старт и ходы синхронизируются по WebSocket.

Логи сервера: `flyctl logs`.

---

## Полезное

- Локальный запуск как раньше: `npm run dev` (веб берёт `ws://localhost:3001/ws`).
- Уменьшить вес веба (сейчас ~78MB ассетов, картинки по ~2MB): сжать PNG /
  перейти на webp / lazy-load — это про скорость загрузки, не блокер.
- Масштаб Fly: при росте — `flyctl scale count 1` (всегда включена) или
  `memory 512`. Следи за биллингом в дашборде Fly.
