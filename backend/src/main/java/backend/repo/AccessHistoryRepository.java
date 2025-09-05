package backend.repo;

import backend.model.AccessHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccessHistoryRepository extends JpaRepository<AccessHistory, Long> {
    
    // Поиск истории доступа по карте
    List<AccessHistory> findByCardIdOrderByAccessTimestampDesc(String cardId);
    
    // Поиск истории доступа по ридеру
    List<AccessHistory> findByReaderIdOrderByAccessTimestampDesc(String readerId);
    
    // Поиск истории доступа по владельцу
    List<AccessHistory> findByOwnerOrderByAccessTimestampDesc(String owner);
    
    // Поиск истории доступа по типу
    List<AccessHistory> findByAccessTypeOrderByAccessTimestampDesc(String accessType);
    
    // Поиск истории доступа по успешности
    List<AccessHistory> findBySuccessOrderByAccessTimestampDesc(boolean success);
    
    // Поиск истории доступа за период
    List<AccessHistory> findByAccessTimestampBetweenOrderByAccessTimestampDesc(Instant start, Instant end);
    
    // Поиск последнего доступа к карте
    Optional<AccessHistory> findFirstByCardIdOrderByAccessTimestampDesc(String cardId);
    
    // Поиск последнего доступа через ридер
    Optional<AccessHistory> findFirstByReaderIdOrderByAccessTimestampDesc(String readerId);
    
    // Поиск последнего успешного доступа к карте
    Optional<AccessHistory> findFirstByCardIdAndSuccessOrderByAccessTimestampDesc(String cardId, boolean success);
    
    // Пагинированный поиск истории доступа
    Page<AccessHistory> findAllByOrderByAccessTimestampDesc(Pageable pageable);
    
    // Простой поиск всей истории доступа
    Page<AccessHistory> findAll(Pageable pageable);
    
    // Поиск истории доступа с фильтрами
    @Query("SELECT ah FROM AccessHistory ah WHERE " +
           "(:cardId IS NULL OR ah.cardId = :cardId) AND " +
           "(:readerId IS NULL OR ah.readerId = :readerId) AND " +
           "(:owner IS NULL OR ah.owner = :owner) AND " +
           "(:accessType IS NULL OR ah.accessType = :accessType) AND " +
           "(:success IS NULL OR ah.success = :success) AND " +
           "(:startTime IS NULL OR ah.accessTimestamp >= :startTime) AND " +
           "(:endTime IS NULL OR ah.accessTimestamp <= :endTime)")
    Page<AccessHistory> findWithFilters(@Param("cardId") String cardId,
                                       @Param("readerId") String readerId,
                                       @Param("owner") String owner,
                                       @Param("accessType") String accessType,
                                       @Param("success") Boolean success,
                                       @Param("startTime") Instant startTime,
                                       @Param("endTime") Instant endTime,
                                       Pageable pageable);
    
    // Статистика доступа по типам
    @Query("SELECT ah.accessType, COUNT(ah) FROM AccessHistory ah GROUP BY ah.accessType ORDER BY COUNT(ah) DESC")
    List<Object[]> getAccessTypeStatistics();
    
    // Статистика доступа по ридерам
    @Query("SELECT ah.readerId, COUNT(ah) FROM AccessHistory ah GROUP BY ah.readerId ORDER BY COUNT(ah) DESC")
    List<Object[]> getReaderStatistics();
    
    // Статистика доступа по картам
    @Query("SELECT ah.cardId, ah.owner, COUNT(ah) FROM AccessHistory ah GROUP BY ah.cardId, ah.owner ORDER BY COUNT(ah) DESC")
    List<Object[]> getCardStatistics();
    
    // Статистика успешных/неуспешных доступов
    @Query("SELECT ah.success, COUNT(ah) FROM AccessHistory ah GROUP BY ah.success")
    List<Object[]> getSuccessStatistics();
    
    // Статистика доступа по дням
    @Query("SELECT DATE_TRUNC('day', ah.accessTimestamp), COUNT(ah) FROM AccessHistory ah " +
           "WHERE ah.accessTimestamp >= :startTime GROUP BY DATE_TRUNC('day', ah.accessTimestamp) ORDER BY DATE_TRUNC('day', ah.accessTimestamp)")
    List<Object[]> getDailyStatistics(@Param("startTime") Instant startTime);
    
    // Статистика доступа по часам
    @Query("SELECT EXTRACT(HOUR FROM ah.accessTimestamp), COUNT(ah) FROM AccessHistory ah " +
           "WHERE ah.accessTimestamp >= :startTime GROUP BY EXTRACT(HOUR FROM ah.accessTimestamp) ORDER BY EXTRACT(HOUR FROM ah.accessTimestamp)")
    List<Object[]> getHourlyStatistics(@Param("startTime") Instant startTime);
    
    // Поиск частых неудачных попыток доступа
    @Query("SELECT ah.cardId, ah.readerId, COUNT(ah) FROM AccessHistory ah WHERE " +
           "ah.success = false AND ah.accessTimestamp >= :startTime " +
           "GROUP BY ah.cardId, ah.readerId HAVING COUNT(ah) > :maxFailures")
    List<Object[]> findFrequentFailures(@Param("startTime") Instant startTime, @Param("maxFailures") Long maxFailures);
    
    // Поиск подозрительных IP адресов
    @Query("SELECT ah.ipAddress, COUNT(ah) FROM AccessHistory ah WHERE " +
           "ah.success = false AND ah.accessTimestamp >= :startTime " +
           "GROUP BY ah.ipAddress HAVING COUNT(ah) > :maxFailures")
    List<Object[]> findSuspiciousIPs(@Param("startTime") Instant startTime, @Param("maxFailures") Long maxFailures);
    
    // Среднее время ответа по ридерам
    @Query("SELECT ah.readerId, AVG(ah.responseTimeMs) FROM AccessHistory ah WHERE " +
           "ah.responseTimeMs IS NOT NULL AND ah.accessTimestamp >= :startTime " +
           "GROUP BY ah.readerId")
    List<Object[]> getAverageResponseTimeByReader(@Param("startTime") Instant startTime);
    
    // Удаление старой истории доступа
    void deleteByAccessTimestampBefore(Instant cutoffTime);
    
    // Подсчет записей за период
    long countByAccessTimestampBetween(Instant start, Instant end);
    
    // Подсчет записей по типу доступа за период
    long countByAccessTypeAndAccessTimestampBetween(String accessType, Instant start, Instant end);
    
    // Подсчет успешных доступов за период
    long countBySuccessAndAccessTimestampBetween(boolean success, Instant start, Instant end);
}
