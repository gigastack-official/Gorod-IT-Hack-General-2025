package backend.repo;

import backend.model.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    
    // Поиск событий по типу
    List<AuditEvent> findByEventTypeOrderByEventTimestampDesc(String eventType);
    
    // Поиск событий по категории
    List<AuditEvent> findByEventCategoryOrderByEventTimestampDesc(String eventCategory);
    
    // Поиск событий по карте
    List<AuditEvent> findByCardIdOrderByEventTimestampDesc(String cardId);
    
    // Поиск событий по ридеру
    List<AuditEvent> findByReaderIdOrderByEventTimestampDesc(String readerId);
    
    // Поиск событий по владельцу
    List<AuditEvent> findByOwnerOrderByEventTimestampDesc(String owner);
    
    // Поиск событий по успешности
    List<AuditEvent> findBySuccessOrderByEventTimestampDesc(boolean success);
    
    // Поиск событий за период
    List<AuditEvent> findByEventTimestampBetweenOrderByEventTimestampDesc(Instant start, Instant end);
    
    // Поиск событий по IP адресу
    List<AuditEvent> findByIpAddressOrderByEventTimestampDesc(String ipAddress);
    
    // Поиск событий по сессии
    List<AuditEvent> findBySessionIdOrderByEventTimestampDesc(String sessionId);
    
    // Пагинированный поиск событий
    Page<AuditEvent> findAllByOrderByEventTimestampDesc(Pageable pageable);
    
    // Простой поиск всех событий
    Page<AuditEvent> findAll(Pageable pageable);
    
    // Поиск событий с фильтрами
    @Query("SELECT ae FROM AuditEvent ae WHERE " +
           "(:eventType IS NULL OR ae.eventType = :eventType) AND " +
           "(:eventCategory IS NULL OR ae.eventCategory = :eventCategory) AND " +
           "(:cardId IS NULL OR ae.cardId = :cardId) AND " +
           "(:readerId IS NULL OR ae.readerId = :readerId) AND " +
           "(:success IS NULL OR ae.success = :success) AND " +
           "(:startTime IS NULL OR ae.eventTimestamp >= :startTime) AND " +
           "(:endTime IS NULL OR ae.eventTimestamp <= :endTime)")
    Page<AuditEvent> findWithFilters(@Param("eventType") String eventType,
                                    @Param("eventCategory") String eventCategory,
                                    @Param("cardId") String cardId,
                                    @Param("readerId") String readerId,
                                    @Param("success") Boolean success,
                                    @Param("startTime") Instant startTime,
                                    @Param("endTime") Instant endTime,
                                    Pageable pageable);
    
    // Статистика событий по типам
    @Query("SELECT ae.eventType, COUNT(ae) FROM AuditEvent ae GROUP BY ae.eventType ORDER BY COUNT(ae) DESC")
    List<Object[]> getEventTypeStatistics();
    
    // Статистика событий по категориям
    @Query("SELECT ae.eventCategory, COUNT(ae) FROM AuditEvent ae GROUP BY ae.eventCategory ORDER BY COUNT(ae) DESC")
    List<Object[]> getEventCategoryStatistics();
    
    // Статистика успешных/неуспешных событий
    @Query("SELECT ae.success, COUNT(ae) FROM AuditEvent ae GROUP BY ae.success")
    List<Object[]> getSuccessStatistics();
    
    // Статистика событий по дням
    @Query("SELECT DATE_TRUNC('day', ae.eventTimestamp), COUNT(ae) FROM AuditEvent ae " +
           "WHERE ae.eventTimestamp >= :startTime GROUP BY DATE_TRUNC('day', ae.eventTimestamp) ORDER BY DATE_TRUNC('day', ae.eventTimestamp)")
    List<Object[]> getDailyStatistics(@Param("startTime") Instant startTime);
    
    // Поиск подозрительной активности
    @Query("SELECT ae FROM AuditEvent ae WHERE " +
           "ae.success = false AND " +
           "ae.eventTimestamp >= :startTime AND " +
           "(ae.ipAddress IN (SELECT ae2.ipAddress FROM AuditEvent ae2 WHERE ae2.success = false AND ae2.eventTimestamp >= :startTime GROUP BY ae2.ipAddress HAVING COUNT(ae2) > :maxFailures) OR " +
           "ae.cardId IN (SELECT ae3.cardId FROM AuditEvent ae3 WHERE ae3.success = false AND ae3.eventTimestamp >= :startTime GROUP BY ae3.cardId HAVING COUNT(ae3) > :maxFailures))")
    List<AuditEvent> findSuspiciousActivity(@Param("startTime") Instant startTime, @Param("maxFailures") Long maxFailures);
    
    // Удаление старых событий
    void deleteByEventTimestampBefore(Instant cutoffTime);
    
    // Подсчет событий за период
    long countByEventTimestampBetween(Instant start, Instant end);
    
    // Подсчет событий по типу за период
    long countByEventTypeAndEventTimestampBetween(String eventType, Instant start, Instant end);
}
