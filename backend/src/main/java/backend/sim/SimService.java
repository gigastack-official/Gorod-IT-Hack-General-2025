package backend.sim;

import backend.model.CardRecord;
import backend.repo.CardRepository;
import backend.util.B64Url;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class SimService {
    private final CardRepository cardRepository;

    public SimService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    public Map<String, String> generateResponse(String cardIdB64) {
        Optional<CardRecord> existing = cardRepository.findById(cardIdB64);
        CardRecord card = existing.orElse(null);
        if (card == null || !card.isActive()) {
            return java.util.Collections.singletonMap("status", "FAIL");
        }
        try {
            byte[] cardId = B64Url.decode(card.getCardId());
            byte[] kMaster = B64Url.decode(card.getkMaster());
            long nextCtr = (card.getLastCtr() == null ? 0L : card.getLastCtr()) + 1L;
            byte[] ctrLE = longToLe64(nextCtr);
            byte[] ad = new byte[cardId.length + ctrLE.length];
            System.arraycopy(cardId, 0, ad, 0, cardId.length);
            System.arraycopy(ctrLE, 0, ad, cardId.length, ctrLE.length);
            byte[] fullTag = hmacSha256(kMaster, ad);
            byte[] tag16 = java.util.Arrays.copyOf(fullTag, 16);
            Map<String, String> resp = new HashMap<>();
            resp.put("status", "OK");
            resp.put("ctr", B64Url.encode(ctrLE));
            resp.put("tag", B64Url.encode(tag16));
            return resp;
        } catch (Exception e) {
            return java.util.Collections.singletonMap("status", "FAIL");
        }
    }

    private static byte[] hmacSha256(byte[] key, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private static byte[] longToLe64(long v) {
        byte[] out = new byte[8];
        for (int i = 0; i < 8; i++) {
            out[i] = (byte) (v & 0xFF);
            v >>= 8;
        }
        return out;
    }
}


