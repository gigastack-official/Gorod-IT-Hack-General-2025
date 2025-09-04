package backend.repo;

import backend.model.CardRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardRepository extends JpaRepository<CardRecord, String> {
}


