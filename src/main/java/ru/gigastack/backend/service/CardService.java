package ru.gigastack.backend.service;

import org.springframework.stereotype.Service;
import ru.gigastack.backend.dto.CreateCardResponse;
import ru.gigastack.backend.dto.VerifyRequest;
import ru.gigastack.model.CardRecord;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CardService {
    private final Map<String, CardRecord> db = new ConcurrentHashMap<>();
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    public CreateCardResponse create() {
        byte[] cardId = random(16);
        byte[] kMaster = random(32);
        String cardIdB64 = B64.encodeToString(cardId);
        String kMasterB64 = B64.encodeToString(kMaster);
        db.put(cardIdB64, new CardRecord(cardId, kMaster, -1));
        return new CreateCardResponse(cardIdB64, kMasterB64);
    }

    public boolean verify(VerifyRequest req) throws Exception {
        CardRecord rec = db.get(req.cardIdB64());
        if (rec == null) return false;

        byte[] cardId = rec.cardId();
        byte[] kMaster = rec.kMaster();
        byte[] nonce = B64D.decode(req.nonceB64());
        byte[] ctrLE = B64D.decode(req.ctrLEB64());
        byte[] tag = B64D.decode(req.tagB64());
        if (nonce.length != 12 || ctrLE.length != 8 || tag.length != 16) return false;

        long ctr = toLongLE(ctrLE);
        if (ctr <= rec.lastCtr()) return false; // anti-replay

        byte[] doorId = ByteBuffer.allocate(4).putInt(req.doorId()).array();
        byte[] kCtr = hmac(kMaster, concat("ctr".getBytes(StandardCharsets.US_ASCII), ctrLE));
        byte[] ad = concat(cardId, doorId, nonce, ctrLE);
        byte[] tagFull = hmac(kCtr, ad);
        byte[] expected = Arrays.copyOf(tagFull, 16);

        boolean ok = constantTimeEq(expected, tag);
        if (ok) rec.setLastCtr(ctr);
        return ok;
    }

    private static byte[] random(int n) {
        byte[] b = new byte[n];
        new SecureRandom().nextBytes(b);
        return b;
    }

    private static long toLongLE(byte[] le8) {
        return ByteBuffer.wrap(le8).order(ByteOrder.LITTLE_ENDIAN).getLong();
    }

    private static byte[] hmac(byte[] key, byte[] msg) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(msg);
    }

    private static boolean constantTimeEq(byte[] a, byte[] b) {
        if (a.length != b.length) return false;
        int r = 0;
        for (int i = 0; i < a.length; i++) r |= (a[i] ^ b[i]);
        return r == 0;
    }

    private static byte[] concat(byte[]... arrs) {
        int n = 0; for (byte[] a : arrs) n += a.length;
        byte[] out = new byte[n];
        int p = 0; for (byte[] a : arrs) { System.arraycopy(a, 0, out, p, a.length); p += a.length; }
        return out;
    }
}
