package backend.dto;

public class CreateCardResponse {
    private String status;
    private String cardId;
    private String owner;
    private String expiresAt;
    private String userRole;
    private String qrCode;
    private Integer keyVersion;

    public CreateCardResponse() {}

    public CreateCardResponse(String status, String cardId, String owner, String expiresAt) {
        this.status = status;
        this.cardId = cardId;
        this.owner = owner;
        this.expiresAt = expiresAt;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    public Integer getKeyVersion() { return keyVersion; }
    public void setKeyVersion(Integer keyVersion) { this.keyVersion = keyVersion; }
}


