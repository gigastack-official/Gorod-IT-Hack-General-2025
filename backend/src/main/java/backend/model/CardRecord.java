package backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;

@Entity
@Table(name = "cards")
public class CardRecord {
    @Id
    @Column(name = "card_id_b64", nullable = false, length = 32)
    private String cardId;

    @Column(name = "k_master_b64", nullable = false, length = 64)
    @JsonIgnore
    private String kMaster;

    @Column(name = "owner", nullable = true, length = 128)
    private String owner;

    @Column(name = "created_at", nullable = true)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = true)
    private Instant expiresAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "last_ctr")
    private Long lastCtr;

    public CardRecord() {}

    public CardRecord(String cardId, String kMaster) {
        this.cardId = cardId;
        this.kMaster = kMaster;
    }

    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public String getkMaster() { return kMaster; }
    public void setkMaster(String kMaster) { this.kMaster = kMaster; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Long getLastCtr() { return lastCtr; }
    public void setLastCtr(Long lastCtr) { this.lastCtr = lastCtr; }
}


