package backend.api;

import backend.model.AccessHistory;
import backend.model.AuditEvent;
import backend.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    
    private final AuditService auditService;
    
    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }
    
    /**
     * Получение событий аудита с фильтрами
     */
    @GetMapping("/events")
    public ResponseEntity<Page<AuditEvent>> getAuditEvents(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String eventCategory,
            @RequestParam(required = false) String cardId,
            @RequestParam(required = false) String readerId,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "eventTimestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Временно используем простой метод для тестирования
        Page<AuditEvent> events = auditService.getAllAuditEvents(pageable);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Получение истории доступа с фильтрами
     */
    @GetMapping("/access-history")
    public ResponseEntity<Page<AccessHistory>> getAccessHistory(
            @RequestParam(required = false) String cardId,
            @RequestParam(required = false) String readerId,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String accessType,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "accessTimestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Временно используем простой метод для тестирования
        Page<AccessHistory> history = auditService.getAllAccessHistory(pageable);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Получение последнего доступа к карте
     */
    @GetMapping("/last-access/{cardId}")
    public ResponseEntity<AccessHistory> getLastAccess(@PathVariable String cardId) {
        Optional<AccessHistory> lastAccess = auditService.getLastAccess(cardId);
        return lastAccess.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Получение последнего успешного доступа к карте
     */
    @GetMapping("/last-successful-access/{cardId}")
    public ResponseEntity<AccessHistory> getLastSuccessfulAccess(@PathVariable String cardId) {
        Optional<AccessHistory> lastAccess = auditService.getLastSuccessfulAccess(cardId);
        return lastAccess.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Получение статистики событий
     */
    @GetMapping("/statistics/events")
    public ResponseEntity<Map<String, Object>> getEventStatistics() {
        Map<String, Object> statistics = auditService.getEventStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * Получение статистики доступа
     */
    @GetMapping("/statistics/access")
    public ResponseEntity<Map<String, Object>> getAccessStatistics() {
        Map<String, Object> statistics = auditService.getAccessStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * Поиск подозрительной активности
     */
    @GetMapping("/suspicious-activity")
    public ResponseEntity<List<AuditEvent>> findSuspiciousActivity(
            @RequestParam(defaultValue = "5") Long maxFailures) {
        List<AuditEvent> suspiciousEvents = auditService.findSuspiciousActivity(maxFailures);
        return ResponseEntity.ok(suspiciousEvents);
    }
    
    /**
     * Поиск частых неудачных попыток доступа
     */
    @GetMapping("/frequent-failures")
    public ResponseEntity<List<Object[]>> findFrequentFailures(
            @RequestParam(defaultValue = "3") Long maxFailures) {
        List<Object[]> failures = auditService.findFrequentFailures(maxFailures);
        return ResponseEntity.ok(failures);
    }
    
    /**
     * Поиск подозрительных IP адресов
     */
    @GetMapping("/suspicious-ips")
    public ResponseEntity<List<Object[]>> findSuspiciousIPs(
            @RequestParam(defaultValue = "5") Long maxFailures) {
        List<Object[]> suspiciousIPs = auditService.findSuspiciousIPs(maxFailures);
        return ResponseEntity.ok(suspiciousIPs);
    }
    
    /**
     * Получение среднего времени ответа по ридерам
     */
    @GetMapping("/response-times")
    public ResponseEntity<List<Object[]>> getAverageResponseTimeByReader() {
        List<Object[]> responseTimes = auditService.getAverageResponseTimeByReader();
        return ResponseEntity.ok(responseTimes);
    }
    
    /**
     * Получение количества событий за период
     */
    @GetMapping("/count/events")
    public ResponseEntity<Map<String, Long>> getEventCount(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        
        long totalEvents = auditService.getEventCount(start, end);
        long cardCreated = auditService.getEventCountByType("CARD_CREATED", start, end);
        long cardVerified = auditService.getEventCountByType("CARD_VERIFIED", start, end);
        long accessGranted = auditService.getEventCountByType("ACCESS_GRANTED", start, end);
        long accessDenied = auditService.getEventCountByType("ACCESS_DENIED", start, end);
        
        Map<String, Long> counts = Map.of(
            "totalEvents", totalEvents,
            "cardCreated", cardCreated,
            "cardVerified", cardVerified,
            "accessGranted", accessGranted,
            "accessDenied", accessDenied
        );
        
        return ResponseEntity.ok(counts);
    }
    
    /**
     * Получение количества записей доступа за период
     */
    @GetMapping("/count/access")
    public ResponseEntity<Map<String, Long>> getAccessCount(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        
        long totalAccess = auditService.getAccessCount(start, end);
        long successfulAccess = auditService.getSuccessfulAccessCount(start, end);
        long failedAccess = auditService.getFailedAccessCount(start, end);
        
        Map<String, Long> counts = Map.of(
            "totalAccess", totalAccess,
            "successfulAccess", successfulAccess,
            "failedAccess", failedAccess
        );
        
        return ResponseEntity.ok(counts);
    }
    
    /**
     * Очистка старых записей аудита
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupOldRecords(
            @RequestParam(defaultValue = "90") int retentionDays) {
        
        auditService.cleanupOldRecords(retentionDays);
        
        Map<String, String> result = Map.of(
            "status", "OK",
            "message", "Cleaned up records older than " + retentionDays + " days"
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Экспорт событий аудита в CSV
     */
    @GetMapping("/export/events")
    public ResponseEntity<String> exportEvents(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String eventCategory,
            @RequestParam(required = false) String cardId,
            @RequestParam(required = false) String readerId,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime) {
        
        // Получаем все события без пагинации для экспорта
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by("eventTimestamp").descending());
        Page<AuditEvent> events = auditService.getAllAuditEvents(pageable);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Event Type,Event Category,Card ID,Reader ID,Owner,User Role,");
        csv.append("Event Timestamp,Success,Message,Error Code,IP Address,User Agent,Session ID,Additional Data\n");
        
        for (AuditEvent event : events.getContent()) {
            csv.append(event.getId()).append(",");
            csv.append(escapeCsv(event.getEventType())).append(",");
            csv.append(escapeCsv(event.getEventCategory())).append(",");
            csv.append(escapeCsv(event.getCardId())).append(",");
            csv.append(escapeCsv(event.getReaderId())).append(",");
            csv.append(escapeCsv(event.getOwner())).append(",");
            csv.append(escapeCsv(event.getUserRole())).append(",");
            csv.append(event.getEventTimestamp()).append(",");
            csv.append(event.isSuccess()).append(",");
            csv.append(escapeCsv(event.getMessage())).append(",");
            csv.append(escapeCsv(event.getErrorCode())).append(",");
            csv.append(escapeCsv(event.getIpAddress())).append(",");
            csv.append(escapeCsv(event.getUserAgent())).append(",");
            csv.append(escapeCsv(event.getSessionId())).append(",");
            csv.append(escapeCsv(event.getAdditionalData())).append("\n");
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=audit_events.csv")
                .body(csv.toString());
    }
    
    /**
     * Экспорт истории доступа в CSV
     */
    @GetMapping("/export/access-history")
    public ResponseEntity<String> exportAccessHistory(
            @RequestParam(required = false) String cardId,
            @RequestParam(required = false) String readerId,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String accessType,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime) {
        
        // Получаем всю историю без пагинации для экспорта
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by("accessTimestamp").descending());
        Page<AccessHistory> history = auditService.getAllAccessHistory(pageable);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Card ID,Reader ID,Owner,User Role,Access Timestamp,Access Type,");
        csv.append("Success,Counter Value,IP Address,Location,Device Info,Failure Reason,Response Time MS,Additional Metadata\n");
        
        for (AccessHistory access : history.getContent()) {
            csv.append(access.getId()).append(",");
            csv.append(escapeCsv(access.getCardId())).append(",");
            csv.append(escapeCsv(access.getReaderId())).append(",");
            csv.append(escapeCsv(access.getOwner())).append(",");
            csv.append(escapeCsv(access.getUserRole())).append(",");
            csv.append(access.getAccessTimestamp()).append(",");
            csv.append(escapeCsv(access.getAccessType())).append(",");
            csv.append(access.isSuccess()).append(",");
            csv.append(access.getCounterValue()).append(",");
            csv.append(escapeCsv(access.getIpAddress())).append(",");
            csv.append(escapeCsv(access.getLocation())).append(",");
            csv.append(escapeCsv(access.getDeviceInfo())).append(",");
            csv.append(escapeCsv(access.getFailureReason())).append(",");
            csv.append(access.getResponseTimeMs()).append(",");
            csv.append(escapeCsv(access.getAdditionalMetadata())).append("\n");
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=access_history.csv")
                .body(csv.toString());
    }
    
    /**
     * Экранирование CSV значений
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
