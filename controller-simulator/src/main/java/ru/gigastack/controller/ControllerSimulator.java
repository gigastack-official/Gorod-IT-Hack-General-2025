package ru.gigastack.controller;

import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Симулятор контроллера для системы контроля доступа
 * Проверяет одноразовые коды и принимает решения о доступе
 */
public class ControllerSimulator {
    
    private final String controllerId;
    private final Map<String, CardData> cardDatabase;
    private final Path accessLogPath;
    private final SecureRandom secureRandom;
    
    public ControllerSimulator(String controllerId, String logDir) throws IOException {
        this.controllerId = controllerId;
        this.cardDatabase = new ConcurrentHashMap<>();
        this.accessLogPath = Paths.get(logDir, "controller-" + controllerId + "-access.log");
        this.secureRandom = new SecureRandom();
        
        // Создаем директорию для логов
        Files.createDirectories(accessLogPath.getParent());
        
        // Инициализируем лог
        if (!Files.exists(accessLogPath)) {
            Files.createFile(accessLogPath);
            logAccess("INIT", "Controller initialized", null, null, true);
        }
    }
    
    /**
     * Добавление карты в базу данных контроллера
     */
    public void addCard(String cardId, String owner, byte[] masterKey, Instant expiresAt) {
        CardData cardData = new CardData(cardId, owner, masterKey, expiresAt, true, 0L);
        cardDatabase.put(cardId, cardData);
        logAccess("CARD_ADDED", "Card added: " + owner, cardId, null, true);
    }
    
    /**
     * Проверка доступа по одноразовому коду
     */
    public AccessDecision verifyAccess(String cardId, String ctr, String tag) {
        try {
            // Проверяем наличие карты
            CardData cardData = cardDatabase.get(cardId);
            if (cardData == null) {
                logAccess("ACCESS_DENIED", "Card not found", cardId, ctr, false);
                return new AccessDecision(false, "Card not found", Instant.now());
            }
            
            // Проверяем активность карты
            if (!cardData.isActive()) {
                logAccess("ACCESS_DENIED", "Card inactive", cardId, ctr, false);
                return new AccessDecision(false, "Card inactive", Instant.now());
            }
            
            // Проверяем срок действия
            if (cardData.getExpiresAt() != null && Instant.now().isAfter(cardData.getExpiresAt())) {
                logAccess("ACCESS_DENIED", "Card expired", cardId, ctr, false);
                return new AccessDecision(false, "Card expired", Instant.now());
            }
            
            // Декодируем данные
            byte[] ctrBytes = Base64.getUrlDecoder().decode(ctr);
            byte[] tagBytes = Base64.getUrlDecoder().decode(tag);
            
            // Проверяем anti-replay
            long ctrValue = bytesToLongLE(ctrBytes);
            if (ctrValue <= cardData.getLastCtr()) {
                logAccess("ACCESS_DENIED", "Replay attack detected", cardId, ctr, false);
                return new AccessDecision(false, "Replay attack", Instant.now());
            }
            
            // Проверяем HMAC
            if (!verifyHMAC(cardId, ctrBytes, tagBytes, cardData.getMasterKey())) {
                logAccess("ACCESS_DENIED", "Invalid authentication", cardId, ctr, false);
                return new AccessDecision(false, "Invalid authentication", Instant.now());
            }
            
            // Обновляем счетчик
            cardData.setLastCtr(ctrValue);
            
            // Логируем успешный доступ
            logAccess("ACCESS_GRANTED", "Access granted to " + cardData.getOwner(), cardId, ctr, true);
            
            return new AccessDecision(true, "Access granted", Instant.now());
            
        } catch (Exception e) {
            logAccess("ERROR", "Verification error: " + e.getMessage(), cardId, ctr, false);
            return new AccessDecision(false, "System error", Instant.now());
        }
    }
    
    /**
     * Проверка доступа по QR коду
     */
    public AccessDecision verifyQRCode(String qrCode) {
        try {
            // Декодируем QR код
            String decoded = new String(Base64.getUrlDecoder().decode(qrCode));
            String[] parts = decoded.split(":");
            
            if (parts.length < 6 || !"CARD".equals(parts[0])) {
                logAccess("QR_DENIED", "Invalid QR format", null, null, false);
                return new AccessDecision(false, "Invalid QR code format", Instant.now());
            }
            
            String cardId = parts[1];
            String owner = parts[3];
            String role = parts[5];
            
            // Проверяем наличие карты
            CardData cardData = cardDatabase.get(cardId);
            if (cardData == null) {
                logAccess("QR_DENIED", "Card not found in QR", cardId, null, false);
                return new AccessDecision(false, "Card not found", Instant.now());
            }
            
            // Проверяем соответствие владельца
            if (!owner.equals(cardData.getOwner())) {
                logAccess("QR_DENIED", "Owner mismatch in QR", cardId, null, false);
                return new AccessDecision(false, "Owner mismatch", Instant.now());
            }
            
            // Проверяем активность и срок действия
            if (!cardData.isActive()) {
                logAccess("QR_DENIED", "Card inactive", cardId, null, false);
                return new AccessDecision(false, "Card inactive", Instant.now());
            }
            
            if (cardData.getExpiresAt() != null && Instant.now().isAfter(cardData.getExpiresAt())) {
                logAccess("QR_DENIED", "Card expired", cardId, null, false);
                return new AccessDecision(false, "Card expired", Instant.now());
            }
            
            // Логируем успешный доступ
            logAccess("QR_GRANTED", "QR access granted to " + owner + " (role: " + role + ")", cardId, null, true);
            
            return new AccessDecision(true, "QR access granted", Instant.now());
            
        } catch (Exception e) {
            logAccess("QR_ERROR", "QR verification error: " + e.getMessage(), null, null, false);
            return new AccessDecision(false, "QR verification error", Instant.now());
        }
    }
    
    /**
     * Получение статистики контроллера
     */
    public ControllerStats getStats() {
        try {
            List<String> logLines = Files.readAllLines(accessLogPath);
            long grantedCount = logLines.stream()
                .filter(line -> line.contains("ACCESS_GRANTED") || line.contains("QR_GRANTED"))
                .count();
            long deniedCount = logLines.stream()
                .filter(line -> line.contains("ACCESS_DENIED") || line.contains("QR_DENIED"))
                .count();
            
            return new ControllerStats(
                controllerId,
                logLines.size(),
                grantedCount,
                deniedCount,
                cardDatabase.size(),
                Instant.now()
            );
            
        } catch (IOException e) {
            return new ControllerStats(controllerId, 0, 0, 0, cardDatabase.size(), Instant.now());
        }
    }
    
    /**
     * Экспорт журнала доступа
     */
    public String exportAccessLog() throws IOException {
        if (Files.exists(accessLogPath)) {
            return String.join("\n", Files.readAllLines(accessLogPath));
        }
        return "";
    }
    
    /**
     * Очистка старых записей (для экономии места)
     */
    public void cleanupOldLogs(int keepDays) throws IOException {
        if (Files.exists(accessLogPath)) {
            List<String> lines = Files.readAllLines(accessLogPath);
            Instant cutoff = Instant.now().minusSeconds(keepDays * 24 * 60 * 60L);
            
            List<String> filteredLines = new ArrayList<>();
            for (String line : lines) {
                try {
                    // Простой парсинг временной метки из лога
                    if (line.contains("INIT") || isRecentLogEntry(line, cutoff)) {
                        filteredLines.add(line);
                    }
                } catch (Exception e) {
                    // Пропускаем некорректные записи
                }
            }
            
            Files.write(accessLogPath, filteredLines);
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
    
    private void logAccess(String eventType, String message, String cardId, String ctr, boolean success) {
        try {
            String timestamp = Instant.now().toString();
            String logEntry = String.format("[%s] %s: %s (Card: %s, CTR: %s, Success: %s)",
                timestamp, eventType, message, cardId, ctr, success);
            
            Files.write(accessLogPath, (logEntry + "\n").getBytes(), 
                StandardOpenOption.APPEND, StandardOpenOption.CREATE);
                
        } catch (IOException e) {
            // Логируем ошибку записи в лог
            System.err.println("Failed to write to access log: " + e.getMessage());
        }
    }
    
    private boolean isRecentLogEntry(String line, Instant cutoff) {
        try {
            // Простое извлечение времени из лога
            int start = line.indexOf('[') + 1;
            int end = line.indexOf(']');
            if (start > 0 && end > start) {
                String timeStr = line.substring(start, end);
                Instant logTime = Instant.parse(timeStr);
                return logTime.isAfter(cutoff);
            }
        } catch (Exception e) {
            // Если не можем распарсить время, считаем запись новой
        }
        return true;
    }
    
    private long bytesToLongLE(byte[] bytes) {
        if (bytes == null || bytes.length != 8) return -1L;
        long result = 0L;
        for (int i = 7; i >= 0; i--) {
            result = (result << 8) | (bytes[i] & 0xFFL);
        }
        return result;
    }
    
    // Внутренние классы
    public static class CardData {
        private String cardId;
        private String owner;
        private byte[] masterKey;
        private Instant expiresAt;
        private boolean active;
        private long lastCtr;
        
        public CardData(String cardId, String owner, byte[] masterKey, Instant expiresAt, boolean active, long lastCtr) {
            this.cardId = cardId;
            this.owner = owner;
            this.masterKey = masterKey;
            this.expiresAt = expiresAt;
            this.active = active;
            this.lastCtr = lastCtr;
        }
        
        // Геттеры и сеттеры
        public String getCardId() { return cardId; }
        public String getOwner() { return owner; }
        public byte[] getMasterKey() { return masterKey; }
        public Instant getExpiresAt() { return expiresAt; }
        public boolean isActive() { return active; }
        public long getLastCtr() { return lastCtr; }
        public void setLastCtr(long lastCtr) { this.lastCtr = lastCtr; }
    }
    
    public static class AccessDecision {
        private boolean granted;
        private String message;
        private Instant timestamp;
        
        public AccessDecision(boolean granted, String message, Instant timestamp) {
            this.granted = granted;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Геттеры
        public boolean isGranted() { return granted; }
        public String getMessage() { return message; }
        public Instant getTimestamp() { return timestamp; }
        
        @Override
        public String toString() {
            return String.format("AccessDecision{granted=%s, message='%s', time=%s}", 
                granted, message, timestamp);
        }
    }
    
    public static class ControllerStats {
        private String controllerId;
        private long totalEvents;
        private long grantedAccess;
        private long deniedAccess;
        private int registeredCards;
        private Instant lastUpdate;
        
        public ControllerStats(String controllerId, long totalEvents, long grantedAccess, 
                             long deniedAccess, int registeredCards, Instant lastUpdate) {
            this.controllerId = controllerId;
            this.totalEvents = totalEvents;
            this.grantedAccess = grantedAccess;
            this.deniedAccess = deniedAccess;
            this.registeredCards = registeredCards;
            this.lastUpdate = lastUpdate;
        }
        
        // Геттеры
        public String getControllerId() { return controllerId; }
        public long getTotalEvents() { return totalEvents; }
        public long getGrantedAccess() { return grantedAccess; }
        public long getDeniedAccess() { return deniedAccess; }
        public int getRegisteredCards() { return registeredCards; }
        public Instant getLastUpdate() { return lastUpdate; }
        
        @Override
        public String toString() {
            return String.format("ControllerStats{id='%s', events=%d, granted=%d, denied=%d, cards=%d, updated=%s}", 
                controllerId, totalEvents, grantedAccess, deniedAccess, registeredCards, lastUpdate);
        }
    }
}
