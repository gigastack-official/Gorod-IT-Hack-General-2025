package backend.repo;

import backend.model.CardRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CardRepository extends JpaRepository<CardRecord, String> {
    @Transactional
    @Modifying
    @Query("update CardRecord c set c.lastCtr = :newCtr where c.cardId = :cardId and (c.lastCtr is null or :newCtr > c.lastCtr)")
    int updateLastCtrIfGreater(@Param("cardId") String cardId, @Param("newCtr") long newCtr);
}


