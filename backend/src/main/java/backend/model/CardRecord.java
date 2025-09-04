package backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cards")
public class CardRecord {
    @Id
    @Column(name = "card_id_b64", nullable = false, length = 32)
    private String cardId; // base64url(16 bytes)

    @Column(name = "k_master_b64", nullable = false, length = 64)
    private String kMaster; // base64url(32 bytes)

    public CardRecord() {}

    public CardRecord(String cardId, String kMaster) {
        this.cardId = cardId;
        this.kMaster = kMaster;
    }

    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public String getkMaster() { return kMaster; }
    public void setkMaster(String kMaster) { this.kMaster = kMaster; }
}


