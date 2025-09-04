package ru.gigastack.access.reader;

import com.licel.jcardsim.smartcardio.CardSimulator;
import javacard.framework.AID;
import ru.gigastack.access.applet.ChallengeResponseApplet;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.smartcardio.CommandAPDU;
import javax.smartcardio.ResponseAPDU;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Arrays;

public class ReaderSim {
    private static final int CLA = 0x80;
    private static final int INS_PERSONALIZE   = 0x01;
    private static final int INS_AEAD_RESPONSE = 0x30;

    public static void main(String[] args) throws Exception {
        CardSimulator sim = new CardSimulator();
        byte[] aidBytes = new byte[]{(byte)0xF0,(byte)0x12,(byte)0x34,(byte)0x56,(byte)0x78,(byte)0x90,(byte)0x00};
        AID aid = new AID(aidBytes, (short)0, (byte)aidBytes.length);

        // Установка апплета
        sim.installApplet(aid, ChallengeResponseApplet.class);
        sim.selectApplet(aid);

        // Персонализация: cardId(16) + K_master(32)
        byte[] cardId = new byte[16]; new SecureRandom().nextBytes(cardId);
        byte[] kMaster = "DEMO_MASTER_KEY_32_BYTES________".getBytes("UTF-8"); // ровно 32B
        ResponseAPDU resp = sim.transmitCommand(new CommandAPDU(CLA, INS_PERSONALIZE, 0, 0, concat(cardId, kMaster)));
        checkOK(resp);

        // AEAD: отправляем nonce(12) и doorId(4)
        byte[] nonce = new byte[12]; new SecureRandom().nextBytes(nonce);
        int doorId = 0xA1B2C3D4;
        byte[] doorIdBytes = ByteBuffer.allocate(4).putInt(doorId).array();

        resp = sim.transmitCommand(new CommandAPDU(CLA, INS_AEAD_RESPONSE, 0, 0, concat(nonce, doorIdBytes)));
        checkOK(resp);
        byte[] out = resp.getData();
        byte[] ctrLE = Arrays.copyOfRange(out, 0, 8);
        byte[] tag16 = Arrays.copyOfRange(out, 8, 24);

        // Оффлайн-проверка (как на бэке): K_ctr = HMAC(Km, "ctr"||LE64(ctr)); tag = Trunc16(HMAC(K_ctr, AD))
        byte[] kCtr = hmac("HmacSHA256", kMaster, concat("ctr".getBytes("US-ASCII"), ctrLE));
        byte[] ad = concat(cardId, doorIdBytes, nonce, ctrLE);
        byte[] tagFull = hmac("HmacSHA256", kCtr, ad);
        boolean ok = Arrays.equals(tag16, Arrays.copyOf(tagFull, 16));
        System.out.println(Arrays.toString(out));
        System.out.println("AEAD проверка: " + (ok ? "OK" : "FAIL"));
    }

    private static void checkOK(ResponseAPDU resp){ if (resp.getSW()!=0x9000) throw new IllegalStateException(String.format("SW=%04X", resp.getSW())); }
    private static byte[] concat(byte[]... arrs){ int n=0; for (byte[] a:arrs) n+=a.length; byte[] r=new byte[n]; int p=0; for (byte[] a:arrs){ System.arraycopy(a,0,r,p,a.length); p+=a.length; } return r; }
    private static byte[] hmac(String algo, byte[] key, byte[] msg) throws Exception {
        Mac mac = Mac.getInstance(algo);
        mac.init(new SecretKeySpec(key, algo));
        return mac.doFinal(msg);
    }
}
