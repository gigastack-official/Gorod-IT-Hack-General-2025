import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Smartphone,
  MapPin,
  AlertTriangle
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";
import { AuditService } from "@/services/auditService";
import { AccessHistory, AuditFilters } from "@/types/audit";

const AccessHistoryPage = () => {
  const [accessHistory, setAccessHistory] = useState<AccessHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({
    page: 0,
    size: 20,
    sortBy: 'accessTimestamp',
    sortDir: 'desc'
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [cards, setCards] = useState<Array<{cardId: string; owner: string}>>([]);
  const { toast } = useToast();

  // Загрузка списка карт для фильтрации
  const fetchCards = useCallback(async () => {
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined) ?? "https://backend.gigastack.v6.rocks/api"}/admin/list`);
      if (response.ok) {
        const data = await response.json();
        setCards(data.map((card: any) => ({ cardId: card.cardId, owner: card.owner })));
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  }, []);

  // Загрузка истории доступа
  const fetchAccessHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AuditService.getAccessHistory(filters);
      setAccessHistory(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error fetching access history:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю доступа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    fetchAccessHistory();
  }, [fetchAccessHistory]);

  // Обработка изменения фильтров
  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0 // Сбрасываем страницу при изменении фильтров
    }));
  };

  // Обработка пагинации
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Экспорт в CSV
  const handleExport = async () => {
    try {
      const blob = await AuditService.exportAccessHistory(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `access-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Экспорт завершен",
        description: "История доступа экспортирована в CSV файл",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  // Форматирование времени
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  // Форматирование времени ответа
  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${ms}мс`;
  };

  // Получение статуса доступа
  const getAccessStatus = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Успешно
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Отказано
      </Badge>
    );
  };

  // Получение типа доступа
  const getAccessType = (accessType: string) => {
    const typeMap: Record<string, string> = {
      'CARD_VERIFICATION': 'Верификация карты',
      'QR_SCAN': 'Сканирование QR',
      'ADMIN_ACCESS': 'Административный доступ'
    };
    return typeMap[accessType] || accessType;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4 space-y-6">
      <Navigation />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  История доступа
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Просмотр всех попыток доступа и сканирований
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchAccessHistory}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Фильтры */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Фильтры</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Карта */}
              <div className="space-y-2">
                <Label htmlFor="cardId">Карта</Label>
                <Select
                  value={filters.cardId || "all"}
                  onValueChange={(value) => handleFilterChange('cardId', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все карты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все карты</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.cardId} value={card.cardId}>
                        {card.owner} ({card.cardId.slice(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ридер */}
              <div className="space-y-2">
                <Label htmlFor="readerId">Ридер</Label>
                <Input
                  id="readerId"
                  placeholder="ID ридера"
                  value={filters.readerId || ""}
                  onChange={(e) => handleFilterChange('readerId', e.target.value || undefined)}
                />
              </div>

              {/* Успешность */}
              <div className="space-y-2">
                <Label htmlFor="success">Статус</Label>
                <Select
                  value={filters.success?.toString() || "all"}
                  onValueChange={(value) => handleFilterChange('success', value === "all" ? undefined : value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="true">Успешно</SelectItem>
                    <SelectItem value="false">Отказано</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Тип доступа */}
              <div className="space-y-2">
                <Label htmlFor="accessType">Тип доступа</Label>
                <Select
                  value={filters.accessType || "all"}
                  onValueChange={(value) => handleFilterChange('accessType', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="CARD_VERIFICATION">Верификация карты</SelectItem>
                    <SelectItem value="QR_SCAN">Сканирование QR</SelectItem>
                    <SelectItem value="ADMIN_ACCESS">Административный доступ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Временной диапазон */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Начальное время</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={filters.startTime ? new Date(filters.startTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => handleFilterChange('startTime', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Конечное время</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={filters.endTime ? new Date(filters.endTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => handleFilterChange('endTime', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Результаты */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Найдено записей: {totalElements}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-600 dark:text-slate-300">Загрузка...</span>
              </div>
            ) : accessHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>История доступа не найдена</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accessHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {getAccessStatus(record.success)}
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {getAccessType(record.accessType)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(record.accessTimestamp)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {record.owner || 'Неизвестно'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {record.readerId}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {formatResponseTime(record.responseTimeMs)}
                            </span>
                          </div>
                          
                          {record.ipAddress && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600 dark:text-slate-300">
                                {record.ipAddress}
                              </span>
                            </div>
                          )}
                        </div>

                        {record.failureReason && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-300">
                              {record.failureReason}
                            </span>
                          </div>
                        )}

                        {record.deviceInfo && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Устройство: {record.deviceInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 0}
                >
                  Назад
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Страница {filters.page! + 1} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page! >= totalPages - 1}
                >
                  Вперед
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccessHistoryPage;
