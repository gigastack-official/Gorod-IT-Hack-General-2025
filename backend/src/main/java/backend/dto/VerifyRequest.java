package backend.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyRequest {
    @NotBlank
    private String cardId;

    @NotBlank
    private String ctr;

    @NotBlank
    private String tag;

    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public String getCtr() { return ctr; }
    public void setCtr(String ctr) { this.ctr = ctr; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
}


