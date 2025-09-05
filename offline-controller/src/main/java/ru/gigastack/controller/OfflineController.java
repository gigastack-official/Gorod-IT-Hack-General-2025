package ru.gigastack.controller;

import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import javax.crypto.KeyGenerator;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Оффлайн контроллер для системы контроля доступа
 * Работает без сети, ведет локальный журнал событий
 */
public class OfflineController {
    
    private final String controllerId;
    private final Path journalPath;
    private final Map<String, CardInfo> localCardCache = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock journalLock = new ReentrantReadWriteLock();
    private final MessageDigest sha256;
    
    // Ключ для подписи журналов (в реальной системе - из HSM/TPM)
    private final byte[] journalSigningKey;
    
    public OfflineController(String controllerId, String journalDir) throws Exception {
        this.controllerId = controllerId;
        this.journalPath = Paths.get(journalDir, "controller-" + controllerId + ".journal");
        this.sha256 = MessageDigest.getInstance("SHA-256");
        
        // Генерируем ключ для подписи журналов
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        this.journalSigningKey = keyGen.generateKey().getEncoded();
        
        initializeJournal();
        loadLocalCardCache();
    }
    
    private void initializeJournal() throws IOException {
        Files.createDirectories(journalPath.getParent());
        if (!Files.exists(journalPath)) {
            Files.createFile(journalPath);
            writeJournalEntry("INIT", "Controller initialized", null);
        }
    }
    
    private void loadLocalCardCache() throws IOException {
        // В реальной системе здесь была бы синхронизация с центральным сервером
        // Пока загружаем пустой кэш
        writeJournalEntry("CACHE_LOAD", "Local card cache loaded", null);
    }
    
    /**
     * Проверка доступа по карте (основная функция)
     */
    public AccessResult verifyAccess(String cardId, byte[] ctr, byte[] tag) {
        try {
            journalLock.writeLock().lock();
            
            // Проверяем кэш карт
            CardInfo cardInfo = localCardCache.get(cardId);
            if (cardInfo == null) {
                writeJournalEntry("ACCESS_DENIED", "Card not found in cache", cardId);
                return new AccessResult(false, "Card not found", Instant.now());
            }
            
            // Проверяем активность карты
            if (!cardInfo.isActive()) {
                writeJournalEntry("ACCESS_DENIED", "Card inactive", cardId);
                return new AccessResult(false, "Card inactive", Instant.now());
            }
            
            // Проверяем срок действия
            if (cardInfo.getExpiresAt() != null && Instant.now().isAfter(cardInfo.getExpiresAt())) {
                writeJournalEntry("ACCESS_DENIED", "Card expired", cardId);
                return new AccessResult(false, "Card expired", Instant.now());
            }
            
            // Проверяем anti-replay
            if (ctr != null && cardInfo.getLastCtr() != null) {
                long ctrValue = bytesToLongLE(ctr);
                if (ctrValue <= cardInfo.getLastCtr()) {
                    writeJournalEntry("ACCESS_DENIED", "Replay attack detected", cardId);
                    return new AccessResult(false, "Replay attack", Instant.now());
                }
            }
            
            // Проверяем HMAC (если есть tag)
            if (tag != null && cardInfo.getMasterKey() != null) {
                if (!verifyHMAC(cardId, ctr, tag, cardInfo.getMasterKey())) {
                    writeJournalEntry("ACCESS_DENIED", "Invalid HMAC", cardId);
                    return new AccessResult(false, "Invalid authentication", Instant.now());
                }
            }
            
            // Обновляем счетчик
            if (ctr != null) {
                long ctrValue = bytesToLongLE(ctr);
                cardInfo.setLastCtr(ctrValue);
            }
            
            // Записываем успешный доступ
            writeJournalEntry("ACCESS_GRANTED", "Access granted to " + cardInfo.getOwner(), cardId);
            
            return new AccessResult(true, "Access granted", Instant.now());
            
        } catch (Exception e) {
            try {
                writeJournalEntry("ERROR", "Verification error: " + e.getMessage(), cardId);
            } catch (IOException ioE) {
                // Логируем ошибку записи в журнал
            }
            return new AccessResult(false, "System error", Instant.now());
        } finally {
            journalLock.writeLock().unlock();
        }
    }
    
    /**
     * Добавление карты в локальный кэш
     */
    public void addCardToCache(CardInfo cardInfo) {
        localCardCache.put(cardInfo.getCardId(), cardInfo);
        try {
            writeJournalEntry("CARD_ADDED", "Card added to cache: " + cardInfo.getOwner(), cardInfo.getCardId());
        } catch (IOException e) {
            // Логируем ошибку
        }
    }
    
    /**
     * Синхронизация с центральным сервером
     */
    public SyncResult syncWithServer(String serverUrl) {
        try {
            journalLock.readLock().lock();
            
            // Читаем журнал для отправки
            List<JournalEntry> entries = readJournalEntries();
            
            // В реальной системе здесь был бы HTTP запрос к серверу
            // Пока симулируем успешную синхронизацию
            
            writeJournalEntry("SYNC", "Synchronized with server: " + serverUrl, null);
            
            return new SyncResult(true, entries.size() + " entries synchronized", Instant.now());
            
        } catch (Exception e) {
            try {
                writeJournalEntry("SYNC_ERROR", "Sync failed: " + e.getMessage(), null);
            } catch (IOException ioE) {
                // Логируем ошибку
            }
            return new SyncResult(false, "Sync failed: " + e.getMessage(), Instant.now());
        } finally {
            journalLock.readLock().unlock();
        }
    }
    
    /**
     * Получение статистики контроллера
     */
    public ControllerStats getStats() {
        try {
            journalLock.readLock().lock();
            
            List<JournalEntry> entries = readJournalEntries();
            long grantedCount = entries.stream()
                .filter(e -> "ACCESS_GRANTED".equals(e.getEventType()))
                .count();
            long deniedCount = entries.stream()
                .filter(e -> "ACCESS_DENIED".equals(e.getEventType()))
                .count();
            
            return new ControllerStats(
                controllerId,
                entries.size(),
                grantedCount,
                deniedCount,
                localCardCache.size(),
                Instant.now()
            );
            
        } catch (Exception e) {
            return new ControllerStats(controllerId, 0, 0, 0, 0, Instant.now());
        } finally {
            journalLock.readLock().unlock();
        }
    }
    
    private boolean verifyHMAC(String cardId, byte[] ctr, byte[] tag, byte[] masterKey) {
        try {
            // Создаем данные для HMAC: cardId + ctr
            byte[] cardIdBytes = Base64.getUrlDecoder().decode(cardId);
            byte[] data = new byte[cardIdBytes.length + ctr.length];
            System.arraycopy(cardIdBytes, 0, data, 0, cardIdBytes.length);
            System.arraycopy(ctr, 0, data, cardIdBytes.length, ctr.length);
            
            // Вычисляем HMAC
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(masterKey, "HmacSHA256"));
            byte[] computedTag = mac.doFinal(data);
            
            // Сравниваем первые 16 байт
            byte[] expectedTag = Arrays.copyOf(computedTag, 16);
            return Arrays.equals(expectedTag, tag);
            
        } catch (Exception e) {
            return false;
        }
    }
    
    private void writeJournalEntry(String eventType, String message, String cardId) throws IOException {
        JournalEntry entry = new JournalEntry(
            Instant.now(),
            controllerId,
            eventType,
            message,
            cardId,
            generateSignature(eventType + ":" + message + ":" + cardId)
        );
        
        String line = entry.toJson() + "\n";
        Files.write(journalPath, line.getBytes(), StandardOpenOption.APPEND, StandardOpenOption.CREATE);
    }
    
    private List<JournalEntry> readJournalEntries() throws IOException {
        List<JournalEntry> entries = new ArrayList<>();
        if (Files.exists(journalPath)) {
            List<String> lines = Files.readAllLines(journalPath);
            for (String line : lines) {
                if (!line.trim().isEmpty()) {
                    try {
                        entries.add(JournalEntry.fromJson(line));
                    } catch (Exception e) {
                        // Пропускаем некорректные записи
                    }
                }
            }
        }
        return entries;
    }
    
    private String generateSignature(String data) {
        try {
            sha256.reset();
            sha256.update(data.getBytes());
            sha256.update(journalSigningKey);
            byte[] hash = sha256.digest();
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            return "INVALID_SIGNATURE";
        }
    }
    
    private long bytesToLongLE(byte[] bytes) {
        if (bytes == null || bytes.length != 8) return -1L;
        long result = 0L;
        for (int i = 7; i >= 0; i--) {
            result = (result << 8) | (bytes[i] & 0xFFL);
        }
        return result;
    }
    
    // Внутренние классы для данных
    public static class CardInfo {
        private String cardId;
        private String owner;
        private byte[] masterKey;
        private Instant expiresAt;
        private boolean active;
        private Long lastCtr;
        
        // Конструкторы, геттеры, сеттеры
        public CardInfo(String cardId, String owner, byte[] masterKey, Instant expiresAt, boolean active) {
            this.cardId = cardId;
            this.owner = owner;
            this.masterKey = masterKey;
            this.expiresAt = expiresAt;
            this.active = active;
        }
        
        // Геттеры и сеттеры
        public String getCardId() { return cardId; }
        public String getOwner() { return owner; }
        public byte[] getMasterKey() { return masterKey; }
        public Instant getExpiresAt() { return expiresAt; }
        public boolean isActive() { return active; }
        public Long getLastCtr() { return lastCtr; }
        public void setLastCtr(Long lastCtr) { this.lastCtr = lastCtr; }
    }
    
    public static class AccessResult {
        private boolean granted;
        private String message;
        private Instant timestamp;
        
        public AccessResult(boolean granted, String message, Instant timestamp) {
            this.granted = granted;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Геттеры
        public boolean isGranted() { return granted; }
        public String getMessage() { return message; }
        public Instant getTimestamp() { return timestamp; }
    }
    
    public static class SyncResult {
        private boolean success;
        private String message;
        private Instant timestamp;
        
        public SyncResult(boolean success, String message, Instant timestamp) {
            this.success = success;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Геттеры
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Instant getTimestamp() { return timestamp; }
    }
    
    public static class ControllerStats {
        private String controllerId;
        private long totalEvents;
        private long grantedAccess;
        private long deniedAccess;
        private int cachedCards;
        private Instant lastUpdate;
        
        public ControllerStats(String controllerId, long totalEvents, long grantedAccess, 
                             long deniedAccess, int cachedCards, Instant lastUpdate) {
            this.controllerId = controllerId;
            this.totalEvents = totalEvents;
            this.grantedAccess = grantedAccess;
            this.deniedAccess = deniedAccess;
            this.cachedCards = cachedCards;
            this.lastUpdate = lastUpdate;
        }
        
        // Геттеры
        public String getControllerId() { return controllerId; }
        public long getTotalEvents() { return totalEvents; }
        public long getGrantedAccess() { return grantedAccess; }
        public long getDeniedAccess() { return deniedAccess; }
        public int getCachedCards() { return cachedCards; }
        public Instant getLastUpdate() { return lastUpdate; }
    }
    
    public static class JournalEntry {
        private Instant timestamp;
        private String controllerId;
        private String eventType;
        private String message;
        private String cardId;
        private String signature;
        
        public JournalEntry(Instant timestamp, String controllerId, String eventType, 
                           String message, String cardId, String signature) {
            this.timestamp = timestamp;
            this.controllerId = controllerId;
            this.eventType = eventType;
            this.message = message;
            this.cardId = cardId;
            this.signature = signature;
        }
        
        public String toJson() {
            return String.format(
                "{\"timestamp\":\"%s\",\"controllerId\":\"%s\",\"eventType\":\"%s\",\"message\":\"%s\",\"cardId\":\"%s\",\"signature\":\"%s\"}",
                timestamp.toString(), controllerId, eventType, message, cardId, signature
            );
        }
        
        public static JournalEntry fromJson(String json) {
            // Простой парсинг JSON (в реальной системе использовали бы Jackson)
            // Пока возвращаем заглушку
            return new JournalEntry(Instant.now(), "unknown", "UNKNOWN", "parsed", null, "signature");
        }
        
        // Геттеры
        public Instant getTimestamp() { return timestamp; }
        public String getControllerId() { return controllerId; }
        public String getEventType() { return eventType; }
        public String getMessage() { return message; }
        public String getCardId() { return cardId; }
        public String getSignature() { return signature; }
    }
}
