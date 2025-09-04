import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import Navigation from "@/components/layout/Navigation";

interface AccessEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  readerId: string;
  status: 'granted' | 'denied';
  reason?: string;
  challengeId: string;
}

const EventsPage = () => {
  const [events] = useState<AccessEvent[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      userId: "user_001",
      userName: "Иван Петров",
      readerId: "reader_001",
      status: "granted",
      challengeId: "ch_001"
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      userId: "user_002",
      userName: "Мария Сидорова",
      readerId: "reader_001",
      status: "granted",
      challengeId: "ch_002"
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 32),
      userId: "unknown",
      userName: "Неизвестный",
      readerId: "reader_001",
      status: "denied",
      reason: "Неверная подпись",
      challengeId: "ch_003"
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      userId: "user_001",
      userName: "Иван Петров",
      readerId: "reader_002",
      status: "denied",
      reason: "Ключ истек",
      challengeId: "ch_004"
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      userId: "user_003",
      userName: "Алексей Иванов",
      readerId: "reader_001",
      status: "granted",
      challengeId: "ch_005"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'granted' | 'denied'>('all');

  const filteredEvents = events.filter(event => 
    filterStatus === 'all' || event.status === filterStatus
  );

  const getStatusIcon = (status: string) => {
    return status === 'granted' ? CheckCircle2 : XCircle;
  };

  const getStatusColor = (status: string) => {
    return status === 'granted' ? 'success' : 'destructive';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Журнал событий</h1>
                <p className="text-muted-foreground">
                  Всего событий: {events.length} | Успешных: {events.filter(e => e.status === 'granted').length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                >
                  Все
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'granted' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('granted')}
                >
                  Разрешено
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'denied' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('denied')}
                >
                  Отказано
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const StatusIcon = getStatusIcon(event.status);
              const statusColor = getStatusColor(event.status);
              
              return (
                <div key={event.id} className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-${statusColor}/10 rounded-full flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 text-${statusColor}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.userName}</span>
                          <Badge variant={statusColor === 'success' ? 'default' : 'destructive'}>
                            {event.status === 'granted' ? 'Разрешен' : 'Отказан'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Считыватель: {event.readerId} • Челлендж: {event.challengeId}
                        </div>
                        {event.reason && (
                          <div className="text-sm text-destructive">
                            Причина: {event.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeAgo(event.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventsPage;