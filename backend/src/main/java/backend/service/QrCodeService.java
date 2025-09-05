package backend.service;

import org.springframework.stereotype.Service;
import java.util.Base64;
import java.util.UUID;

@Service
public class QrCodeService {
    
    public String generateQrCode(String cardId, String owner, String userRole) {
        try {
            String qrData = String.format("CARD:%s:OWNER:%s:ROLE:%s:TIMESTAMP:%d", 
                cardId, owner, userRole, System.currentTimeMillis());
            
            String qrCode = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(qrData.getBytes());
            
            return qrCode;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    public boolean validateQrCode(String qrCode, String expectedCardId) {
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(qrCode));
            String[] parts = decoded.split(":");
            
            if (parts.length < 6 || !"CARD".equals(parts[0])) {
                return false;
            }
            
            String cardId = parts[1];
            return expectedCardId.equals(cardId);
        } catch (Exception e) {
            return false;
        }
    }
    
    public String extractCardIdFromQr(String qrCode) {
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(qrCode));
            String[] parts = decoded.split(":");
            
            if (parts.length >= 2 && "CARD".equals(parts[0])) {
                return parts[1];
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
