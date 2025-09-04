package backend.util;

import java.util.Base64;

public class B64Url {
    private B64Url() {}
    public static String encode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    public static byte[] decode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }
}


