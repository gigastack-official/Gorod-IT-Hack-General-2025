package backend.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
public class AuditService {
    public static class AuditEvent {
        public final Instant ts;
        public final String type;
        public final String cardId;
        public final String detail;

        public AuditEvent(Instant ts, String type, String cardId, String detail) {
            this.ts = ts;
            this.type = type;
            this.cardId = cardId;
            this.detail = detail;
        }
    }

    private final Deque<AuditEvent> ring = new ArrayDeque<>(512);
    private final int capacity = 1000;

    public synchronized void record(String type, String cardId, String detail) {
        if (ring.size() >= capacity) {
            ring.removeFirst();
        }
        ring.addLast(new AuditEvent(Instant.now(), type, cardId, detail));
    }

    public synchronized List<AuditEvent> recent(int limit) {
        int n = Math.min(limit, ring.size());
        List<AuditEvent> out = new ArrayList<>(n);
        ring.stream().skip(Math.max(0, ring.size() - n)).forEach(out::add);
        return out;
    }
}


