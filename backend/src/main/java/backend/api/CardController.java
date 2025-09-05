package backend.api;

import backend.dto.CreateCardRequest;
import backend.dto.CreateCardResponse;
import backend.dto.VerifyRequest;
import backend.model.CardRecord;
import backend.service.CardService;
import backend.util.B64Url;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<CreateCardResponse> createCard(@Valid @RequestBody CreateCardRequest req) {
        CreateCardResponse response = cardService.createCardWithRole(req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<java.util.Map<String, String>> verify(
            @Valid @RequestBody VerifyRequest request,
            @RequestHeader(value = "X-Reader-Id", required = false) String readerId) {
        
        if (readerId == null || readerId.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(java.util.Collections.singletonMap("status", "FAIL"));
        }
        
        byte[] ctr = B64Url.decode(request.getCtr());
        byte[] tag = B64Url.decode(request.getTag());
        boolean ok = cardService.verifyTruncTag(request.getCardId(), ctr, tag);
        return ResponseEntity.ok(java.util.Collections.singletonMap("status", ok ? "OK" : "FAIL"));
    }
}


