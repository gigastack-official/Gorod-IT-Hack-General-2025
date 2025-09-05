// Утилиты для генерации QR кодов на фронтенде

export interface QRData {
  cardId: string;
  ctr: string;
  tag: string;
}

export interface GuestQRData {
  cardId: string;
  owner: string;
  role: string;
  timestamp: number;
}

export class QRGenerator {
  // Генерация QR данных для верификации карты
  static generateCardQR(cardId: string, ctr: string, tag: string): string {
    const qrData: QRData = {
      cardId,
      ctr,
      tag
    };
    return JSON.stringify(qrData);
  }

  // Генерация QR данных для гостевого пропуска
  static generateGuestQR(cardId: string, owner: string, role: string): string {
    const qrData: GuestQRData = {
      cardId,
      owner,
      role,
      timestamp: Date.now()
    };
    return JSON.stringify(qrData);
  }

  // Генерация QR данных в формате CARD:cardId:OWNER:owner:ROLE:role:TIMESTAMP:timestamp
  static generateGuestQRFormatted(cardId: string, owner: string, role: string): string {
    const timestamp = Date.now();
    return `CARD:${cardId}:OWNER:${owner}:ROLE:${role}:TIMESTAMP:${timestamp}`;
  }

  // Кодирование в Base64URL
  static encodeBase64URL(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Декодирование из Base64URL
  static decodeBase64URL(encoded: string): string {
    // Добавляем padding если нужно
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
    return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  }

  // Проверка формата QR кода
  static isValidQRFormat(qrData: string): boolean {
    try {
      // Пробуем парсить как JSON
      const parsed = JSON.parse(qrData);
      return !!(parsed.cardId && (parsed.ctr || parsed.owner));
    } catch {
      // Пробуем парсить как форматированную строку
      return qrData.startsWith('CARD:') && qrData.includes(':OWNER:') && qrData.includes(':ROLE:');
    }
  }

  // Парсинг QR данных
  static parseQRData(qrData: string): QRData | GuestQRData | null {
    try {
      // Пробуем парсить как JSON
      const parsed = JSON.parse(qrData);
      if (parsed.cardId && parsed.ctr && parsed.tag) {
        return parsed as QRData;
      } else if (parsed.cardId && parsed.owner && parsed.role) {
        return parsed as GuestQRData;
      }
    } catch {
      // Пробуем парсить как форматированную строку
      if (qrData.startsWith('CARD:')) {
        const parts = qrData.split(':');
        if (parts.length >= 7) {
          return {
            cardId: parts[1],
            owner: parts[3],
            role: parts[5],
            timestamp: parseInt(parts[7]) || Date.now()
          } as GuestQRData;
        }
      }
    }
    return null;
  }

  // Валидация QR кода по времени (для гостевых пропусков)
  static isQRValid(qrData: string, maxAgeHours: number = 24): boolean {
    const parsed = this.parseQRData(qrData);
    if (!parsed || !('timestamp' in parsed)) {
      return true; // Не гостевой QR, считаем валидным
    }

    const age = Date.now() - parsed.timestamp;
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Конвертируем часы в миллисекунды
    return age <= maxAge;
  }

  // Генерация QR кода для отображения (с дополнительной информацией)
  static generateDisplayQR(cardId: string, ctr: string, tag: string, owner?: string, role?: string): string {
    const baseData = this.generateCardQR(cardId, ctr, tag);
    
    if (owner && role) {
      // Добавляем информацию о владельце и роли для отображения
      return JSON.stringify({
        ...JSON.parse(baseData),
        displayInfo: {
          owner,
          role,
          generatedAt: new Date().toISOString()
        }
      });
    }
    
    return baseData;
  }
}
