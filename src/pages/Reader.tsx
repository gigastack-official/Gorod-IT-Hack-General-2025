import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, QrCode, Shield, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  nonce: string;
  timestamp: number;
  readerId: string;
  qrData: string;
}

const ReaderPage = () => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [accessStatus, setAccessStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateChallenge = async () => {
    setIsGenerating(true);
    setAccessStatus('idle');
    
    // Simulate challenge generation
    setTimeout(() => {
      const challenge: Challenge = {
        id: `ch_${Date.now()}`,
        nonce: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        readerId: "reader_001",
        qrData: `{"challengeId":"ch_${Date.now()}","nonce":"${Math.random().toString(36).substring(2, 15)}","timestamp":${Date.now()},"readerId":"reader_001"}`
      };
      
      setCurrentChallenge(challenge);
      setIsGenerating(false);
      
      toast({
        title: "Челлендж создан",
        description: "QR-код готов к сканированию",
      });

      // Simulate response after 5 seconds
      setTimeout(() => {
        const granted = Math.random() > 0.3; // 70% success rate
        setAccessStatus(granted ? 'granted' : 'denied');
        
        toast({
          title: granted ? "Доступ разрешен" : "Доступ запрещен",
          description: granted ? "Аутентификация успешна" : "Неверная подпись",
          variant: granted ? "default" : "destructive",
        });
      }, 5000);
    }, 1500);
  };

  useEffect(() => {
    // Auto-generate initial challenge
    generateChallenge();
  }, []);

  const getStatusColor = () => {
    switch (accessStatus) {
      case 'granted': return 'success';
      case 'denied': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (accessStatus) {
      case 'granted': return CheckCircle2;
      case 'denied': return XCircle;
      default: return Shield;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Monitor className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Считыватель</h1>
              <p className="text-muted-foreground">ID: reader_001</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const StatusIcon = getStatusIcon();
                  return <StatusIcon className={`w-5 h-5 text-${getStatusColor()}`} />;
                })()}
                <span className="font-medium">Статус доступа</span>
              </div>
              <Badge variant={getStatusColor() === 'success' ? 'default' : 'destructive'}>
                {accessStatus === 'idle' ? 'Ожидание' : 
                 accessStatus === 'granted' ? 'Разрешен' : 'Запрещен'}
              </Badge>
            </div>

            <Button
              onClick={generateChallenge}
              disabled={isGenerating}
              className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Новый челлендж
                </>
              )}
            </Button>
          </div>
        </Card>

        {currentChallenge && (
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="space-y-4">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="font-semibold mb-2">QR-код челленджа</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 ${
                          Math.random() > 0.5 ? 'bg-foreground' : 'bg-background'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>ID:</strong> {currentChallenge.id}</div>
                <div><strong>Nonce:</strong> {currentChallenge.nonce}</div>
                <div><strong>Время:</strong> {new Date(currentChallenge.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReaderPage;