# Access Control System (Инфотекс кейс)

## Кратко
Система контроля доступа на одноразовых кодах: карта генерирует `ctr`+`tag`, контроллер проверяет по HMAC-SHA256 и принимает решение. Реализованы анти‑реплей, сроки действия карт, админ‑операции.

## Технологии
- Java 17, Gradle
- Spring Boot 3 (Web, Validation, Data JPA)
- PostgreSQL (Docker Compose)
- HikariCP, Hibernate
- OpenAPI (Swagger) — `backend/src/main/resources/openapi.yaml`
- jcardsim (для эмуляции JavaCard‑апплета в разработке)

## Архитектура
- `backend` — REST API: создание карты, эмуляция ответа карты, проверка на контроллере, админ‑операции
- Таблица `cards` (PostgreSQL):
  - `card_id_b64` (PK) — base64url(16)
  - `k_master_b64` — base64url(32) (секрет, не возвращается наружу)
  - `owner`, `created_at`, `expires_at`, `active`
  - `last_ctr` — последний подтверждённый счётчик (anti‑replay)

## Криптография и протокол
- На карте хранится: `cardId` (16B), `K_master` (32B), счётчик `ctr` (LE64)
- Генерация ответа картой:
  - `AD = cardId || ctr`
  - `tag = Trunc16(HMAC_SHA256(K_master, AD))`
- Контроллер:
  - вычисляет эталонный `tag` и сравнивает
  - выполняет anti‑replay: отклоняет, если `ctr <= last_ctr`
  - при успешной проверке атомарно обновляет `last_ctr`

## Anti‑replay (как у TOTP/одноразовых кодов)
- В БД хранится `last_ctr`
- Обновление `last_ctr` — атомарным SQL `update ... where last_ctr is null or :newCtr > last_ctr`
- Повтор одним и тем же `ctr/tag` не пройдёт; следующий `ctr` обязателен

## API (OpenAPI)
Файл спецификации: `backend/src/main/resources/openapi.yaml`

Ключевые эндпоинты:
- POST `/api/cards` — создать карту (вход: `owner`, `ttlSeconds`; ответ: `status`, `cardId`, `owner`, `expiresAt`)
- POST `/api/sim/response/{cardId}` — получить `ctr`, `tag` (эмулятор карты для демо/тестов)
- POST `/api/cards/verify` — верификация контроллером (вход: `cardId`, `ctr`, `tag`; ответ: `{status}`)
- Админ:
  - POST `/api/admin/revoke/{cardId}` — деактивировать
  - POST `/api/admin/extend/{cardId}?extraSeconds=...` — продлить срок
  - GET `/api/admin/status/{cardId}` — состояние карты
  - GET `/api/admin/list` — список карт

## Как запустить
1) База данных (Docker):
```bash
docker compose up -d
```
- URL: `jdbc:postgresql://localhost:5433/cityithack`
- Пользователь/пароль: `city/city`

2) Backend (порт 8080 по умолчанию):
```bash
./gradlew -p backend bootRun
# или с другим портом
./gradlew -p backend bootRun --args='--server.port=8081'
```

3) Пример E2E:
```bash
# 1) Создать карту
curl -sX POST http://localhost:8081/api/cards -H 'Content-Type: application/json' \
  -d '{"owner":"Demo","ttlSeconds":3600}'
# 2) Получить ctr/tag (эмуляция карты)
curl -sX POST http://localhost:8081/api/sim/response/<cardId>
# 3) Проверить на контроллере
curl -sX POST http://localhost:8081/api/cards/verify -H 'Content-Type: application/json' \
  -d '{"cardId":"<cardId>","ctr":"<ctr>","tag":"<tag>"}'
```

## Безопасность
- `k_master_b64` не возвращается из API
- Anti‑replay на уровне БД
- Учитываются `active` и `expiresAt`
- Рекомендуется: ограничить CORS по доменам; защитить админ‑эндпоинты (Basic/JWT); включить аудит и rate limiting
