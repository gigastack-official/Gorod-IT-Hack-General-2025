package backend.api;

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
    public ResponseEntity<CreateCardResponse> createCard() {
        CardRecord rec = cardService.createCard();
        return ResponseEntity.ok(new CreateCardResponse("OK", rec.getCardId(), rec.getkMaster()));
    }

    @PostMapping("/verify")
    public ResponseEntity<java.util.Map<String, String>> verify(@Valid @RequestBody VerifyRequest request) {
        byte[] ctr = B64Url.decode(request.getCtr());
        byte[] tag = B64Url.decode(request.getTag());
        boolean ok = cardService.verifyTruncTag(request.getCardId(), ctr, tag);
        return ResponseEntity.ok(java.util.Collections.singletonMap("status", ok ? "OK" : "FAIL"));
    }
}


