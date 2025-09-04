package backend.api;

import backend.model.CardRecord;
import backend.repo.CardRepository;
import backend.service.CardService;
import backend.service.AuditService;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final CardService cardService;
    private final CardRepository repo;
    private final AuditService auditService;
    public AdminController(CardService cardService, CardRepository repo, AuditService auditService) {
        this.cardService = cardService;
        this.repo = repo;
        this.auditService = auditService;
    }

    @PostMapping("/revoke/{cardId}")
    public ResponseEntity<Map<String,String>> revoke(@PathVariable String cardId) {
        boolean ok = cardService.revoke(cardId).isPresent();
        auditService.record("revoke", cardId, ok ? "OK" : "FAIL");
        return ResponseEntity.ok(Map.of("status", ok ? "OK" : "FAIL"));
    }

    @PostMapping("/extend/{cardId}")
    public ResponseEntity<Map<String,String>> extend(@PathVariable String cardId, @RequestParam @Min(60) long extraSeconds) {
        boolean ok = cardService.extend(cardId, extraSeconds).isPresent();
        auditService.record("extend", cardId, ok ? ("+" + extraSeconds + "s") : "FAIL");
        return ResponseEntity.ok(Map.of("status", ok ? "OK" : "FAIL"));
    }

    @GetMapping("/status/{cardId}")
    public ResponseEntity<CardRecord> status(@PathVariable String cardId) {
        return repo.findById(cardId).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/list")
    public ResponseEntity<List<CardRecord>> list() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/audit")
    public ResponseEntity<java.util.List<AuditService.AuditEvent>> audit(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        return ResponseEntity.ok(auditService.recent(Math.max(1, Math.min(1000, limit))));
    }
}


