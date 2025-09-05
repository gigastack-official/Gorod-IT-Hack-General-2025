import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Send } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRScanner from "@/components/QRScanner";
import { useToast } from "@/hooks/use-toast";

type SimResponse = {
  status: "OK" | "FAIL";
  ctr?: string | null;
  tag?: string | null;
};

type StatusResponse = {
  status: "OK" | "FAIL";
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.56:8080";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleQRResult = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
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
      
    } catch (error) {
      console.error('Challenge processing error:', error);
      toast({
        title: "Ошибка обработки",
        description: error instanceof Error ? error.message : "Не удалось обработать QR-код",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-md mx-auto space-y-6">
        <Card className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-200 group-hover:scale-110 group-hover:rotate-6">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Считыватель</h1>
              <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200">Сканируйте QR для проверки</p>
            </div>
            <Button
              onClick={() => setIsScanning(!isScanning)}
              disabled={isProcessing}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-lg font-semibold"
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Остановить сканирование
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5 mr-2" />
                  Начать сканирование
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
          <div className="space-y-6">
            {isProcessing && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                  <Send className="w-5 h-5 animate-bounce" />
                  <span className="font-medium animate-pulse">
                    Обработка QR...
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="transition-all duration-200 hover:scale-105">
          <QRScanner
            isActive={isScanning}
            onResult={handleQRResult}
            onError={handleScanError}
          />
        </div>
      </div>
    </div>
  );
};

export default CardPage;