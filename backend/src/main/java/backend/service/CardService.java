package backend.service;

import backend.model.CardRecord;
import backend.repo.CardRepository;
import backend.util.B64Url;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

@Service
public class CardService {
    private final SecureRandom secureRandom = new SecureRandom();
    private final CardRepository cardRepository;

    public CardService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    public CardRecord createCard() {
        byte[] cardIdBytes = new byte[16];
        byte[] kMasterBytes = new byte[32];
        secureRandom.nextBytes(cardIdBytes);
        secureRandom.nextBytes(kMasterBytes);
        String encodedCardId = B64Url.encode(cardIdBytes);
        String encodedKMaster = B64Url.encode(kMasterBytes);
        CardRecord cardRecord = new CardRecord(encodedCardId, encodedKMaster);
        return cardRepository.save(cardRecord);
    }

    public Optional<CardRecord> findById(String cardId) {
        return cardRepository.findById(cardId);
    }

    public boolean verifyTruncTag(String cardIdB64, byte[] ctrLE, byte[] tag16) {
        Optional<CardRecord> existing = cardRepository.findById(cardIdB64);
        CardRecord cardRecord = existing.orElse(null);
        if (cardRecord == null) return false;
        try {
            byte[] cardId = B64Url.decode(cardRecord.getCardId());
            byte[] kMaster = B64Url.decode(cardRecord.getkMaster());
            byte[] ad = new byte[cardId.length + ctrLE.length];
            System.arraycopy(cardId, 0, ad, 0, cardId.length);
            System.arraycopy(ctrLE, 0, ad, cardId.length, ctrLE.length);
            byte[] fullTag = hmacSha256(kMaster, ad);
            byte[] expectedTag16 = java.util.Arrays.copyOf(fullTag, 16);
            return constantTimeEquals(expectedTag16, tag16);
        } catch (java.security.NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            return false;
        }
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
}


