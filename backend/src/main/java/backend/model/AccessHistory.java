package backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Модель для истории доступа к картам
 */
@Entity
@Table(name = "access_history")
public class AccessHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "card_id", nullable = false, length = 64)
    private String cardId;
    
    @Column(name = "reader_id", nullable = false, length = 64)
    private String readerId;
    
    @Column(name = "owner", length = 100)
    private String owner;
    
    @Column(name = "user_role", length = 32)
    private String userRole;
    
    @Column(name = "access_timestamp", nullable = false)
    private Instant accessTimestamp;
    
    @Column(name = "access_type", nullable = false, length = 20)
    private String accessType;
    
    @Column(name = "success", nullable = false)
    private boolean success;
    
    @Column(name = "counter_value")
    private Long counterValue;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "location", length = 200)
    private String location;
    
    @Column(name = "device_info", length = 500)
    private String deviceInfo;
    
    @Column(name = "failure_reason", length = 200)
    private String failureReason;
    
    @Column(name = "response_time_ms")
    private Long responseTimeMs;
    
    @Column(name = "additional_metadata", columnDefinition = "TEXT")
    private String additionalMetadata;
    
    // Конструкторы
    public AccessHistory() {}
    
    public AccessHistory(String cardId, String readerId, String owner, String userRole, 
                        String accessType, boolean success) {
        this.cardId = cardId;
        this.readerId = readerId;
        this.owner = owner;
        this.userRole = userRole;
        this.accessType = accessType;
        this.success = success;
        this.accessTimestamp = Instant.now();
    }
    
    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    
    public String getReaderId() { return readerId; }
    public void setReaderId(String readerId) { this.readerId = readerId; }
    
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    
    public Instant getAccessTimestamp() { return accessTimestamp; }
    public void setAccessTimestamp(Instant accessTimestamp) { this.accessTimestamp = accessTimestamp; }
    
    public String getAccessType() { return accessType; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public Long getCounterValue() { return counterValue; }
    public void setCounterValue(Long counterValue) { this.counterValue = counterValue; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
    
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    
    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    
    public String getAdditionalMetadata() { return additionalMetadata; }
    public void setAdditionalMetadata(String additionalMetadata) { this.additionalMetadata = additionalMetadata; }
    
    // Константы для типов доступа
    public static class AccessType {
        public static final String CARD_VERIFICATION = "CARD_VERIFICATION";
        public static final String QR_SCAN = "QR_SCAN";
        public static final String ADMIN_ACCESS = "ADMIN_ACCESS";
        public static final String SYSTEM_ACCESS = "SYSTEM_ACCESS";
    }
}
