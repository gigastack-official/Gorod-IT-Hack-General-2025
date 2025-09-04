package ru.gigastack.backend.api;

import org.springframework.web.bind.annotation.*;
import ru.gigastack.backend.dto.CreateCardResponse;
import ru.gigastack.backend.dto.VerifyRequest;
import ru.gigastack.backend.service.CardService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CardController {
    private final CardService svc;
    public CardController(CardService svc) { this.svc = svc; }

    @PostMapping("/cards")
    public CreateCardResponse create() {
        return svc.create();
    }

    @PostMapping("/verify")
    public Map<String, Boolean> verify(@RequestBody VerifyRequest req) throws Exception {
        return Map.of("ok", svc.verify(req));
    }
}
