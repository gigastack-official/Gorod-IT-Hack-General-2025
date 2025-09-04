package ru.gigastack.access.applet;

import javacard.framework.*;
import javacard.security.MessageDigest;

public class ChallengeResponseApplet extends Applet {
    private static final byte CLA_SEC = (byte)0x80;
    private static final byte INS_PERSONALIZE   = (byte)0x01;
    private static final byte INS_AEAD_RESPONSE = (byte)0x30;

    private static final short SHA256_LEN = 32;
    private static final short K_MASTER_LEN = 32;
    private static final short CARD_ID_LEN  = 16;

    private static final short SW_NOT_PERSONALIZED = (short)0x6985;
    private static final short SW_WRONG_DATA       = (short)0x6A80;

    private final MessageDigest sha256 = MessageDigest.getInstance(MessageDigest.ALG_SHA_256, false);

    // Персистентные данные
    private byte[] cardId;              // 16B
    private byte[] kMaster;             // 32B
    private byte[] ctr = new byte[8];   // LE64 (младший байт — ctr[0])
    private boolean personalized = false;

    // Буферы
    private final byte[] tmp = new byte[SHA256_LEN];
    private final byte[] kCtr = new byte[SHA256_LEN]; // HMAC вывод (используем как ключ K_ctr)
    private final byte[] ipad = new byte[64];
    private final byte[] opad = new byte[64];

    protected ChallengeResponseApplet() { register(); }
    public static void install(byte[] bArray, short bOffset, byte bLength) { new ChallengeResponseApplet(); }

    public void process(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        if (selectingApplet()) return;
        if (buf[ISO7816.OFFSET_CLA] != CLA_SEC) ISOException.throwIt(ISO7816.SW_CLA_NOT_SUPPORTED);

        switch (buf[ISO7816.OFFSET_INS]) {
            case INS_PERSONALIZE:   cmdPersonalize(apdu);   break;
            case INS_AEAD_RESPONSE: cmdAeadResponse(apdu);  break;
            default: ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void cmdPersonalize(APDU apdu) {
        if (personalized) ISOException.throwIt(ISO7816.SW_COMMAND_NOT_ALLOWED);
        short recv = apdu.setIncomingAndReceive();
        if (recv != (CARD_ID_LEN + K_MASTER_LEN)) ISOException.throwIt(SW_WRONG_DATA);
        byte[] buf = apdu.getBuffer();
        short off = ISO7816.OFFSET_CDATA;

        cardId  = new byte[CARD_ID_LEN];
        kMaster = new byte[K_MASTER_LEN];
        Util.arrayCopyNonAtomic(buf, off, cardId, (short)0, CARD_ID_LEN); off += CARD_ID_LEN;
        Util.arrayCopyNonAtomic(buf, off, kMaster, (short)0, K_MASTER_LEN);

        // ctr = 0
        Util.arrayFillNonAtomic(ctr, (short)0, (short)ctr.length, (byte)0x00);
        personalized = true;
        ISOException.throwIt(ISO7816.SW_NO_ERROR);
    }

    private void cmdAeadResponse(APDU apdu) {
        if (!personalized) ISOException.throwIt(SW_NOT_PERSONALIZED);
        byte[] buf = apdu.getBuffer();
        short recv = apdu.setIncomingAndReceive();
        if (recv != 16) ISOException.throwIt(SW_WRONG_DATA);
        short off = ISO7816.OFFSET_CDATA;

        // Вход: nonce(12B) || doorId(4B)
        byte[] nonce = JCSystem.makeTransientByteArray((short)12, JCSystem.CLEAR_ON_DESELECT);
        byte[] doorId = JCSystem.makeTransientByteArray((short)4, JCSystem.CLEAR_ON_DESELECT);
        Util.arrayCopyNonAtomic(buf, off, nonce, (short)0, (short)12); off += 12;
        Util.arrayCopyNonAtomic(buf, off, doorId, (short)0, (short)4);

        // ctr++ (LE64)
        incCtr();

        // AD = cardId || doorId || nonce || ctr(8B LE)
        byte[] ad = JCSystem.makeTransientByteArray((short)(CARD_ID_LEN + 4 + 12 + 8), JCSystem.CLEAR_ON_DESELECT);
        short p = 0;
        Util.arrayCopyNonAtomic(cardId, (short)0, ad, p, CARD_ID_LEN); p += CARD_ID_LEN;
        Util.arrayCopyNonAtomic(doorId, (short)0, ad, p, (short)4); p += 4;
        Util.arrayCopyNonAtomic(nonce, (short)0, ad, p, (short)12); p += 12;
        Util.arrayCopyNonAtomic(ctr, (short)0, ad, p, (short)8);

        // K_ctr = HMAC_SHA256(K_master, "ctr" || LE64(ctr))
        deriveKctr();

        // tag = Trunc16( HMAC_SHA256(K_ctr, AD) )
        byte[] tag = JCSystem.makeTransientByteArray((short)16, JCSystem.CLEAR_ON_DESELECT);
        hmacSha256(kCtr, (short)kCtr.length, ad, (short)0, (short)ad.length, tmp, (short)0); // tmp = 32B
        Util.arrayCopyNonAtomic(tmp, (short)0, tag, (short)0, (short)16);

        // Ответ: ctr(8B LE) || tag(16B)
        Util.arrayCopyNonAtomic(ctr, (short)0, buf, (short)0, (short)8);
        Util.arrayCopyNonAtomic(tag, (short)0, buf, (short)8, (short)16);
        apdu.setOutgoingAndSend((short)0, (short)24);
    }

    private void deriveKctr() {
        // msg = "ctr" || LE64(ctr)
        byte[] msg = JCSystem.makeTransientByteArray((short)(3 + 8), JCSystem.CLEAR_ON_DESELECT);
        msg[0] = 'c'; msg[1] = 't'; msg[2] = 'r';
        Util.arrayCopyNonAtomic(ctr, (short)0, msg, (short)3, (short)8);
        hmacSha256(kMaster, (short)kMaster.length, msg, (short)0, (short)msg.length, kCtr, (short)0);
    }

    private void incCtr() {
        short i=0;
        while (i < 8) {
            short v = (short)((ctr[i] & 0xFF) + 1);
            ctr[i] = (byte)v;
            if (v <= 0xFF) break;
            i++;
        }
    }

    // HMAC-SHA256(key, msg) -> out(32B)
    private void hmacSha256(byte[] key, short keyLen, byte[] msg, short msgOff, short msgLen, byte[] out, short outOff) {
        // K0 (64B)
        byte[] k0 = JCSystem.makeTransientByteArray((short)64, JCSystem.CLEAR_ON_DESELECT);
        if (keyLen > 64) {
            sha256.doFinal(key, (short)0, keyLen, k0, (short)0);
            Util.arrayFillNonAtomic(k0, (short)32, (short)32, (byte)0x00);
        } else {
            Util.arrayFillNonAtomic(k0, (short)0, (short)64, (byte)0x00);
            Util.arrayCopyNonAtomic(key, (short)0, k0, (short)0, keyLen);
        }
        for (short i=0;i<64;i++){ ipad[i]=(byte)(k0[i]^0x36); opad[i]=(byte)(k0[i]^0x5c); }

        sha256.reset(); sha256.update(ipad,(short)0,(short)64);
        sha256.doFinal(msg, msgOff, msgLen, tmp, (short)0);

        sha256.reset(); sha256.update(opad,(short)0,(short)64);
        sha256.doFinal(tmp, (short)0, (short)32, out, outOff);
    }
}
