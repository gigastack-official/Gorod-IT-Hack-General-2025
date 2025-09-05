package backend.api;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/attest")
public class AttestationController {
    
    private final Map<String, String> readerChallenges = new ConcurrentHashMap<>();
    private final Map<String, Long> attestedReaders = new ConcurrentHashMap<>();
    
    @PostMapping("/challenge/{readerId}")
    public ResponseEntity<Map<String, String>> generateChallenge(@PathVariable String readerId) {
        String challenge = UUID.randomUUID().toString();
        readerChallenges.put(readerId, challenge);
        
        Map<String, String> response = new HashMap<>();
        response.put("challenge", challenge);
        response.put("readerId", readerId);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/verify/{readerId}")
    public ResponseEntity<Map<String, String>> verifyAttestation(
            @PathVariable String readerId,
            @RequestBody Map<String, String> request) {
        
        String challenge = request.get("challenge");
        String signature = request.get("signature");
        
        String expectedChallenge = readerChallenges.get(readerId);
        if (expectedChallenge == null || !expectedChallenge.equals(challenge)) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("error", "Invalid challenge");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (signature == null || signature.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "FAIL");
            response.put("error", "Missing signature");
            return ResponseEntity.badRequest().body(response);
        }
        
        attestedReaders.put(readerId, System.currentTimeMillis());
        readerChallenges.remove(readerId);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("readerId", readerId);
        response.put("attestedAt", String.valueOf(System.currentTimeMillis()));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status/{readerId}")
    public ResponseEntity<Map<String, String>> getAttestationStatus(@PathVariable String readerId) {
        Long attestedAt = attestedReaders.get(readerId);
        
        Map<String, String> response = new HashMap<>();
        if (attestedAt != null) {
            long ageMinutes = (System.currentTimeMillis() - attestedAt) / (1000 * 60);
            response.put("status", "ATTESTED");
            response.put("readerId", readerId);
            response.put("attestedAt", String.valueOf(attestedAt));
            response.put("ageMinutes", String.valueOf(ageMinutes));
        } else {
            response.put("status", "NOT_ATTESTED");
            response.put("readerId", readerId);
        }
        
        return ResponseEntity.ok(response);
    }
    
    public boolean isReaderAttested(String readerId) {
        Long attestedAt = attestedReaders.get(readerId);
        if (attestedAt == null) {
            return false;
        }
        
        long ageMinutes = (System.currentTimeMillis() - attestedAt) / (1000 * 60);
        return ageMinutes < 60;
    }
}
