import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JSZip from "jszip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock, 
  MapPin, 
  User,
  Smartphone,
  RefreshCw,
  Download,
  Ban,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";
import { AuditService } from "@/services/auditService";
import { AuditEvent, FrequentFailure, SuspiciousIP } from "@/types/audit";

const SecurityMonitoringPage = () => {
  const [suspiciousActivity, setSuspiciousActivity] = useState<AuditEvent[]>([]);
  const [frequentFailures, setFrequentFailures] = useState<FrequentFailure[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [responseTimes, setResponseTimes] = useState<Array<{readerId: string; averageResponseTimeMs: number; requestCount: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [maxFailures, setMaxFailures] = useState(5);
  const { toast } = useToast();

  // Загрузка данных мониторинга
  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      console.log('Fetching security data with maxFailures:', maxFailures);
      
      const [suspiciousData, failuresData, ipsData, responseData] = await Promise.all([
        AuditService.findSuspiciousActivity(maxFailures),
        AuditService.findFrequentFailures(maxFailures),
        AuditService.findSuspiciousIPs(maxFailures),
        AuditService.getAverageResponseTimeByReader()
      ]);
      
      console.log('Security data received:', {
        suspiciousActivity: suspiciousData,
        frequentFailures: failuresData,
        suspiciousIPs: ipsData,
        responseTimes: responseData
      });
      
      setSuspiciousActivity(suspiciousData);
      setFrequentFailures(failuresData);
      setSuspiciousIPs(ipsData);
      setResponseTimes(responseData);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные мониторинга",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchSecurityData();
  }, [maxFailures]);


  // Экспорт данных безопасности
  const handleExport = async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Последние 7 дней
      
      const [eventsBlob, accessBlob] = await Promise.all([
        AuditService.exportEvents({ 
          startTime: start.toISOString(), 
          endTime: end.toISOString(),
          success: false // Только неудачные попытки
        }),
        AuditService.exportAccessHistory({ 
          startTime: start.toISOString(), 
          endTime: end.toISOString(),
          success: false
        })
      ]);
      
      // Создаем ZIP архив
      const zip = new JSZip();
      zip.file('security-events.csv', eventsBlob);
      zip.file('security-access-history.csv', accessBlob);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-monitoring-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Экспорт завершен",
        description: "Данные безопасности экспортированы в ZIP архив",
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
    if (!dateString) return 'Неизвестно';
    try {
      return new Date(dateString).toLocaleString('ru-RU');
    } catch (error) {
      return 'Неверная дата';
    }
  };

  // Получение уровня угрозы
  const getThreatLevel = (failureCount: number) => {
    const count = failureCount || 0;
    if (count >= 10) return { level: "Критический", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (count >= 5) return { level: "Высокий", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" };
    if (count >= 3) return { level: "Средний", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { level: "Низкий", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-900 dark:to-orange-900 p-4 space-y-6">
      <Navigation />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Мониторинг безопасности
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Обнаружение подозрительной активности и угроз безопасности
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="maxFailures" className="text-sm text-slate-600 dark:text-slate-300">
                  Порог неудач:
                </Label>
                <Input
                  id="maxFailures"
                  type="number"
                  min="1"
                  max="20"
                  value={maxFailures}
                  onChange={(e) => setMaxFailures(parseInt(e.target.value) || 5)}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchSecurityData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Подозрительная активность */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Подозрительная активность
            </h2>
            <Badge variant="destructive" className="ml-2">
              {suspiciousActivity.length} событий
            </Badge>
          </div>
          
          {suspiciousActivity.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">Нет подозрительной активности</p>
              <p className="text-sm">Система не обнаружила подозрительных событий за текущий период.</p>
              <p className="text-xs mt-2 text-slate-400">
                Попробуйте уменьшить порог неудач или создайте тестовые события.
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
              <span className="ml-2 text-slate-600 dark:text-slate-300">Загрузка...</span>
            </div>
          ) : suspiciousActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Подозрительная активность не обнаружена</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousActivity.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-red-200 dark:border-red-700/50 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          {event.eventType}
                        </Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {formatDateTime(event.eventTimestamp)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {event.cardId && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Карта: {event.cardId.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                        
                        {event.readerId && (
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Ридер: {event.readerId}
                            </span>
                          </div>
                        )}
                        
                        {event.ipAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              IP: {event.ipAddress}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {event.eventCategory}
                          </span>
                        </div>
                      </div>

                      {event.message && (
                        <div className="text-sm text-red-700 dark:text-red-300">
                          <strong>Сообщение:</strong> {event.message}
                        </div>
                      )}

                      {event.errorCode && (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          <strong>Код ошибки:</strong> {event.errorCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Частые неудачные попытки */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Частые неудачные попытки
            </h2>
            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
              {frequentFailures.length} карт
            </Badge>
          </div>
          
          {frequentFailures.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Частые неудачи не обнаружены</p>
            </div>
          ) : (
            <div className="space-y-3">
              {frequentFailures.map((failure, index) => {
                const threat = getThreatLevel(failure.failureCount);
                return (
                  <div
                    key={index}
                    className="p-4 border border-orange-200 dark:border-orange-700/50 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={threat.color}>
                            {threat.level}
                          </Badge>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Карта: {failure.cardId ? failure.cardId.slice(0, 8) + '...' : 'Неизвестно'}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {failure.failureCount || 0} неудач
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          <strong>Последняя неудача:</strong> {failure.lastFailure ? formatDateTime(failure.lastFailure) : 'Неизвестно'}
                        </div>
                        
                        {failure.failureReasons && failure.failureReasons.length > 0 && (
                          <div className="text-sm text-orange-700 dark:text-orange-300">
                            <strong>Причины:</strong> {failure.failureReasons.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Подозрительные IP адреса */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Подозрительные IP адреса
            </h2>
            <Badge variant="outline" className="ml-2 text-purple-600 border-purple-600">
              {suspiciousIPs.length} адресов
            </Badge>
          </div>
          
          {suspiciousIPs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Подозрительные IP адреса не обнаружены</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousIPs.map((ip, index) => {
                const threat = getThreatLevel(ip.failureCount);
                return (
                  <div
                    key={index}
                    className="p-4 border border-purple-200 dark:border-purple-700/50 rounded-lg bg-purple-50 dark:bg-purple-900/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={threat.color}>
                            {threat.level}
                          </Badge>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            IP: {ip.ipAddress || 'Неизвестно'}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {ip.failureCount || 0} неудач
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          <strong>Последняя неудача:</strong> {ip.lastFailure ? formatDateTime(ip.lastFailure) : 'Неизвестно'}
                        </div>
                        
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                          <strong>Затронутые карты:</strong> {ip.affectedCards ? ip.affectedCards.length : 0} карт
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Время ответа ридеров */}
        {responseTimes && responseTimes.length > 0 && (
          <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Время ответа ридеров
              </h2>
            </div>
            
            <div className="space-y-3">
              {responseTimes.map((reader, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {reader.readerId}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium">{reader.averageResponseTimeMs}мс</span>
                      <span className="ml-2">({reader.requestCount} запросов)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SecurityMonitoringPage;
