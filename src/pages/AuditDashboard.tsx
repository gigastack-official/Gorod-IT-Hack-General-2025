import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JSZip from "jszip";
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Activity
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";
import { AuditService } from "@/services/auditService";
import { AuditStatistics, AccessStatistics, EventCount, AccessCount } from "@/types/audit";

const AuditDashboardPage = () => {
  const [eventStats, setEventStats] = useState<AuditStatistics | null>(null);
  const [accessStats, setAccessStats] = useState<AccessStatistics | null>(null);
  const [eventCount, setEventCount] = useState<EventCount | null>(null);
  const [accessCount, setAccessCount] = useState<AccessCount | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Загрузка статистики
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [eventStatsData, accessStatsData] = await Promise.all([
        AuditService.getEventStatistics(),
        AuditService.getAccessStatistics()
      ]);
      
      setEventStats(eventStatsData);
      setAccessStats(accessStatsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка счетчиков за последние 24 часа
  const fetchCounts = async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      
      const [eventCountData, accessCountData] = await Promise.all([
        AuditService.getEventCount(start.toISOString(), end.toISOString()),
        AuditService.getAccessCount(start.toISOString(), end.toISOString())
      ]);
      
      setEventCount(eventCountData);
      setAccessCount(accessCountData);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchStatistics();
    fetchCounts();
  }, []);

  // Экспорт статистики
  const handleExport = async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Последние 30 дней
      
      const [eventsBlob, accessBlob] = await Promise.all([
        AuditService.exportEvents({ startTime: start.toISOString(), endTime: end.toISOString() }),
        AuditService.exportAccessHistory({ startTime: start.toISOString(), endTime: end.toISOString() })
      ]);
      
      // Создаем ZIP архив с двумя файлами
      const zip = new JSZip();
      zip.file('audit-events.csv', eventsBlob);
      zip.file('access-history.csv', accessBlob);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-dashboard-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Экспорт завершен",
        description: "Статистика экспортирована в ZIP архив",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  // Рендер статистики в виде карточек
  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200 hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')} dark:${color.replace('text-', 'bg-').replace('-600', '-900')}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  // Рендер графика статистики
  const renderStatChart = (title: string, data: string[][], color: string) => {
    const maxValue = Math.max(...data.map(d => parseInt(d[1])));
    
    return (
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">{item[0]}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${Math.min(100, (parseInt(item[1]) / maxValue) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 p-4 space-y-6">
      <Navigation />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Дашборд аудита
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Статистика и аналитика системы контроля доступа
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchStatistics}
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
                Экспорт
              </Button>
            </div>
          </div>
        </Card>

        {/* Основные метрики за 24 часа */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderStatCard(
            "Всего событий",
            eventCount?.totalEvents || 0,
            <Activity className="w-6 h-6 text-blue-600" />,
            "text-blue-600"
          )}
          {renderStatCard(
            "Успешных доступов",
            accessCount?.successfulAccess || 0,
            <CheckCircle className="w-6 h-6 text-green-600" />,
            "text-green-600"
          )}
          {renderStatCard(
            "Отказанных доступов",
            accessCount?.failedAccess || 0,
            <XCircle className="w-6 h-6 text-red-600" />,
            "text-red-600"
          )}
          {renderStatCard(
            "Созданных карт",
            eventCount?.cardCreated || 0,
            <Users className="w-6 h-6 text-purple-600" />,
            "text-purple-600"
          )}
        </div>

        {/* Статистика событий */}
        {eventStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderStatChart(
              "Типы событий",
              eventStats.eventTypes,
              "bg-blue-500"
            )}
            {renderStatChart(
              "Категории событий",
              eventStats.eventCategories,
              "bg-green-500"
            )}
          </div>
        )}

        {/* Статистика доступа */}
        {accessStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderStatChart(
              "Типы доступа",
              accessStats.accessTypes,
              "bg-purple-500"
            )}
            {renderStatChart(
              "Статистика по ридерам",
              accessStats.readerStats,
              "bg-orange-500"
            )}
          </div>
        )}

        {/* Дополнительная статистика */}
        {accessStats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderStatChart(
              "Статистика по картам",
              accessStats.cardStats,
              "bg-indigo-500"
            )}
            {renderStatChart(
              "Статистика успешности",
              accessStats.successStats,
              "bg-emerald-500"
            )}
            {renderStatChart(
              "Ежедневная статистика",
              accessStats.dailyStats,
              "bg-pink-500"
            )}
          </div>
        )}

        {/* Почасовая статистика */}
        {accessStats?.hourlyStats && accessStats.hourlyStats.length > 0 && (
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Почасовая активность
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(() => {
                const maxHourlyValue = Math.max(...accessStats.hourlyStats.map(h => parseInt(h[1])));
                return accessStats.hourlyStats.slice(0, 24).map((hour, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {index}:00
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-1">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${Math.min(100, (parseInt(hour[1]) / maxHourlyValue) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {hour[1]}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        )}

        {/* Информация о системе */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Информация о системе
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Версия API</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">v2.1.0</div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Последнее обновление</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {new Date().toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Статус системы</div>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Активна
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Мониторинг</div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                Включен
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuditDashboardPage;
