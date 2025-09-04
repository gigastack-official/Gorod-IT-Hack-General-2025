package backend.sim;

import backend.model.CardRecord;
import backend.repo.CardRepository;
import backend.util.B64Url;
import com.licel.jcardsim.smartcardio.CardSimulator;
import jakarta.transaction.Transactional;
import javacard.framework.AID;
import org.springframework.stereotype.Service;
import ru.gigastack.access.applet.ChallengeResponseApplet;

import javax.smartcardio.CommandAPDU;
import javax.smartcardio.ResponseAPDU;
import java.util.Arrays;
import java.util.Optional;

@Service
public class SimService {
    private static final int CLA = 0x80;
    private static final int INS_PERSONALIZE = 0x01;
    private static final int INS_RESPONSE    = 0x30;

    private final CardRepository cardRepository;

    public SimService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @Transactional
    public java.util.Map<String, String> generateResponse(String cardIdB64) {
        Optional<CardRecord> existing = cardRepository.findById(cardIdB64);
        CardRecord card = existing.orElse(null);
        if (card == null) {
            return java.util.Collections.singletonMap("status", "FAIL");
        }
        try {
            byte[] cardId = B64Url.decode(card.getCardId());
            byte[] kMaster = B64Url.decode(card.getkMaster());

            CardSimulator sim = new CardSimulator();
            byte[] aidBytes = new byte[]{(byte)0xF0,(byte)0x12,(byte)0x34,(byte)0x56,(byte)0x78,(byte)0x90,(byte)0x00};
            AID aid = new AID(aidBytes, (short)0, (byte)aidBytes.length);
            sim.installApplet(aid, ChallengeResponseApplet.class);
            sim.selectApplet(aid);

            byte[] personalizeData = concat(cardId, kMaster);
            ResponseAPDU r = sim.transmitCommand(new CommandAPDU(CLA, INS_PERSONALIZE, 0, 0, personalizeData));
            if (r.getSW() != 0x9000) {
                return java.util.Collections.singletonMap("status", "FAIL");
            }

            r = sim.transmitCommand(new CommandAPDU(CLA, INS_RESPONSE, 0, 0));
            if (r.getSW() != 0x9000) {
                return java.util.Collections.singletonMap("status", "FAIL");
            }
            byte[] out = r.getData();
            byte[] ctrLE = Arrays.copyOfRange(out, 0, 8);
            byte[] tag16 = Arrays.copyOfRange(out, 8, 24);

            java.util.Map<String, String> resp = new java.util.HashMap<>();
            resp.put("status", "OK");
            resp.put("ctr", B64Url.encode(ctrLE));
            resp.put("tag", B64Url.encode(tag16));
            return resp;
        } catch (Exception e) {
            return java.util.Collections.singletonMap("status", "FAIL");
        }
    }

    private static byte[] concat(byte[] a, byte[] b){
        byte[] r = new byte[a.length + b.length];
        System.arraycopy(a, 0, r, 0, a.length);
        System.arraycopy(b, 0, r, a.length, b.length);
        return r;
    }
}


