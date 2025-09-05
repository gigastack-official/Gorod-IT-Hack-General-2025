// Типы для системы аудита и логирования

export interface AuditEvent {
  id: number;
  eventType: string;
  eventCategory: string;
  cardId?: string;
  readerId?: string;
  owner?: string;
  userRole?: string;
  eventTimestamp: string;
  success: boolean;
  message?: string;
  errorCode?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  additionalData?: string;
}

export interface AccessHistory {
  id: number;
  cardId: string;
  readerId: string;
  owner?: string;
  userRole?: string;
  accessTimestamp: string;
  accessType: string;
  success: boolean;
  counterValue?: number;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  failureReason?: string;
  responseTimeMs?: number;
  additionalMetadata?: string;
}

export interface AuditStatistics {
  eventTypes: string[][];
  eventCategories: string[][];
  successStats: string[][];
  dailyStats: string[][];
}

export interface AccessStatistics {
  accessTypes: string[][];
  readerStats: string[][];
  cardStats: string[][];
  successStats: string[][];
  dailyStats: string[][];
  hourlyStats: string[][];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface EventCount {
  totalEvents: number;
  cardCreated: number;
  cardVerified: number;
  accessGranted: number;
  accessDenied: number;
}

export interface AccessCount {
  totalAccess: number;
  successfulAccess: number;
  failedAccess: number;
}

export interface AuditFilters {
  eventType?: string;
  eventCategory?: string;
  cardId?: string;
  readerId?: string;
  owner?: string;
  accessType?: string;
  success?: boolean;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface SuspiciousActivity {
  cardId: string;
  readerId: string;
  failureCount: number;
  lastFailure: string;
  ipAddress?: string;
  failureReasons: string[];
}

export interface FrequentFailure {
  cardId: string;
  failureCount: number;
  lastFailure: string;
  failureReasons: string[];
}

export interface SuspiciousIP {
  ipAddress: string;
  failureCount: number;
  lastFailure: string;
  affectedCards: string[];
}

export interface ReaderResponseTime {
  readerId: string;
  averageResponseTimeMs: number;
  requestCount: number;
}
