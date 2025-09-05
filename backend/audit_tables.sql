-- Создание таблиц для системы аудита и логирования

-- Таблица событий аудита
CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL,
    card_id VARCHAR(64),
    reader_id VARCHAR(64),
    owner VARCHAR(100),
    user_role VARCHAR(32),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    message VARCHAR(500),
    error_code VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(100),
    additional_data TEXT
);

-- Таблица истории доступа
CREATE TABLE IF NOT EXISTS access_history (
    id BIGSERIAL PRIMARY KEY,
    card_id VARCHAR(64) NOT NULL,
    reader_id VARCHAR(64) NOT NULL,
    owner VARCHAR(100),
    user_role VARCHAR(32),
    access_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    access_type VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    counter_value BIGINT,
    ip_address VARCHAR(45),
    location VARCHAR(200),
    device_info VARCHAR(500),
    failure_reason VARCHAR(200),
    response_time_ms BIGINT,
    additional_metadata TEXT
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_events_card_id ON audit_events(card_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_reader_id ON audit_events(reader_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_success ON audit_events(success);
CREATE INDEX IF NOT EXISTS idx_audit_events_ip ON audit_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_access_history_timestamp ON access_history(access_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_history_card_id ON access_history(card_id);
CREATE INDEX IF NOT EXISTS idx_access_history_reader_id ON access_history(reader_id);
CREATE INDEX IF NOT EXISTS idx_access_history_type ON access_history(access_type);
CREATE INDEX IF NOT EXISTS idx_access_history_success ON access_history(success);
CREATE INDEX IF NOT EXISTS idx_access_history_ip ON access_history(ip_address);

-- Составные индексы для часто используемых запросов
CREATE INDEX IF NOT EXISTS idx_audit_events_card_timestamp ON audit_events(card_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_reader_timestamp ON audit_events(reader_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_success_timestamp ON audit_events(success, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_access_history_card_timestamp ON access_history(card_id, access_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_history_reader_timestamp ON access_history(reader_id, access_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_history_success_timestamp ON access_history(success, access_timestamp DESC);

-- Индексы для поиска подозрительной активности
CREATE INDEX IF NOT EXISTS idx_audit_events_failures ON audit_events(success, event_timestamp DESC) WHERE success = FALSE;
CREATE INDEX IF NOT EXISTS idx_access_history_failures ON access_history(success, access_timestamp DESC) WHERE success = FALSE;

-- Комментарии к таблицам
COMMENT ON TABLE audit_events IS 'События аудита системы контроля доступа';
COMMENT ON TABLE access_history IS 'История доступа к картам';

COMMENT ON COLUMN audit_events.event_type IS 'Тип события (CARD_CREATED, ACCESS_GRANTED, etc.)';
COMMENT ON COLUMN audit_events.event_category IS 'Категория события (AUTHENTICATION, AUTHORIZATION, etc.)';
COMMENT ON COLUMN audit_events.card_id IS 'ID карты (если применимо)';
COMMENT ON COLUMN audit_events.reader_id IS 'ID ридера (если применимо)';
COMMENT ON COLUMN audit_events.success IS 'Успешность операции';
COMMENT ON COLUMN audit_events.error_code IS 'Код ошибки (если есть)';
COMMENT ON COLUMN audit_events.ip_address IS 'IP адрес клиента';
COMMENT ON COLUMN audit_events.user_agent IS 'User-Agent браузера/клиента';
COMMENT ON COLUMN audit_events.session_id IS 'ID сессии';
COMMENT ON COLUMN audit_events.additional_data IS 'Дополнительные данные в JSON формате';

COMMENT ON COLUMN access_history.access_type IS 'Тип доступа (CARD_VERIFICATION, QR_SCAN, etc.)';
COMMENT ON COLUMN access_history.counter_value IS 'Значение счетчика для anti-replay';
COMMENT ON COLUMN access_history.location IS 'Местоположение доступа';
COMMENT ON COLUMN access_history.device_info IS 'Информация об устройстве';
COMMENT ON COLUMN access_history.failure_reason IS 'Причина неудачи (если есть)';
COMMENT ON COLUMN access_history.response_time_ms IS 'Время ответа в миллисекундах';
COMMENT ON COLUMN access_history.additional_metadata IS 'Дополнительные метаданные в JSON формате';

-- Функция для автоматической очистки старых записей (опционально)
CREATE OR REPLACE FUNCTION cleanup_old_audit_records()
RETURNS void AS $$
BEGIN
    -- Удаляем записи старше 90 дней
    DELETE FROM audit_events WHERE event_timestamp < NOW() - INTERVAL '90 days';
    DELETE FROM access_history WHERE access_timestamp < NOW() - INTERVAL '90 days';
    
    -- Логируем количество удаленных записей
    RAISE NOTICE 'Cleaned up old audit records';
END;
$$ LANGUAGE plpgsql;

-- Создание представлений для удобного анализа
CREATE OR REPLACE VIEW recent_access_attempts AS
SELECT 
    ah.card_id,
    ah.reader_id,
    ah.owner,
    ah.user_role,
    ah.access_timestamp,
    ah.access_type,
    ah.success,
    ah.failure_reason,
    ah.response_time_ms,
    ah.ip_address
FROM access_history ah
WHERE ah.access_timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY ah.access_timestamp DESC;

CREATE OR REPLACE VIEW failed_access_summary AS
SELECT 
    ah.card_id,
    ah.reader_id,
    ah.owner,
    COUNT(*) as failure_count,
    MAX(ah.access_timestamp) as last_failure,
    STRING_AGG(DISTINCT ah.failure_reason, ', ') as failure_reasons
FROM access_history ah
WHERE ah.success = FALSE 
    AND ah.access_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY ah.card_id, ah.reader_id, ah.owner
HAVING COUNT(*) > 1
ORDER BY failure_count DESC;

CREATE OR REPLACE VIEW suspicious_ip_addresses AS
SELECT 
    ah.ip_address,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE ah.success = FALSE) as failed_attempts,
    COUNT(DISTINCT ah.card_id) as unique_cards,
    COUNT(DISTINCT ah.reader_id) as unique_readers,
    MAX(ah.access_timestamp) as last_attempt
FROM access_history ah
WHERE ah.access_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY ah.ip_address
HAVING COUNT(*) FILTER (WHERE ah.success = FALSE) > 3
ORDER BY failed_attempts DESC;

-- Представление для статистики по дням
CREATE OR REPLACE VIEW daily_access_stats AS
SELECT 
    DATE(ah.access_timestamp) as access_date,
    COUNT(*) as total_access,
    COUNT(*) FILTER (WHERE ah.success = TRUE) as successful_access,
    COUNT(*) FILTER (WHERE ah.success = FALSE) as failed_access,
    COUNT(DISTINCT ah.card_id) as unique_cards,
    COUNT(DISTINCT ah.reader_id) as unique_readers,
    AVG(ah.response_time_ms) FILTER (WHERE ah.response_time_ms IS NOT NULL) as avg_response_time_ms
FROM access_history ah
WHERE ah.access_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(ah.access_timestamp)
ORDER BY access_date DESC;
