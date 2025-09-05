package backend.api;

import backend.dto.CreateCardRequest;
import backend.dto.CreateCardResponse;
import backend.dto.VerifyRequest;
import backend.model.CardRecord;
import backend.service.CardService;
import backend.service.AuditService;
import backend.model.AuditEvent;
import backend.model.AccessHistory;
import backend.util.B64Url;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService cardService;
    private final AuditService auditService;

    public CardController(CardService cardService, AuditService auditService) {
        this.cardService = cardService;
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<CreateCardResponse> createCard(@Valid @RequestBody CreateCardRequest req, HttpServletRequest httpRequest) {
        CreateCardResponse response = cardService.createCardWithRole(req, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<java.util.Map<String, String>> verify(
            @Valid @RequestBody VerifyRequest request,
            @RequestHeader(value = "X-Reader-Id", required = false) String readerId,
            HttpServletRequest httpRequest) {
        
        if (readerId == null || readerId.isEmpty()) {
            // Аудит отсутствующего Reader ID
            auditService.logEvent(
                AuditEvent.EventType.ACCESS_DENIED,
                AuditEvent.EventCategory.SYSTEM,
                request.getCardId(),
                null,
                null,
                null,
                false,
                "Missing X-Reader-Id header",
                "MISSING_READER_ID",
                null,
                httpRequest
            );
            return ResponseEntity.badRequest()
                .body(java.util.Collections.singletonMap("status", "FAIL"));
        }
        try {
            byte[] ctr = B64Url.decode(request.getCtr());
            byte[] tag = B64Url.decode(request.getTag());

            // Проверка длин
            if (ctr == null || ctr.length != 8 || tag == null || tag.length != 16) {
                auditService.logEvent(
                    AuditEvent.EventType.ACCESS_DENIED,
                    AuditEvent.EventCategory.AUTHENTICATION,
                    request.getCardId(),
                    readerId,
                    null,
                    null,
                    false,
                    "Invalid input length",
                    "INVALID_INPUT_LENGTH",
                    "ctrLen=" + (ctr == null ? -1 : ctr.length) + ", tagLen=" + (tag == null ? -1 : tag.length),
                    httpRequest
                );
                auditService.logAccess(
                    request.getCardId(),
                    readerId,
                    null,
                    null,
                    AccessHistory.AccessType.CARD_VERIFICATION,
                    false,
                    null,
                    "Invalid input length",
                    null,
                    null,
                    httpRequest
                );
                return ResponseEntity.ok(java.util.Collections.singletonMap("status", "FAIL"));
            }

            boolean ok = cardService.verifyTruncTag(request.getCardId(), ctr, tag, readerId, httpRequest);
            return ResponseEntity.ok(java.util.Collections.singletonMap("status", ok ? "OK" : "FAIL"));
        } catch (IllegalArgumentException e) {
            // Ошибка декодирования Base64Url
            auditService.logEvent(
                AuditEvent.EventType.ACCESS_DENIED,
                AuditEvent.EventCategory.AUTHENTICATION,
                request.getCardId(),
                readerId,
                null,
                null,
                false,
                "Invalid Base64Url in ctr/tag",
                "INVALID_BASE64",
                e.getMessage(),
                httpRequest
            );
            auditService.logAccess(
                request.getCardId(),
                readerId,
                null,
                null,
                AccessHistory.AccessType.CARD_VERIFICATION,
                false,
                null,
                "Invalid Base64Url",
                null,
                null,
                httpRequest
            );
            return ResponseEntity.ok(java.util.Collections.singletonMap("status", "FAIL"));
        }
    }
}


