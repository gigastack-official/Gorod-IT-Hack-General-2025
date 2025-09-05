package backend.service;

import backend.dto.CreateCardRequest;
import backend.dto.CreateCardResponse;
import backend.model.CardRecord;
import backend.model.UserRole;
import backend.repo.CardRepository;
import backend.util.B64Url;
import backend.util.KeyWrapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class CardService {
    private final SecureRandom secureRandom = new SecureRandom();
    private final CardRepository cardRepository;
    private final KeyWrapService keyWrapService;
    private final QrCodeService qrCodeService;
    
    @Autowired
    private KeyRotationService keyRotationService;

    public CardService(CardRepository cardRepository, KeyWrapService keyWrapService, QrCodeService qrCodeService) {
        this.cardRepository = cardRepository;
        this.keyWrapService = keyWrapService;
        this.qrCodeService = qrCodeService;
    }

    public CreateCardResponse createCardWithRole(CreateCardRequest request) {
        try {
            UserRole role = UserRole.fromString(request.getUserRole());
            
            byte[] cardIdBytes = new byte[16];
            byte[] kMasterBytes = new byte[32];
            secureRandom.nextBytes(cardIdBytes);
            secureRandom.nextBytes(kMasterBytes);
            
            String encodedCardId = B64Url.encode(cardIdBytes);
            String wrappedKMaster = B64Url.encode(kMasterBytes);
            
            CardRecord cardRecord = new CardRecord(encodedCardId, wrappedKMaster);
            cardRecord.setOwner(request.getOwner());
            cardRecord.setUserRole(role.getRoleName());
            cardRecord.setKeyVersion(1);
            
            Instant now = Instant.now();
            cardRecord.setCreatedAt(now);
            cardRecord.setExpiresAt(now.plusSeconds(request.getTtlSeconds()));
            cardRecord.setNextRotationAt(calculateNextRotation(role, 1));
            cardRecord.setActive(true);
            
            if (request.isGenerateQr()) {
                String qrCode = qrCodeService.generateQrCode(encodedCardId, request.getOwner(), role.getRoleName());
                cardRecord.setQrCode(qrCode);
            }
            
            cardRecord = cardRepository.save(cardRecord);
            
            CreateCardResponse response = new CreateCardResponse();
            response.setStatus("OK");
            response.setCardId(cardRecord.getCardId());
            response.setOwner(cardRecord.getOwner());
            response.setExpiresAt(cardRecord.getExpiresAt().toString());
            response.setUserRole(cardRecord.getUserRole());
            response.setKeyVersion(cardRecord.getKeyVersion());
            response.setQrCode(cardRecord.getQrCode());
            
            return response;
        } catch (Exception e) {
            CreateCardResponse response = new CreateCardResponse();
            response.setStatus("FAIL");
            return response;
        }
    }

    public CardRecord personalize(String owner, long ttlSeconds) {
        CreateCardRequest request = new CreateCardRequest();
        request.setOwner(owner);
        request.setTtlSeconds(ttlSeconds);
        request.setUserRole("permanent");
        
        CreateCardResponse response = createCardWithRole(request);
        if ("OK".equals(response.getStatus())) {
            return cardRepository.findById(response.getCardId()).orElse(null);
        }
        return null;
    }

    public Optional<CardRecord> findById(String cardId) {
        return cardRepository.findById(cardId);
    }

    public boolean verifyTruncTag(String cardIdB64, byte[] ctrLE, byte[] tag16) {
        Optional<CardRecord> existing = cardRepository.findById(cardIdB64);
        CardRecord cardRecord = existing.orElse(null);
        if (cardRecord == null) return false;
        if (!cardRecord.isActive()) return false;
        if (cardRecord.getExpiresAt() != null && Instant.now().isAfter(cardRecord.getExpiresAt())) return false;
        
        if (keyRotationService.shouldRotateKey(cardRecord)) {
            keyRotationService.rotateCardKey(cardRecord);
            cardRecord = cardRepository.findById(cardIdB64).orElse(null);
            if (cardRecord == null) return false;
        }
        
        long ctrValue = le64ToLong(ctrLE);
        Long last = cardRecord.getLastCtr();
        if (last != null && ctrValue <= last) {
            return false;
        }
        try {
            byte[] cardId = B64Url.decode(cardRecord.getCardId());
            byte[] kMaster = B64Url.decode(cardRecord.getkMaster());
            byte[] ad = new byte[cardId.length + ctrLE.length];
            System.arraycopy(cardId, 0, ad, 0, cardId.length);
            System.arraycopy(ctrLE, 0, ad, cardId.length, ctrLE.length);
            byte[] fullTag = hmacSha256(kMaster, ad);
            byte[] expectedTag16 = java.util.Arrays.copyOf(fullTag, 16);
            boolean ok = constantTimeEquals(expectedTag16, tag16);
            if (!ok) return false;
            int updated = cardRepository.updateLastCtrIfGreater(cardIdB64, ctrValue);
            return updated > 0;
        } catch (java.security.NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            return false;
        }
    }

    public Optional<CardRecord> revoke(String cardIdB64) {
        return cardRepository.findById(cardIdB64).map(c -> {
            c.setActive(false);
            return cardRepository.save(c);
        });
    }

    public Optional<CardRecord> extend(String cardIdB64, long extraSeconds) {
        return cardRepository.findById(cardIdB64).map(c -> {
            Instant base = c.getExpiresAt() != null ? c.getExpiresAt() : Instant.now();
            c.setExpiresAt(base.plusSeconds(extraSeconds));
            return cardRepository.save(c);
        });
    }

    private byte[] hmacSha256(byte[] key, byte[] data) throws java.security.NoSuchAlgorithmException, java.security.InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a == null || b == null || a.length != b.length) return false;
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }

    private long le64ToLong(byte[] le8) {
        if (le8 == null || le8.length != 8) return -1L;
        long v = 0L;
        for (int i = 7; i >= 0; i--) {
            v = (v << 8) | (le8[i] & 0xFFL);
        }
        return v;
    }
    
    private Instant calculateNextRotation(UserRole role, int keyVersion) {
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
}


