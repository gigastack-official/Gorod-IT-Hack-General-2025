package backend.api;

import backend.model.CardRecord;
import backend.repo.CardRepository;
import backend.service.CardService;
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
    public AdminController(CardService cardService, CardRepository repo) {
        this.cardService = cardService;
        this.repo = repo;
    }

    @PostMapping("/revoke/{cardId}")
    public ResponseEntity<Map<String,String>> revoke(@PathVariable String cardId) {
        boolean ok = cardService.revoke(cardId).isPresent();
        return ResponseEntity.ok(Map.of("status", ok ? "OK" : "FAIL"));
    }

    @PostMapping("/extend/{cardId}")
    public ResponseEntity<Map<String,String>> extend(@PathVariable String cardId, @RequestParam @Min(60) long extraSeconds) {
        boolean ok = cardService.extend(cardId, extraSeconds).isPresent();
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
}


