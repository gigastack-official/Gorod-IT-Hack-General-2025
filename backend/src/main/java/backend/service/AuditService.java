package backend.service;

import backend.model.AccessHistory;
import backend.model.AuditEvent;
import backend.repo.AccessHistoryRepository;
import backend.repo.AuditEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuditService {
    
    private final AuditEventRepository auditEventRepository;
    private final AccessHistoryRepository accessHistoryRepository;
    
    public AuditService(AuditEventRepository auditEventRepository, 
                       AccessHistoryRepository accessHistoryRepository) {
        this.auditEventRepository = auditEventRepository;
        this.accessHistoryRepository = accessHistoryRepository;
    }
    
    /**
     * Логирование события аудита
     */
    @Transactional
    public void logEvent(String eventType, String eventCategory, String cardId, String readerId,
                        String owner, String userRole, boolean success, String message, 
                        HttpServletRequest request) {
        AuditEvent event = new AuditEvent(eventType, eventCategory, cardId, readerId, 
                                        owner, userRole, success, message);
        
        if (request != null) {
            event.setIpAddress(getClientIpAddress(request));
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }
            event.setUserAgent(userAgent);
            event.setSessionId(request.getSession().getId());
        }
        
        auditEventRepository.save(event);
    }
    
    /**
     * Логирование события аудита с дополнительными данными
     */
    @Transactional
    public void logEvent(String eventType, String eventCategory, String cardId, String readerId,
                        String owner, String userRole, boolean success, String message,
                        String errorCode, String additionalData, HttpServletRequest request) {
        AuditEvent event = new AuditEvent(eventType, eventCategory, cardId, readerId, 
                                        owner, userRole, success, message);
        
        if (errorCode != null && errorCode.length() > 50) {
            errorCode = errorCode.substring(0, 50);
        }
        event.setErrorCode(errorCode);
        event.setAdditionalData(additionalData);
        
        if (request != null) {
            event.setIpAddress(getClientIpAddress(request));
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }
            event.setUserAgent(userAgent);
            event.setSessionId(request.getSession().getId());
        }
        
        auditEventRepository.save(event);
    }
    
    /**
     * Логирование истории доступа
     */
    @Transactional
    public void logAccess(String cardId, String readerId, String owner, String userRole,
                        String accessType, boolean success, Long counterValue,
                        String failureReason, Long responseTimeMs, String additionalMetadata,
                        HttpServletRequest request) {
        AccessHistory history = new AccessHistory(cardId, readerId, owner, userRole, accessType, success);
        
        history.setCounterValue(counterValue);
        if (failureReason != null && failureReason.length() > 200) {
            failureReason = failureReason.substring(0, 200);
        }
        history.setFailureReason(failureReason);
        history.setResponseTimeMs(responseTimeMs);
        history.setAdditionalMetadata(additionalMetadata);
        
        if (request != null) {
            history.setIpAddress(getClientIpAddress(request));
            String deviceInfo = request.getHeader("User-Agent");
            if (deviceInfo != null && deviceInfo.length() > 500) {
                deviceInfo = deviceInfo.substring(0, 500);
            }
            history.setDeviceInfo(deviceInfo);
        }
        
        accessHistoryRepository.save(history);
    }
    
    /**
     * Получение событий аудита с фильтрами
     */
    public Page<AuditEvent> getAuditEvents(String eventType, String eventCategory, String cardId,
                                          String readerId, Boolean success, Instant startTime,
                                          Instant endTime, Pageable pageable) {
        return auditEventRepository.findWithFilters(eventType, eventCategory, cardId, readerId,
                                                   success, startTime, endTime, pageable);
    }
    
    /**
     * Получение всех событий аудита (для тестирования)
     */
    public Page<AuditEvent> getAllAuditEvents(Pageable pageable) {
        return auditEventRepository.findAll(pageable);
    }
    
    /**
     * Получение истории доступа с фильтрами
     */
    public Page<AccessHistory> getAccessHistory(String cardId, String readerId, String owner,
                                               String accessType, Boolean success, Instant startTime,
                                               Instant endTime, Pageable pageable) {
        return accessHistoryRepository.findWithFilters(cardId, readerId, owner, accessType,
                                                      success, startTime, endTime, pageable);
    }
    
    /**
     * Получение всей истории доступа (для тестирования)
     */
    public Page<AccessHistory> getAllAccessHistory(Pageable pageable) {
        return accessHistoryRepository.findAll(pageable);
    }
    
    /**
     * Получение последнего доступа к карте
     */
    public Optional<AccessHistory> getLastAccess(String cardId) {
        return accessHistoryRepository.findFirstByCardIdOrderByAccessTimestampDesc(cardId);
    }
    
    /**
     * Получение последнего успешного доступа к карте
     */
    public Optional<AccessHistory> getLastSuccessfulAccess(String cardId) {
        return accessHistoryRepository.findFirstByCardIdAndSuccessOrderByAccessTimestampDesc(cardId, true);
    }
    
    /**
     * Получение статистики событий
     */
    public Map<String, Object> getEventStatistics() {
        return Map.of(
            "eventTypes", auditEventRepository.getEventTypeStatistics(),
            "eventCategories", auditEventRepository.getEventCategoryStatistics(),
            "successStats", auditEventRepository.getSuccessStatistics(),
            "dailyStats", auditEventRepository.getDailyStatistics(Instant.now().minus(30, ChronoUnit.DAYS))
        );
    }
    
    /**
     * Получение статистики доступа
     */
    public Map<String, Object> getAccessStatistics() {
        return Map.of(
            "accessTypes", accessHistoryRepository.getAccessTypeStatistics(),
            "readerStats", accessHistoryRepository.getReaderStatistics(),
            "cardStats", accessHistoryRepository.getCardStatistics(),
            "successStats", accessHistoryRepository.getSuccessStatistics(),
            "dailyStats", accessHistoryRepository.getDailyStatistics(Instant.now().minus(30, ChronoUnit.DAYS)),
            "hourlyStats", accessHistoryRepository.getHourlyStatistics(Instant.now().minus(7, ChronoUnit.DAYS))
        );
    }
    
    /**
     * Поиск подозрительной активности
     */
    public List<AuditEvent> findSuspiciousActivity(Long maxFailures) {
        Instant startTime = Instant.now().minus(24, ChronoUnit.HOURS);
        return auditEventRepository.findSuspiciousActivity(startTime, maxFailures);
    }
    
    /**
     * Поиск частых неудачных попыток доступа
     */
    public List<Object[]> findFrequentFailures(Long maxFailures) {
        Instant startTime = Instant.now().minus(24, ChronoUnit.HOURS);
        return accessHistoryRepository.findFrequentFailures(startTime, maxFailures);
    }
    
    /**
     * Поиск подозрительных IP адресов
     */
    public List<Object[]> findSuspiciousIPs(Long maxFailures) {
        Instant startTime = Instant.now().minus(24, ChronoUnit.HOURS);
        return accessHistoryRepository.findSuspiciousIPs(startTime, maxFailures);
    }
    
    /**
     * Получение среднего времени ответа по ридерам
     */
    public List<Object[]> getAverageResponseTimeByReader() {
        Instant startTime = Instant.now().minus(7, ChronoUnit.DAYS);
        return accessHistoryRepository.getAverageResponseTimeByReader(startTime);
    }
    
    /**
     * Очистка старых записей аудита
     */
    @Transactional
    public void cleanupOldRecords(int retentionDays) {
        Instant cutoffTime = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        auditEventRepository.deleteByEventTimestampBefore(cutoffTime);
        accessHistoryRepository.deleteByAccessTimestampBefore(cutoffTime);
    }
    
    /**
     * Получение IP адреса клиента
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Получение количества событий за период
     */
    public long getEventCount(Instant start, Instant end) {
        return auditEventRepository.countByEventTimestampBetween(start, end);
    }
    
    /**
     * Получение количества событий по типу за период
     */
    public long getEventCountByType(String eventType, Instant start, Instant end) {
        return auditEventRepository.countByEventTypeAndEventTimestampBetween(eventType, start, end);
    }
    
    /**
     * Получение количества записей доступа за период
     */
    public long getAccessCount(Instant start, Instant end) {
        return accessHistoryRepository.countByAccessTimestampBetween(start, end);
    }
    
    /**
     * Получение количества успешных доступов за период
     */
    public long getSuccessfulAccessCount(Instant start, Instant end) {
        return accessHistoryRepository.countBySuccessAndAccessTimestampBetween(true, start, end);
    }
    
    /**
     * Получение количества неуспешных доступов за период
     */
    public long getFailedAccessCount(Instant start, Instant end) {
        return accessHistoryRepository.countBySuccessAndAccessTimestampBetween(false, start, end);
    }
}
