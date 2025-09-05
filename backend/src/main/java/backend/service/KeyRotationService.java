package backend.service;

import backend.model.CardRecord;
import backend.model.UserRole;
import backend.repo.CardRepository;
import backend.util.KeyWrapService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class KeyRotationService {
    
    private final CardRepository cardRepository;
    private final KeyWrapService keyWrapService;
    
    public KeyRotationService(CardRepository cardRepository, KeyWrapService keyWrapService) {
        this.cardRepository = cardRepository;
        this.keyWrapService = keyWrapService;
    }
    
    @Scheduled(fixedRate = 300000) // каждые 5 минут
    @Transactional
    public void rotateKeysIfNeeded() {
        Instant now = Instant.now();
        List<CardRecord> cardsForRotation = cardRepository.findCardsForRotation(now);
        
        for (CardRecord card : cardsForRotation) {
            rotateCardKey(card);
        }
    }
    
    @Transactional
    public void rotateCardKey(CardRecord card) {
        try {
            byte[] newKey = keyWrapService.generateNewKey();
            String wrappedNewKey = keyWrapService.wrapKey(newKey);
            
            card.setkMaster(wrappedNewKey);
            card.setKeyVersion(card.getKeyVersion() + 1);
            
            UserRole role = UserRole.fromString(card.getUserRole());
            Instant nextRotation = calculateNextRotation(role, card.getKeyVersion());
            card.setNextRotationAt(nextRotation);
            
            cardRepository.save(card);
        } catch (Exception e) {
            throw new RuntimeException("Failed to rotate key for card " + card.getCardId(), e);
        }
    }
    
    public Instant calculateNextRotation(UserRole role, int keyVersion) {
        Instant now = Instant.now();
        
        long rotationIntervalSeconds;
        switch (role) {
            case ADMIN:
                rotationIntervalSeconds = 7 * 24 * 60 * 60L; // 1 неделя
                break;
            case PERMANENT:
                rotationIntervalSeconds = 30 * 24 * 60 * 60L; // 1 месяц
                break;
            case TEMPORARY:
                rotationIntervalSeconds = 3 * 24 * 60 * 60L; // 3 дня
                break;
            case GUEST:
                rotationIntervalSeconds = 12 * 60 * 60L; // 12 часов
                break;
            default:
                rotationIntervalSeconds = 30 * 24 * 60 * 60L; // 1 месяц по умолчанию
        }
        
        return now.plusSeconds(rotationIntervalSeconds);
    }
    
    public boolean shouldRotateKey(CardRecord card) {
        if (card.getNextRotationAt() == null) {
            return false;
        }
        
        return Instant.now().isAfter(card.getNextRotationAt());
    }
}
