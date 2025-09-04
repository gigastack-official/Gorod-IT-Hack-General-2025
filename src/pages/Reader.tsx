import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, QrCode, Shield, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRGenerator from "@/components/QRGenerator";
import { useToast } from "@/hooks/use-toast";
import { createChallenge, type Challenge } from "@/lib/crypto";

const ReaderPage = () => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [accessStatus, setAccessStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [readerId] = useState("reader_001");
  const [challengeTimeout, setChallengeTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const generateChallenge = async () => {
    setIsGenerating(true);
    setAccessStatus('idle');
    
    // Clear existing timeout
    if (challengeTimeout) {
      clearTimeout(challengeTimeout);
    }
    
    try {
      // Create new challenge
      const challenge = createChallenge(readerId, 300000); // 5 minutes TTL
      
      // Generate QR data
      const qrPayload = JSON.stringify(challenge);
      
      setCurrentChallenge(challenge);
      setQrData(qrPayload);
      setIsGenerating(false);
      
      toast({
        title: "Челлендж создан",
        description: "QR-код готов к сканированию",
      });

      // Auto-expire challenge after TTL
      const timeout = setTimeout(() => {
        if (accessStatus === 'idle') {
          setAccessStatus('denied');
          toast({
            title: "Челлендж истек",
            description: "Время ожидания ответа истекло",
            variant: "destructive",
          });
        }
      }, challenge.ttl);
      
      setChallengeTimeout(timeout);
      
      // Simulate successful response after random delay (for demo)
      const demoResponseDelay = 8000 + Math.random() * 10000; // 8-18 seconds
      setTimeout(() => {
        if (accessStatus === 'idle') {
          const granted = Math.random() > 0.2; // 80% success rate for demo
          setAccessStatus(granted ? 'granted' : 'denied');
          
          toast({
            title: granted ? "Доступ разрешен" : "Доступ запрещен", 
            description: granted ? "Аутентификация успешна" : "Неверная подпись",
            variant: granted ? "default" : "destructive",
          });
        }
      }, demoResponseDelay);
      
    } catch (error) {
      console.error('Challenge generation error:', error);
      setIsGenerating(false);
      toast({
        title: "Ошибка создания челленджа",
        description: "Не удалось создать новый челлендж",
        variant: "destructive",
      });
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (challengeTimeout) {
        clearTimeout(challengeTimeout);
      }
    };
  }, [challengeTimeout]);

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
          <>
            <QRGenerator
              data={qrData}
              title="QR-код челленджа"
              onRefresh={generateChallenge}
              refreshDisabled={isGenerating}
            />
            
            <Card className="p-4 bg-gradient-card shadow-card">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Детали челленджа</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>ID:</strong> {currentChallenge.id}</div>
                  <div><strong>Nonce:</strong> {currentChallenge.nonce}</div>
                  <div><strong>Считыватель:</strong> {currentChallenge.readerId}</div>
                  <div><strong>Создан:</strong> {new Date(currentChallenge.timestamp).toLocaleString()}</div>
                  <div><strong>TTL:</strong> {Math.round(currentChallenge.ttl / 1000)} сек</div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ReaderPage;