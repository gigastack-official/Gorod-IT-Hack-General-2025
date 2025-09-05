package ru.gigastack.card;

import java.security.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Симулятор карты для системы контроля доступа
 * Генерирует одноразовые коды на основе HMAC-SHA256
 */
public class CardSimulator {
    
    private final String cardId;
    private final byte[] masterKey;
    private final String owner;
    private final Instant expiresAt;
    private final AtomicLong counter;
    private final SecureRandom secureRandom;
    
    public CardSimulator(String cardId, byte[] masterKey, String owner, Instant expiresAt) {
        this.cardId = cardId;
        this.masterKey = masterKey;
        this.owner = owner;
        this.expiresAt = expiresAt;
        this.counter = new AtomicLong(0);
        this.secureRandom = new SecureRandom();
    }
    
    /**
     * Генерация одноразового кода (ctr + tag)
     */
    public OneTimeCode generateCode() {
        try {
            // Проверяем срок действия
            if (expiresAt != null && Instant.now().isAfter(expiresAt)) {
                throw new IllegalStateException("Card expired");
            }
            
            // Генерируем новый счетчик
            long ctrValue = counter.incrementAndGet();
            byte[] ctrBytes = longToBytesLE(ctrValue);
            
            // Создаем данные для HMAC: cardId + ctr
            byte[] cardIdBytes = Base64.getUrlDecoder().decode(cardId);
            byte[] data = new byte[cardIdBytes.length + ctrBytes.length];
            System.arraycopy(cardIdBytes, 0, data, 0, cardIdBytes.length);
            System.arraycopy(ctrBytes, 0, data, cardIdBytes.length, ctrBytes.length);
            
            // Вычисляем HMAC
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(masterKey, "HmacSHA256"));
            byte[] fullTag = mac.doFinal(data);
            
            // Берем первые 16 байт как tag
            byte[] tagBytes = Arrays.copyOf(fullTag, 16);
            
            return new OneTimeCode(
                Base64.getUrlEncoder().withoutPadding().encodeToString(ctrBytes),
                Base64.getUrlEncoder().withoutPadding().encodeToString(tagBytes),
                ctrValue,
                Instant.now()
            );
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate code", e);
        }
    }
    
    /**
     * Проверка валидности карты
     */
    public boolean isValid() {
        return expiresAt == null || Instant.now().isBefore(expiresAt);
    }
    
    /**
     * Получение информации о карте
     */
    public CardInfo getInfo() {
        return new CardInfo(cardId, owner, expiresAt, counter.get(), isValid());
    }
    
    /**
     * Создание карты из данных (для демонстрации)
     */
    public static CardSimulator createFromData(String cardId, String owner, long ttlSeconds) {
        try {
            // Генерируем случайный мастер-ключ
            byte[] masterKey = new byte[32];
            new SecureRandom().nextBytes(masterKey);
            
            Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);
            
            return new CardSimulator(cardId, masterKey, owner, expiresAt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create card", e);
        }
    }
    
    /**
     * Создание карты с предопределенным ключом (для тестирования)
     */
    public static CardSimulator createWithKey(String cardId, String owner, byte[] masterKey, long ttlSeconds) {
        Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);
        return new CardSimulator(cardId, masterKey, owner, expiresAt);
    }
    
    private byte[] longToBytesLE(long value) {
        byte[] bytes = new byte[8];
        for (int i = 0; i < 8; i++) {
            bytes[i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        return bytes;
    }
    
    // Внутренние классы
    public static class OneTimeCode {
        private final String ctr;
        private final String tag;
        private final long counterValue;
        private final Instant generatedAt;
        
        public OneTimeCode(String ctr, String tag, long counterValue, Instant generatedAt) {
            this.ctr = ctr;
            this.tag = tag;
            this.counterValue = counterValue;
            this.generatedAt = generatedAt;
        }
        
        // Геттеры
        public String getCtr() { return ctr; }
        public String getTag() { return tag; }
        public long getCounterValue() { return counterValue; }
        public Instant getGeneratedAt() { return generatedAt; }
        
        @Override
        public String toString() {
            return String.format("OneTimeCode{ctr='%s', tag='%s', counter=%d, time=%s}", 
                ctr, tag, counterValue, generatedAt);
        }
    }
    
    public static class CardInfo {
        private final String cardId;
        private final String owner;
        private final Instant expiresAt;
        private final long currentCounter;
        private final boolean valid;
        
        public CardInfo(String cardId, String owner, Instant expiresAt, long currentCounter, boolean valid) {
            this.cardId = cardId;
            this.owner = owner;
            this.expiresAt = expiresAt;
            this.currentCounter = currentCounter;
            this.valid = valid;
        }
        
        // Геттеры
        public String getCardId() { return cardId; }
        public String getOwner() { return owner; }
        public Instant getExpiresAt() { return expiresAt; }
        public long getCurrentCounter() { return currentCounter; }
        public boolean isValid() { return valid; }
        
        @Override
        public String toString() {
            return String.format("CardInfo{id='%s', owner='%s', expires=%s, counter=%d, valid=%s}", 
                cardId, owner, expiresAt, currentCounter, valid);
        }
    }
}
