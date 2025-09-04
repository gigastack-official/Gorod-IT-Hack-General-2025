package backend.api;

import backend.sim.SimService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sim")
public class SimController {
    private final SimService simService;
    public SimController(SimService simService) { this.simService = simService; }

    @PostMapping("/response/{cardId}")
    public ResponseEntity<java.util.Map<String,String>> response(@PathVariable("cardId") String cardIdB64) {
        return ResponseEntity.ok(simService.generateResponse(cardIdB64));
    }
}


