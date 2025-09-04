import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Send } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRScanner from "@/components/QRScanner";
import { useToast } from "@/hooks/use-toast";
import { successTone, failTone, infoTone } from "@/lib/audio";

type SimResponse = {
  status: "OK" | "FAIL";
  ctr?: string | null;
  tag?: string | null;
};

type StatusResponse = {
  status: "OK" | "FAIL";
};

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleQRResult = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    infoTone().catch(() => {});
    setIsScanning(false);
    
    try {
      // Expect QR payload with verification data: { cardId, ctr, tag }
      const parsed = JSON.parse(qrData) as { cardId?: string; ctr?: string; tag?: string } & Record<string, unknown>;
      const { cardId, ctr, tag } = parsed;
      if (!cardId || !ctr || !tag) {
        throw new Error("QR должен содержать cardId, ctr и tag");
      }

      // Verify on backend using values from QR
      const verifyRes = await fetch(`${API_BASE}/api/cards/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, ctr, tag }),
      });
      if (!verifyRes.ok) {
        const text = await verifyRes.text().catch(() => "");
        throw new Error(`Проверка вернула ${verifyRes.status}: ${text || verifyRes.statusText}`);
      }
      const status: StatusResponse = await verifyRes.json();

      const success = status.status === "OK";
      toast({
        title: success ? "Доступ разрешен" : "Доступ запрещен",
        description: success ? "Аутентификация успешна" : "Ошибка верификации",
        variant: success ? "default" : "destructive",
      });
      if (success) {
        successTone().catch(() => {});
      } else {
        failTone().catch(() => {});
      }
      
    } catch (error) {
      console.error('Challenge processing error:', error);
      toast({
        title: "Ошибка обработки",
        description: error instanceof Error ? error.message : "Не удалось обработать QR-код",
        variant: "destructive",
      });
      failTone().catch(() => {});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Ошибка сканирования",
      description: error,
      variant: "destructive",
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
              <h1 className="text-2xl font-bold">Ключ</h1>
              <p className="text-muted-foreground">Сканируйте QR для проверки</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            <Button
              onClick={() => setIsScanning(!isScanning)}
              disabled={isProcessing}
              className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
            >
              {isScanning ? "Остановить сканирование" : "Начать сканирование"}
            </Button>
            {isProcessing && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <Send className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    Обработка QR...
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <QRScanner
          isActive={isScanning}
          onResult={handleQRResult}
          onError={handleScanError}
        />
      </div>
    </div>
  );
};

export default CardPage;