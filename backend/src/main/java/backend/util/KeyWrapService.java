package backend.util;

import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class KeyWrapService {
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    
    private final SecretKey kek;
    
    public KeyWrapService() {
        String kekB64 = System.getenv("APP_KEK_B64");
        if (kekB64 == null || kekB64.isEmpty()) {
            kekB64 = "default-kek-for-development-only";
        }
        
        byte[] kekBytes = kekB64.getBytes(StandardCharsets.UTF_8);
        if (kekBytes.length != 32) {
            byte[] paddedKek = new byte[32];
            System.arraycopy(kekBytes, 0, paddedKek, 0, Math.min(kekBytes.length, 32));
            kekBytes = paddedKek;
        }
        
        this.kek = new SecretKeySpec(kekBytes, ALGORITHM);
    }
    
    public String wrapKey(byte[] keyToWrap) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, kek, gcmSpec);
            
            byte[] wrappedKey = cipher.doFinal(keyToWrap);
            
            byte[] result = new byte[GCM_IV_LENGTH + wrappedKey.length];
            System.arraycopy(iv, 0, result, 0, GCM_IV_LENGTH);
            System.arraycopy(wrappedKey, 0, result, GCM_IV_LENGTH, wrappedKey.length);
            
            return Base64.getUrlEncoder().withoutPadding().encodeToString(result);
        } catch (Exception e) {
            throw new RuntimeException("Failed to wrap key", e);
        }
    }
    
    public byte[] unwrapKey(String wrappedKeyB64) {
        try {
            byte[] wrappedKey = Base64.getUrlDecoder().decode(wrappedKeyB64);
            
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encryptedKey = new byte[wrappedKey.length - GCM_IV_LENGTH];
            
            System.arraycopy(wrappedKey, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(wrappedKey, GCM_IV_LENGTH, encryptedKey, 0, encryptedKey.length);
            
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, kek, gcmSpec);
            
            return cipher.doFinal(encryptedKey);
        } catch (Exception e) {
            throw new RuntimeException("Failed to unwrap key", e);
        }
    }
    
    public byte[] generateNewKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(256);
            return keyGenerator.generateKey().getEncoded();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate new key", e);
        }
    }
}
