import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, RefreshCw, Users, Clock, CheckCircle, AlertCircle, Info, Download, Copy } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRGenerator from "@/components/QRGenerator";
import { useToast } from "@/hooks/use-toast";
import { QRGenerator as QRUtils } from "@/lib/qrGenerator";

export type KeyDto = {
  id: string;
  value: string;      // сам ключ
  createdAt: number;  // ms epoch
  ttl: number;        // ms
  qrPayload?: string; // строка для QR, если бэкенд вернёт
};

type SimResponse = {
  status: "OK" | "FAIL";
  ctr?: string | null;
  tag?: string | null;
};

type CardRecord = {
  cardId: string;
  owner?: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
  userRole?: string;
  keyVersion?: number;
  nextRotationAt?: string | null;
  qrCode?: string | null;
  lastCtr?: number | null;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.188:8080";

const KeyPage = () => {
  const [currentKey, setCurrentKey] = useState<KeyDto | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [ttlSeconds, setTtlSeconds] = useState<number>(3600); // 1 час по умолчанию
  const [userRole, setUserRole] = useState<string>("permanent");
  const [generateQr, setGenerateQr] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customTtl, setCustomTtl] = useState<string>("");
  const [isValidTtl, setIsValidTtl] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/list`, {
        headers: {
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        }
      });
      if (!res.ok) throw new Error(`list ${res.status}`);
      const data = (await res.json()) as CardRecord[];
      setCards(data.filter(card => card.active)); // Показываем только активные карты
    } catch (e) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось загрузить список пользователей", 
        variant: "destructive" 
      });
    } finally {
      setLoadingCards(false);
    }
  }, [toast]);

  // Загружаем список карт при монтировании компонента
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const createCard = async (owner: string, ttlSeconds: number, userRole: string, generateQr: boolean): Promise<{ cardId: string; owner: string; expiresAt: string; userRole: string; qrCode?: string }> => {
    const res = await fetch(`${API_BASE}/api/cards`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
        "X-Device-Type": "WebReader",
        "X-Client-Version": "1.0.0"
      },
      body: JSON.stringify({ owner, ttlSeconds, userRole, generateQr }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ошибка создания карты ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();
    if (data.status !== "OK") {
      throw new Error("Не удалось создать карту");
    }

    return data;
  };

  const requestNewKey = async (cardId: string, ttlSeconds: number): Promise<KeyDto> => {
    // Сначала получаем ctr/tag от эмулятора
    const simRes = await fetch(`${API_BASE}/api/sim/response/${encodeURIComponent(cardId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
        "X-Device-Type": "WebReader",
        "X-Client-Version": "1.0.0"
      },
    });

    if (!simRes.ok) {
      const text = await simRes.text().catch(() => "");
      throw new Error(`Ошибка эмулятора ${simRes.status}: ${text || simRes.statusText}`);
    }

    const simData = (await simRes.json()) as SimResponse;
    if (simData.status !== "OK" || !simData.ctr || !simData.tag) {
      throw new Error("Не удалось получить ctr/tag от эмулятора");
    }

    const now = Date.now();
    const mapped: KeyDto = {
      id: cardId,
      value: "",
      createdAt: now,
      ttl: ttlSeconds * 1000, // Конвертируем секунды в миллисекунды
      qrPayload: JSON.stringify({ cardId, ctr: simData.ctr, tag: simData.tag }),
    };
    return mapped;
  };

  const generateKey = async () => {
        if (!selectedCardId) {
          toast({
            title: "Ошибка",
            description: "Выберите пользователя",
            variant: "destructive",
          });
          return;
        }

        if (ttlSeconds < 60) {
          toast({
            title: "Ошибка",
            description: "Время действия должно быть не менее 60 секунд",
            variant: "destructive",
          });
          return;
        }

    setIsGenerating(true);

    try {
          // Создаем новую карту с выбранными параметрами
          const selectedCard = cards.find(c => c.cardId === selectedCardId);
          const cardData = await createCard(
            selectedCard?.owner || selectedCardId,
            ttlSeconds,
            userRole,
            generateQr
          );

          // Получаем ctr/tag для созданной карты
          const key = await requestNewKey(cardData.cardId, ttlSeconds);

      setCurrentKey(key);
          
          // Генерируем QR данные на фронтенде
          const qrData = QRUtils.generateDisplayQR(
            key.id,
            JSON.parse(key.qrPayload ?? '{}').ctr || 'generated',
            JSON.parse(key.qrPayload ?? '{}').tag || 'generated',
            cardData.owner,
            cardData.userRole
          );
          setQrData(qrData);

          // Обновляем список карт
          await fetchCards();

      toast({
            title: "QR сгенерирован",
            description: `Для пользователя: ${cardData.owner} (${cardData.userRole})`,
      });
        } catch (err: unknown) {
      console.error("Ошибка генерации ключа:", err);
      toast({
        title: "Ошибка",
            description: err instanceof Error ? err.message : "Не удалось создать ключ",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Валидация TTL
  const validateTtl = (value: string) => {
    const num = Number(value);
    const isValid = !isNaN(num) && num >= 60 && num <= 31536000; // от 1 минуты до 1 года
    setIsValidTtl(isValid);
    return isValid;
  };

  // Обработка изменения TTL
  const handleTtlChange = (value: string) => {
    setCustomTtl(value);
    if (value) {
      const num = Number(value);
      if (validateTtl(value)) {
        setTtlSeconds(num);
      }
    }
  };

  // Форматирование времени
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} сек`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} ч`;
    return `${Math.round(seconds / 86400)} дн`;
  };

        // Сброс формы
      const resetForm = () => {
        setSelectedCardId("");
        setTtlSeconds(3600);
        setUserRole("permanent");
        setGenerateQr(false);
        setCustomTtl("");
        setIsValidTtl(true);
        setCurrentKey(null);
        setQrData("");
      };

      // Копирование QR данных
      const copyQRData = async () => {
        try {
          await navigator.clipboard.writeText(qrData);
          toast({
            title: "Скопировано",
            description: "QR данные скопированы в буфер обмена",
          });
        } catch (err) {
          toast({
            title: "Ошибка",
            description: "Не удалось скопировать данные",
            variant: "destructive",
          });
        }
      };

      // Скачивание QR данных
      const downloadQRData = () => {
        const blob = new Blob([qrData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-data-${selectedCard?.owner || 'unknown'}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Скачано",
          description: "QR данные сохранены в файл",
        });
      };

  const selectedCard = cards.find(c => c.cardId === selectedCardId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 p-4 space-y-6">
      <Navigation />

      <div className="max-w-md mx-auto space-y-6">
        <Card className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 transition-all duration-200">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Генератор QR</h2>
              <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200">
                Создайте QR-код для проверки доступа
              </p>
            </div>
          </div>
        </Card>

        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="space-y-6">
            {/* Выбор пользователя */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Пользователь</span>
                {selectedCardId && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              <Select value={selectedCardId} onValueChange={setSelectedCardId} disabled={loadingCards}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder={loadingCards ? "Загрузка пользователей..." : "Выберите пользователя"} />
                </SelectTrigger>
                <SelectContent>
                  {cards.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Нет доступных пользователей</div>
                  ) : (
                    cards.map((card) => (
                      <SelectItem key={card.cardId} value={card.cardId}>
                        <div className="flex items-center gap-2">
                          <span>{card.owner || card.cardId}</span>
                          {card.userRole && (
                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full capitalize">
                              {card.userRole}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCard && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <strong>Выбран:</strong> {selectedCard.owner || selectedCard.cardId}
                  </div>
                </div>
              )}
            </div>

            {/* Время действия */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Время действия</span>
                <span className="text-xs text-slate-500">({formatDuration(ttlSeconds)})</span>
              </div>
              
              {/* Быстрый выбор времени */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 300, label: "5 мин" },
                  { value: 900, label: "15 мин" },
                  { value: 3600, label: "1 час" },
                  { value: 7200, label: "2 часа" },
                  { value: 86400, label: "1 день" },
                  { value: 604800, label: "7 дней" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={ttlSeconds === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTtlSeconds(option.value);
                      setCustomTtl("");
                    }}
                    className="h-8 text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Кастомное время */}
              <div className="space-y-2">
                <Label htmlFor="customTtl" className="text-xs text-slate-500">
                  Или введите в секундах (60-31536000):
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="customTtl"
                    type="number"
                    min="60"
                    max="31536000"
                    value={customTtl}
                    onChange={(e) => handleTtlChange(e.target.value)}
                    placeholder="Например: 1800"
                    className={`flex-1 ${!isValidTtl ? "border-red-500" : ""}`}
                  />
                  {customTtl && isValidTtl && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setTtlSeconds(Number(customTtl));
                        setCustomTtl("");
                      }}
                      className="px-3"
                    >
                      Применить
                    </Button>
                  )}
                </div>
                {!isValidTtl && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Введите значение от 60 до 31536000 секунд
                  </div>
                )}
              </div>
            </div>

            {/* Роль пользователя */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Роль пользователя</span>
              </div>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Администратор
                    </div>
                  </SelectItem>
                  <SelectItem value="permanent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Постоянный
                    </div>
                  </SelectItem>
                  <SelectItem value="temporary">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Временный
                    </div>
                  </SelectItem>
                  <SelectItem value="guest">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Гость
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные опции */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <QrCode className="w-4 h-4" />
                <span className="text-sm font-medium">Дополнительные опции</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="generateQr"
                    checked={generateQr}
                    onChange={(e) => setGenerateQr(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="generateQr" className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                    Сгенерировать QR-код для гостевого пропуска
                  </label>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-3 h-3 inline mr-1" />
                  Эта опция создаст дополнительный QR-код для гостевого доступа
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3">
            <Button
              onClick={generateKey}
                disabled={isGenerating || !selectedCardId || ttlSeconds < 60 || !isValidTtl}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-base font-semibold"
            >
              {isGenerating ? (
                <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Создать QR-код
                </>
              )}
            </Button>
              
              {currentKey && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="h-12 px-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Новый
                </Button>
              )}
            </div>

            {/* Информация о валидации */}
            {!selectedCardId && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Выберите пользователя для создания QR-кода
              </div>
            )}
          </div>
        </Card>

        {currentKey && (
          <>
                {/* QR-код */}
                <div>
            <QRGenerator
              data={qrData}
              title="QR-код ключа"
              onRefresh={generateKey}
              refreshDisabled={isGenerating}
            />
                </div>

                {/* Действия с QR-кодом */}
                <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-medium">Действия с QR-кодом</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={copyQRData}
                        variant="outline"
                        className="flex-1 h-10"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Копировать данные
                      </Button>
                      
                      <Button
                        onClick={downloadQRData}
                        variant="outline"
                        className="flex-1 h-10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать файл
                      </Button>
                    </div>

                    {/* Информация о QR-коде */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div><strong>Пользователь:</strong> {selectedCard?.owner || 'Неизвестно'}</div>
                        <div><strong>Роль:</strong> {userRole}</div>
                        <div><strong>Время действия:</strong> {formatDuration(ttlSeconds)}</div>
                        <div><strong>Сгенерирован:</strong> {new Date().toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Тестовые данные для сканирования */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                      <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <div><strong>Тестовые данные для сканирования:</strong></div>
                        <div className="font-mono text-xs break-all bg-white dark:bg-slate-800 p-2 rounded border">
                          {qrData}
                        </div>
                        <div className="text-blue-600 dark:text-blue-300">
                          Скопируйте эти данные и вставьте в поле ввода на странице считывателя для тестирования
                        </div>
                      </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default KeyPage;