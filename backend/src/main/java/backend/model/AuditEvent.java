package backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Модель для аудита событий системы контроля доступа
 */
@Entity
@Table(name = "audit_events")
public class AuditEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;
    
    @Column(name = "event_category", nullable = false, length = 30)
    private String eventCategory;
    
    @Column(name = "card_id", length = 64)
    private String cardId;
    
    @Column(name = "reader_id", length = 64)
    private String readerId;
    
    @Column(name = "owner", length = 100)
    private String owner;
    
    @Column(name = "user_role", length = 32)
    private String userRole;
    
    @Column(name = "event_timestamp", nullable = false)
    private Instant eventTimestamp;
    
    @Column(name = "success", nullable = false)
    private boolean success;
    
    @Column(name = "message", length = 500)
    private String message;
    
    @Column(name = "error_code", length = 50)
    private String errorCode;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "session_id", length = 100)
    private String sessionId;
    
    @Column(name = "additional_data", columnDefinition = "TEXT")
    private String additionalData;
    
    // Конструкторы
    public AuditEvent() {}
    
    public AuditEvent(String eventType, String eventCategory, String cardId, String readerId, 
                     String owner, String userRole, boolean success, String message) {
        this.eventType = eventType;
        this.eventCategory = eventCategory;
        this.cardId = cardId;
        this.readerId = readerId;
        this.owner = owner;
        this.userRole = userRole;
        this.success = success;
        this.message = message;
        this.eventTimestamp = Instant.now();
    }
    
    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    
    public String getEventCategory() { return eventCategory; }
    public void setEventCategory(String eventCategory) { this.eventCategory = eventCategory; }
    
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    
    public String getReaderId() { return readerId; }
    public void setReaderId(String readerId) { this.readerId = readerId; }
    
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    
    public Instant getEventTimestamp() { return eventTimestamp; }
    public void setEventTimestamp(Instant eventTimestamp) { this.eventTimestamp = eventTimestamp; }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public String getAdditionalData() { return additionalData; }
    public void setAdditionalData(String additionalData) { this.additionalData = additionalData; }
    
    // Константы для типов событий
    public static class EventType {
        public static final String CARD_CREATED = "CARD_CREATED";
        public static final String CARD_VERIFIED = "CARD_VERIFIED";
        public static final String CARD_REVOKED = "CARD_REVOKED";
        public static final String CARD_EXTENDED = "CARD_EXTENDED";
        public static final String QR_GENERATED = "QR_GENERATED";
        public static final String QR_VERIFIED = "QR_VERIFIED";
        public static final String READER_ATTESTED = "READER_ATTESTED";
        public static final String KEY_ROTATED = "KEY_ROTATED";
        public static final String ACCESS_GRANTED = "ACCESS_GRANTED";
        public static final String ACCESS_DENIED = "ACCESS_DENIED";
        public static final String ADMIN_ACTION = "ADMIN_ACTION";
        public static final String SYSTEM_EVENT = "SYSTEM_EVENT";
    }
    
    // Константы для категорий событий
    public static class EventCategory {
        public static final String AUTHENTICATION = "AUTHENTICATION";
        public static final String AUTHORIZATION = "AUTHORIZATION";
        public static final String ADMINISTRATION = "ADMINISTRATION";
        public static final String SECURITY = "SECURITY";
        public static final String SYSTEM = "SYSTEM";
        public static final String AUDIT = "AUDIT";
    }
}
