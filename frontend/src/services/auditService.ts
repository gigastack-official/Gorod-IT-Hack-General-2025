import { 
  AuditEvent, 
  AccessHistory, 
  AuditStatistics, 
  AccessStatistics, 
  PaginatedResponse, 
  EventCount, 
  AccessCount, 
  AuditFilters,
  SuspiciousActivity,
  FrequentFailure,
  SuspiciousIP,
  ReaderResponseTime
} from '@/types/audit';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://gigastack.v6.rocks/api";

export class AuditService {
  // Получить события аудита с фильтрами
  static async getAuditEvents(filters: AuditFilters = {}): Promise<PaginatedResponse<AuditEvent>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/audit/events?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch audit events: ${response.status}`);
    }
    return response.json();
  }

  // Получить историю доступа с фильтрами
  static async getAccessHistory(filters: AuditFilters = {}): Promise<PaginatedResponse<AccessHistory>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/audit/access-history?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch access history: ${response.status}`);
    }
    return response.json();
  }

  // Получить последний доступ к карте
  static async getLastAccess(cardId: string): Promise<AccessHistory> {
    const response = await fetch(`${API_BASE}/audit/last-access/${encodeURIComponent(cardId)}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Access not found');
      }
      throw new Error(`Failed to fetch last access: ${response.status}`);
    }
    return response.json();
  }

  // Получить последний успешный доступ к карте
  static async getLastSuccessfulAccess(cardId: string): Promise<AccessHistory> {
    const response = await fetch(`${API_BASE}/audit/last-successful-access/${encodeURIComponent(cardId)}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Successful access not found');
      }
      throw new Error(`Failed to fetch last successful access: ${response.status}`);
    }
    return response.json();
  }

  // Получить статистику событий
  static async getEventStatistics(): Promise<AuditStatistics> {
    const response = await fetch(`${API_BASE}/audit/statistics/events`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event statistics: ${response.status}`);
    }
    return response.json();
  }

  // Получить статистику доступа
  static async getAccessStatistics(): Promise<AccessStatistics> {
    const response = await fetch(`${API_BASE}/audit/statistics/access`);
    if (!response.ok) {
      throw new Error(`Failed to fetch access statistics: ${response.status}`);
    }
    return response.json();
  }

  // Найти подозрительную активность
  static async findSuspiciousActivity(maxFailures: number = 5): Promise<AuditEvent[]> {
    const response = await fetch(`${API_BASE}/audit/suspicious-activity?maxFailures=${maxFailures}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch suspicious activity: ${response.status}`);
    }
    return response.json();
  }

  // Найти частые неудачные попытки доступа
  static async findFrequentFailures(maxFailures: number = 3): Promise<FrequentFailure[]> {
    const response = await fetch(`${API_BASE}/audit/frequent-failures?maxFailures=${maxFailures}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch frequent failures: ${response.status}`);
    }
    return response.json();
  }

  // Найти подозрительные IP адреса
  static async findSuspiciousIPs(maxFailures: number = 5): Promise<SuspiciousIP[]> {
    const response = await fetch(`${API_BASE}/audit/suspicious-ips?maxFailures=${maxFailures}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch suspicious IPs: ${response.status}`);
    }
    return response.json();
  }

  // Получить среднее время ответа по ридерам
  static async getAverageResponseTimeByReader(): Promise<ReaderResponseTime[]> {
    const response = await fetch(`${API_BASE}/audit/response-times`);
    if (!response.ok) {
      throw new Error(`Failed to fetch response times: ${response.status}`);
    }
    return response.json();
  }

  // Получить количество событий за период
  static async getEventCount(start: string, end: string): Promise<EventCount> {
    const response = await fetch(`${API_BASE}/audit/count/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event count: ${response.status}`);
    }
    return response.json();
  }

  // Получить количество записей доступа за период
  static async getAccessCount(start: string, end: string): Promise<AccessCount> {
    const response = await fetch(`${API_BASE}/audit/count/access?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch access count: ${response.status}`);
    }
    return response.json();
  }

  // Очистить старые записи аудита
  static async cleanupOldRecords(retentionDays: number = 90): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/audit/cleanup?retentionDays=${retentionDays}`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(`Failed to cleanup old records: ${response.status}`);
    }
    return response.json();
  }

  // Экспорт событий аудита в CSV
  static async exportEvents(filters: AuditFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/audit/export/events?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to export events: ${response.status}`);
    }
    return response.blob();
  }

  // Экспорт истории доступа в CSV
  static async exportAccessHistory(filters: AuditFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/audit/export/access-history?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to export access history: ${response.status}`);
    }
    return response.blob();
  }
}
