package backend.model;

public enum UserRole {
    ADMIN("admin", 365 * 24 * 60 * 60L), // 1 год
    PERMANENT("permanent", 90 * 24 * 60 * 60L), // 3 месяца
    TEMPORARY("temporary", 7 * 24 * 60 * 60L), // 1 неделя
    GUEST("guest", 24 * 60 * 60L); // 1 день
    
    private final String roleName;
    private final long defaultTtlSeconds;
    
    UserRole(String roleName, long defaultTtlSeconds) {
        this.roleName = roleName;
        this.defaultTtlSeconds = defaultTtlSeconds;
    }
    
    public String getRoleName() {
        return roleName;
    }
    
    public long getDefaultTtlSeconds() {
        return defaultTtlSeconds;
    }
    
    public static UserRole fromString(String roleName) {
        for (UserRole role : values()) {
            if (role.roleName.equalsIgnoreCase(roleName)) {
                return role;
            }
        }
        return PERMANENT; // default fallback
    }
}
