package backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateCardRequest {
    @NotBlank
    private String owner;

    @Min(60)
    private long ttlSeconds;
    
    private String userRole = "permanent";
    
    private boolean generateQr = false;

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public long getTtlSeconds() { return ttlSeconds; }
    public void setTtlSeconds(long ttlSeconds) { this.ttlSeconds = ttlSeconds; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public boolean isGenerateQr() { return generateQr; }
    public void setGenerateQr(boolean generateQr) { this.generateQr = generateQr; }
}


