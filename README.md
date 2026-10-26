# test-app

Три шари: **front** (статичний HTML), **back** (Node.js + Express API), **db** (MySQL).
Перед ними **proxy** (nginx), локальна модель ALB: `/` → front, `/api` → back.

```
браузер → proxy :8080 ─┬─ /      → front:8080  (nginx-unprivileged, статика)
                       └─ /api/  → back:5000   (Express) → db:3306 (MySQL)
```

## Запуск з нуля

```bash
cp .env.example .env      # і змініть паролі
docker compose up -d --build
```

Відкрити: http://localhost:8080

Порядок старту задає `depends_on`:
1. `db` стартує і стає `healthy` (healthcheck `mysqladmin ping`)
2. `migrate` застосовує міграції і завершується
3. `back` стартує тільки після успішних міграцій
4. `front` і `proxy`

## Конфігурація

Уся конфігурація задається через env (файл `.env`, шаблон у `.env.example`).
`.env` не комітиться.

| Змінна | Для чого |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | підключення back до БД |
| `MYSQL_ROOT_PASSWORD` | root-пароль контейнера MySQL |
| `BACKEND_PORT` | порт back усередині мережі |
| `PROXY_PORT` | порт на хості |

Якщо якоїсь `DB_*` змінної немає, back і migrate одразу завершуються з помилкою.

## Міграції

SQL-файли лежать у `back/migrations/` і застосовуються по черзі за іменем (`001_...`, `002_...`).
Застосовані записуються в таблицю `schema_migrations`, тож кожен файл виконується один раз.

Міграції запускаються **окремою командою**, а не при старті кожної репліки back:

```bash
docker compose run --rm migrate   # вручну
```

У `docker compose up` це робить сервіс `migrate` перед стартом back.

## Ендпоінти

| | |
|---|---|
| `GET /api/health` | liveness: 200, БД не перевіряє (для ALB health check) |
| `GET /api/ready` | readiness: 200, якщо є з'єднання з БД, інакше 503 |
| `GET /api/messages` | список повідомлень |
| `POST /api/messages` | `{"text": "..."}` |

## Логи

Усі сервіси пишуть у stdout/stderr:

```bash
docker compose logs -f back
```
