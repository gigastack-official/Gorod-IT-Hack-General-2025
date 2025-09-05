package backend.api;

import backend.service.QrCodeService;
import backend.service.CardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
public class QrController {
    
    private final QrCodeService qrCodeService;
    private final CardService cardService;
    
    public QrController(QrCodeService qrCodeService, CardService cardService) {
        this.qrCodeService = qrCodeService;
        this.cardService = cardService;
    }
    
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyQrCode(@RequestBody Map<String, String> request) {
        String qrCode = request.get("qrCode");
        
        if (qrCode == null || qrCode.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("error", "Missing QR code");
            return ResponseEntity.badRequest().body(response);
        }
        
        String cardId = qrCodeService.extractCardIdFromQr(qrCode);
        if (cardId == null) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("error", "Invalid QR code format");
            return ResponseEntity.badRequest().body(response);
        }
        
        boolean isValid = qrCodeService.validateQrCode(qrCode, cardId);
        if (!isValid) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("error", "QR code validation failed");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("cardId", cardId);
        response.put("message", "QR code verified successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/generate/{cardId}")
    public ResponseEntity<Map<String, String>> generateQrForCard(@PathVariable String cardId) {
        return cardService.findById(cardId)
            .map(card -> {
                String qrCode = qrCodeService.generateQrCode(cardId, card.getOwner(), card.getUserRole());
                
                Map<String, String> response = new HashMap<>();
                response.put("status", "OK");
                response.put("cardId", cardId);
                response.put("qrCode", qrCode);
                response.put("owner", card.getOwner());
                response.put("userRole", card.getUserRole());
                
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
