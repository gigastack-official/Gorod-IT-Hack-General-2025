# Access Control System (Инфотекс кейс)

## Кратко
Система контроля доступа на одноразовых кодах с поддержкой ролей пользователей, автоматической ротации ключей, QR кодов для гостевых пропусков, удаленной аттестации ридеров и полной системой аудита и логирования. Карта генерирует `ctr`+`tag`, контроллер проверяет по HMAC-SHA256 и принимает решение. Все события системы записываются в аудит с детальной информацией.

## Технологии
- Java 17, Gradle
- Spring Boot 3 (Web, Validation, Data JPA)
- PostgreSQL (Docker Compose)
- HikariCP, Hibernate
- OpenAPI (Swagger) — `backend/src/main/resources/openapi.yaml`
- jcardsim (для эмуляции JavaCard‑апплета в разработке)
- AES-GCM для обертки ключей (аппаратная защищенность)

## Архитектура

### Основные компоненты:
- **`backend`** — REST API для демонстрации и администрирования
- **`offline-controller`** — Оффлайн-контроллер с локальным журналом
- **`card-simulator`** — Симулятор карты с генерацией одноразовых кодов
- **`controller-simulator`** — Симулятор контроллера для проверки доступа
- **`demo`** — Демонстрационное приложение

### База данных (PostgreSQL):
- **Таблица `cards`:**
  - `card_id_b64` (PK) — base64url(16)
  - `k_master_b64` — base64url(256) (обернутый ключ AES-GCM, не возвращается наружу)
  - `owner`, `created_at`, `expires_at`, `active`
  - `last_ctr` — последний подтверждённый счётчик (anti‑replay)
  - `user_role` — роль пользователя (admin, permanent, temporary, guest)
  - `key_version` — версия ключа для ротации
  - `next_rotation_at` — время следующей ротации ключа
  - `qr_code` — QR код для гостевых пропусков

- **Таблица `audit_events` (система аудита):**
  - `event_type` — тип события (CARD_CREATED, ACCESS_GRANTED, ACCESS_DENIED, etc.)
  - `event_category` — категория (AUTHENTICATION, AUTHORIZATION, ADMINISTRATION, etc.)
  - `card_id`, `reader_id`, `owner`, `user_role`
  - `event_timestamp`, `success`, `message`, `error_code`
  - `ip_address`, `user_agent`, `session_id`, `additional_data`

- **Таблица `access_history` (история доступа):**
  - `card_id`, `reader_id`, `owner`, `user_role`
  - `access_timestamp`, `access_type`, `success`
  - `counter_value` — значение счетчика для anti-replay
  - `ip_address`, `location`, `device_info`
  - `failure_reason`, `response_time_ms`, `additional_metadata`

## Криптография и протокол
- На карте хранится: `cardId` (16B), `K_master` (32B), счётчик `ctr` (LE64)
- Генерация ответа картой:
  - `AD = cardId || ctr`
  - `tag = Trunc16(HMAC_SHA256(K_master, AD))`
- Контроллер:
  - вычисляет эталонный `tag` и сравнивает
  - выполняет anti‑replay: отклоняет, если `ctr <= last_ctr`
  - при успешной проверке атомарно обновляет `last_ctr`
- Аппаратная защищенность:
  - `K_master` хранится в обернутом виде (AES-GCM)
  - KEK (Key Encryption Key) из переменной окружения `APP_KEK_B64`
  - Автоматическая ротация ключей по расписанию

## Anti‑replay (как у TOTP/одноразовых кодов)
- В БД хранится `last_ctr`
- Обновление `last_ctr` — атомарным SQL `update ... where last_ctr is null or :newCtr > last_ctr`
- Повтор одним и тем же `ctr/tag` не пройдёт; следующий `ctr` обязателен

## Роли пользователей и TTL профили
- **admin**: TTL 1 год, ротация ключей каждую неделю
- **permanent**: TTL 3 месяца, ротация ключей каждый месяц
- **temporary**: TTL 1 неделя, ротация ключей каждые 3 дня
- **guest**: TTL 1 день, ротация ключей каждые 12 часов

## Автоматическая ротация ключей
- Планировщик проверяет карты каждые 5 минут
- Ротация происходит с нулевым простоем (новый ключ генерируется и сохраняется)
- Старые ключи остаются валидными до истечения срока действия карты
- Версия ключа инкрементируется при каждой ротации

## QR коды для гостевых пропусков
- Формат: `CARD:{cardId}:OWNER:{owner}:ROLE:{role}:TIMESTAMP:{timestamp}`
- Base64URL кодирование для передачи
- Валидация включает проверку формата и соответствия карты
- Автоматическая генерация при создании карты с `generateQr: true`

## Удаленная аттестация ридеров
- Простой протокол challenge-response
- Ридер должен быть аттестован для выполнения верификации карт
- Заголовок `X-Reader-Id` обязателен для всех операций верификации

## Система аудита и логирования
- **Полное логирование всех событий системы:**
  - Создание карт (CARD_CREATED)
  - Верификация карт (CARD_VERIFIED)
  - Доступ разрешен (ACCESS_GRANTED)
  - Доступ запрещен (ACCESS_DENIED)
  - Административные действия (CARD_REVOKED, CARD_EXTENDED)
  - Генерация QR кодов (QR_GENERATED)
  - Ротация ключей (KEY_ROTATED)

- **История доступа с детальной информацией:**
  - Временные метки всех сканирований
  - IP адреса клиентов
  - User-Agent браузеров/клиентов
  - Время ответа системы
  - Причины неудач доступа
  - Значения счетчиков для anti-replay

- **Мониторинг безопасности:**
  - Поиск подозрительной активности
  - Частые неудачные попытки доступа
  - Подозрительные IP адреса
  - Обнаружение replay-атак

- **Статистика и аналитика:**
  - Статистика по типам событий
  - Статистика по ридерам и картам
  - Ежедневная и почасовая статистика
  - Анализ успешности операций

- **Экспорт данных:**
  - Экспорт событий аудита в CSV
  - Экспорт истории доступа в CSV
  - Фильтрация по датам, типам событий, пользователям
- Аттестация действительна в течение 1 часа

## Оффлайн-контроллер и автономность
- **Полная автономность**: Работа без подключения к сети
- **Локальный журнал**: Все события записываются локально
- **Безопасная репликация**: Синхронизация с подписями журналов
- **Потокобезопасность**: Поддержка многопоточных контроллеров
- **Портирование**: Готов к портированию на реальные встраиваемые системы

## Симуляторы карт и контроллеров
- **Независимые компоненты**: Работают без REST API
- **Реальная криптография**: HMAC-SHA256, AES-GCM
- **JavaCard совместимость**: Готовы к портированию на JavaCard
- **Встраиваемость**: Минимальные зависимости для микроконтроллеров

## API (OpenAPI)
Файл спецификации: `backend/src/main/resources/openapi.yaml`

### Основные эндпоинты:
- POST `/api/cards` — создать карту (вход: `owner`, `ttlSeconds`, `userRole`, `generateQr`; ответ: `status`, `cardId`, `owner`, `expiresAt`, `userRole`, `qrCode`, `keyVersion`)
- POST `/api/sim/response/{cardId}` — получить `ctr`, `tag` (эмулятор карты для демо/тестов)
- POST `/api/cards/verify` — верификация контроллером (вход: `cardId`, `ctr`, `tag`; заголовок: `X-Reader-Id`; ответ: `{status}`)

### QR коды:
- POST `/api/qr/verify` — верификация QR кода (вход: `qrCode`; ответ: `status`, `cardId`, `message`)
- GET `/api/qr/generate/{cardId}` — генерация QR кода для карты (ответ: `status`, `cardId`, `qrCode`, `owner`, `userRole`)

### Аттестация ридеров:
- POST `/api/attest/challenge/{readerId}` — генерация челленджа (ответ: `challenge`, `readerId`)
- POST `/api/attest/verify/{readerId}` — верификация аттестации (вход: `challenge`, `signature`; ответ: `status`, `readerId`, `attestedAt`)
- GET `/api/attest/status/{readerId}` — статус аттестации (ответ: `status`, `readerId`, `attestedAt`, `ageMinutes`)

### Админ:
- POST `/api/admin/revoke/{cardId}` — деактивировать
- POST `/api/admin/extend/{cardId}?extraSeconds=...` — продлить срок
- GET `/api/admin/status/{cardId}` — состояние карты (включая `userRole`, `keyVersion`, `nextRotationAt`, `qrCode`)
- GET `/api/admin/list` — список карт

### Аудит и логирование:
- GET `/api/audit/events` — события аудита с фильтрами (тип, категория, карта, ридер, успешность, даты)
- GET `/api/audit/access-history` — история доступа с фильтрами (карта, ридер, владелец, тип доступа, успешность, даты)
- GET `/api/audit/last-access/{cardId}` — последний доступ к карте
- GET `/api/audit/last-successful-access/{cardId}` — последний успешный доступ к карте
- GET `/api/audit/statistics/events` — статистика событий (по типам, категориям, дням)
- GET `/api/audit/statistics/access` — статистика доступа (по типам, ридерам, картам, часам)
- GET `/api/audit/suspicious-activity` — поиск подозрительной активности
- GET `/api/audit/frequent-failures` — частые неудачные попытки доступа
- GET `/api/audit/suspicious-ips` — подозрительные IP адреса
- GET `/api/audit/response-times` — среднее время ответа по ридерам
- GET `/api/audit/count/events` — количество событий за период
- GET `/api/audit/count/access` — количество записей доступа за период
- POST `/api/audit/cleanup` — очистка старых записей аудита
- GET `/api/audit/export/events` — экспорт событий аудита в CSV
- GET `/api/audit/export/access-history` — экспорт истории доступа в CSV

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

3) Примеры использования:

**Создание карты с ролью и QR кодом:**
```bash
curl -X POST http://localhost:8081/api/cards -H 'Content-Type: application/json' \
  -d '{"owner":"Guest User","ttlSeconds":7200,"userRole":"guest","generateQr":true}'
```

**Аттестация ридера:**
```bash
# 1) Получить челлендж
curl -X POST http://localhost:8081/api/attest/challenge/reader-001
# 2) Верифицировать аттестацию (с подписью устройства)
curl -X POST http://localhost:8081/api/attest/verify/reader-001 \
  -H 'Content-Type: application/json' \
  -d '{"challenge":"<challenge>","signature":"device-signature"}'
```

**Полный E2E с верификацией:**
```bash
# 1) Создать карту
curl -X POST http://localhost:8081/api/cards -H 'Content-Type: application/json' \
  -d '{"owner":"Demo","ttlSeconds":3600,"userRole":"permanent"}'
# 2) Получить ctr/tag (эмуляция карты)
curl -X POST http://localhost:8081/api/sim/response/<cardId>
# 3) Проверить на контроллере (с аттестованным ридером)
curl -X POST http://localhost:8081/api/cards/verify \
  -H 'Content-Type: application/json' \
  -H 'X-Reader-Id: reader-001' \
  -d '{"cardId":"<cardId>","ctr":"<ctr>","tag":"<tag>"}'
```

**Верификация QR кода:**
```bash
curl -X POST http://localhost:8081/api/qr/verify \
  -H 'Content-Type: application/json' \
  -d '{"qrCode":"<base64url-encoded-qr>"}'
```

**Работа с системой аудита:**
```bash
# Получить статистику событий
curl -X GET http://localhost:8081/api/audit/statistics/events

# Получить историю доступа к карте
curl -X GET "http://localhost:8081/api/audit/access-history?cardId=<cardId>&size=10"

# Найти подозрительную активность
curl -X GET http://localhost:8081/api/audit/suspicious-activity

# Получить последний доступ к карте
curl -X GET http://localhost:8081/api/audit/last-access/<cardId>

# Экспорт событий аудита в CSV
curl -X GET "http://localhost:8081/api/audit/export/events?startTime=2025-09-05T00:00:00Z&endTime=2025-09-05T23:59:59Z" > audit_events.csv
```

## Демонстрация оффлайн-компонентов

**Запуск демонстрации:**
```bash
# Сборка всех модулей
./gradlew build

# Запуск демонстрации
./gradlew :demo:run
```

**Что демонстрируется:**
- Создание оффлайн-контроллера с локальным журналом
- Генерация одноразовых кодов симулятором карты
- Проверка доступа симулятором контроллера
- QR коды для гостевых пропусков
- Anti-replay защита
- Синхронизация с центральным сервером
- Статистика и логирование

**Структура проекта:**
```
cityItHack/
├── backend/                 # REST API для демонстрации
├── offline-controller/      # Оффлайн-контроллер
├── card-simulator/         # Симулятор карты
├── controller-simulator/   # Симулятор контроллера
├── demo/                   # Демонстрационное приложение
├── FRONTEND_TASK.md        # Техническое задание для фронтенда
├── FRONTEND_EXAMPLES.md    # Примеры кода для фронтенда
└── PORTABILITY.md          # Руководство по портированию
```

## Интеграция с фронтендом

### Техническое задание для фронтенда
Подробное ТЗ для фронтенд-разработчика находится в файле `FRONTEND_TASK.md`. Включает:
- Новые роли пользователей (admin, permanent, temporary, guest)
- QR коды для гостевых пропусков
- Аттестация ридеров
- Ротация ключей
- Система аудита и логирования
- Обновленные API эндпоинты

### Примеры кода
Готовые примеры React компонентов в файле `FRONTEND_EXAMPLES.md`:
- Форма создания карты с ролями
- Компонент отображения QR кодов
- Аттестация ридеров
- Дашборд аудита и статистики
- Компоненты для мониторинга безопасности
- Обновленная верификация карт
- Список карт с новой информацией
- CSS стили и утилиты

### Ключевые изменения для фронтенда:
1. **Обязательный Reader ID** для всех операций верификации
2. **Роли пользователей** с разными TTL политиками
3. **QR коды** для гостевых пропусков
4. **Информация о ротации ключей** в интерфейсе
5. **Аттестация ридеров** через challenge-response
6. **Система аудита** с полным логированием всех событий
7. **История доступа** с временными метками и детальной информацией
8. **Мониторинг безопасности** с поиском подозрительной активности
9. **Статистика и аналитика** по всем операциям системы
10. **Экспорт данных** в CSV формате для анализа

## Безопасность
- `k_master_b64` не возвращается из API (скрыт через `@JsonIgnore`)
- Anti‑replay на уровне БД с атомарными операциями
- Учитываются `active` и `expiresAt`
- Аппаратная защищенность: ключи хранятся в обернутом виде (AES-GCM)
- Автоматическая ротация ключей предотвращает долгосрочные атаки
- Удаленная аттестация ридеров предотвращает использование поддельных устройств
- QR коды содержат временные метки для предотвращения повторного использования
- **Полная система аудита**: все события логируются с IP адресами, временными метками и детальной информацией
- **Мониторинг безопасности**: автоматическое обнаружение подозрительной активности и частых неудач
- **История доступа**: полная трассировка всех попыток доступа с причинами неудач
- **Временные метки**: точное время всех сканирований и верификаций
- Рекомендуется: ограничить CORS по доменам; защитить админ‑эндпоинты (Basic/JWT); включить rate limiting; использовать HTTPS в продакшене
