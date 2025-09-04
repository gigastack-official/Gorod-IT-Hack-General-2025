import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Camera, Key, CheckCircle2, AlertCircle } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(true);
  const [lastChallenge, setLastChallenge] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScanChallenge = async () => {
    setIsScanning(true);
    
    // Simulate QR scanning
    setTimeout(() => {
      const challengeId = `ch_${Date.now()}`;
      setLastChallenge(challengeId);
      setIsScanning(false);
      
      // Simulate signing challenge
      setTimeout(() => {
        toast({
          title: "Челлендж подписан",
          description: "Подпись отправлена на сервер",
        });
      }, 1000);
    }, 2000);
  };

  const generateKeyPair = async () => {
    // Mock key generation
    setHasPrivateKey(true);
    toast({
      title: "Ключи сгенерированы",
      description: "Приватный ключ сохранен локально",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Карта доступа</h1>
              <p className="text-muted-foreground">Цифровая карта безопасности</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <span className="font-medium">Статус ключа</span>
              </div>
              <Badge variant={hasPrivateKey ? "default" : "destructive"}>
                {hasPrivateKey ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {hasPrivateKey ? "Активен" : "Отсутствует"}
              </Badge>
            </div>

            {!hasPrivateKey && (
              <Button 
                onClick={generateKeyPair}
                className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                Генерировать ключи
              </Button>
            )}
          </div>
        </Card>

        {hasPrivateKey && (
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="space-y-4">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Сканирование QR</h3>
                <p className="text-sm text-muted-foreground">
                  Отсканируйте QR-код считывателя
                </p>
              </div>

              <Button
                onClick={handleScanChallenge}
                disabled={isScanning}
                className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                {isScanning ? "Сканирование..." : "Сканировать челлендж"}
              </Button>

              {lastChallenge && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Последний челлендж: {lastChallenge}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CardPage;