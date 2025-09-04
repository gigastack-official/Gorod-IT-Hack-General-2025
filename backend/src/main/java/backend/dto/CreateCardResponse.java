package backend.dto;

public class CreateCardResponse {
    private String status;
    private String cardId;   // base64url(16)
    private String kMaster;  // base64url(32)

    public CreateCardResponse() {}

    public CreateCardResponse(String status, String cardId, String kMaster) {
        this.status = status;
        this.cardId = cardId;
        this.kMaster = kMaster;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public String getkMaster() { return kMaster; }
    public void setkMaster(String kMaster) { this.kMaster = kMaster; }
}


