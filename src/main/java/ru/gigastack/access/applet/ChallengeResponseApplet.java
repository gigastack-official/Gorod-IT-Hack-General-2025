package ru.gigastack.access.applet;

import javacard.framework.*;
import javacard.security.MessageDigest;

public class ChallengeResponseApplet extends Applet {
    private static final byte CLA_SEC = (byte)0x80;
    private static final byte INS_PERSONALIZE   = (byte)0x01;
    private static final byte INS_RESPONSE      = (byte)0x30;

    private static final short SHA256_LEN = 32;
    private static final short K_MASTER_LEN = 32;
    private static final short CARD_ID_LEN  = 16;

    private static final short SW_NOT_PERSONALIZED = (short)0x6985;
    private static final short SW_WRONG_DATA       = (short)0x6A80;

    private final MessageDigest sha256 = MessageDigest.getInstance(MessageDigest.ALG_SHA_256, false);

    private byte[] cardId;              // 16B
    private byte[] kMaster;             // 32B
    private byte[] ctr = new byte[8];   // LE64
    private boolean personalized = false;

    private final byte[] tmp = new byte[SHA256_LEN];

    protected ChallengeResponseApplet() { register(); }
    public static void install(byte[] bArray, short bOffset, byte bLength) { new ChallengeResponseApplet(); }

    public void process(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        if (selectingApplet()) return;
        if (buf[ISO7816.OFFSET_CLA] != CLA_SEC) ISOException.throwIt(ISO7816.SW_CLA_NOT_SUPPORTED);

        switch (buf[ISO7816.OFFSET_INS]) {
            case INS_PERSONALIZE: cmdPersonalize(apdu); break;
            case INS_RESPONSE:    cmdResponse(apdu);    break;
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

        Util.arrayFillNonAtomic(ctr, (short)0, (short)ctr.length, (byte)0x00);
        personalized = true;
        ISOException.throwIt(ISO7816.SW_NO_ERROR);
    }

    private void cmdResponse(APDU apdu) {
        if (!personalized) ISOException.throwIt(SW_NOT_PERSONALIZED);

        incCtr();

        byte[] buf = apdu.getBuffer();

        // AD = cardId || ctr
        byte[] ad = JCSystem.makeTransientByteArray((short)(CARD_ID_LEN + 8), JCSystem.CLEAR_ON_DESELECT);
        short p = 0;
        Util.arrayCopyNonAtomic(cardId, (short)0, ad, p, CARD_ID_LEN); p += CARD_ID_LEN;
        Util.arrayCopyNonAtomic(ctr, (short)0, ad, p, (short)8);

        // tag = Trunc16(HMAC_SHA256(K_master, AD))
        hmacSha256(kMaster, (short)kMaster.length, ad, (short)0, (short)ad.length, tmp, (short)0);

        Util.arrayCopyNonAtomic(ctr, (short)0, buf, (short)0, (short)8);
        Util.arrayCopyNonAtomic(tmp, (short)0, buf, (short)8, (short)16);
        apdu.setOutgoingAndSend((short)0, (short)24);
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

    private void hmacSha256(byte[] key, short keyLen, byte[] msg, short msgOff, short msgLen, byte[] out, short outOff) {
        // Простейший HMAC: K0→ipad/opad
        byte[] k0 = JCSystem.makeTransientByteArray((short)64, JCSystem.CLEAR_ON_DESELECT);
        if (keyLen > 64) {
            sha256.doFinal(key, (short)0, keyLen, k0, (short)0);
            Util.arrayFillNonAtomic(k0, (short)32, (short)32, (byte)0x00);
        } else {
            Util.arrayFillNonAtomic(k0, (short)0, (short)64, (byte)0x00);
            Util.arrayCopyNonAtomic(key, (short)0, k0, (short)0, keyLen);
        }

        byte[] ipad = JCSystem.makeTransientByteArray((short)64, JCSystem.CLEAR_ON_DESELECT);
        byte[] opad = JCSystem.makeTransientByteArray((short)64, JCSystem.CLEAR_ON_DESELECT);
        for (short i=0;i<64;i++){ ipad[i]=(byte)(k0[i]^0x36); opad[i]=(byte)(k0[i]^0x5c); }

        sha256.reset(); sha256.update(ipad,(short)0,(short)64);
        sha256.doFinal(msg, msgOff, msgLen, tmp, (short)0);

        sha256.reset(); sha256.update(opad,(short)0,(short)64);
        sha256.doFinal(tmp, (short)0, (short)32, out, outOff);
    }
}
