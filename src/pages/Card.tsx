import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Send, Shield, CheckCircle } from "lucide-react";
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

type QrVerifyRequest = {
  qrCode: string;
};

type QrVerifyResponse = {
  status: "OK" | "FAIL";
  cardId?: string | null;
  message?: string | null;
  error?: string | null;
};

type AttestationChallenge = {
  challenge: string;
  readerId: string;
};

type AttestationVerifyRequest = {
  challenge: string;
  signature: string;
};

type AttestationResponse = {
  status: "OK" | "FAIL";
  readerId?: string | null;
  attestedAt?: string | null;
  error?: string | null;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.188:8080";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAttested, setIsAttested] = useState(false);
  const [readerId] = useState("READER-001");
  const { toast } = useToast();

  // Аттестация ридера
  const attestReader = async () => {
    try {
      // Получаем челлендж
      const challengeRes = await fetch(`${API_BASE}/api/attest/challenge/${encodeURIComponent(readerId)}`, {
        method: "POST",
        headers: {
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        }
      });

      if (!challengeRes.ok) {
        const text = await challengeRes.text().catch(() => "");
        throw new Error(`Ошибка получения челленджа ${challengeRes.status}: ${text}`);
      }

      const challengeData: AttestationChallenge = await challengeRes.json();
      
      // В реальном приложении здесь должна быть подпись устройства
      // Для демонстрации используем простую подпись
      const signature = `device-signature-${challengeData.challenge}`;

      // Верифицируем аттестацию
      const verifyRes = await fetch(`${API_BASE}/api/attest/verify/${encodeURIComponent(readerId)}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        },
        body: JSON.stringify({
          challenge: challengeData.challenge,
          signature: signature,
        } as AttestationVerifyRequest),
      });

      if (!verifyRes.ok) {
        const text = await verifyRes.text().catch(() => "");
        throw new Error(`Ошибка верификации аттестации ${verifyRes.status}: ${text}`);
      }

      const verifyData: AttestationResponse = await verifyRes.json();
      
      if (verifyData.status === "OK") {
        setIsAttested(true);
        toast({
          title: "Ридер аттестован",
          description: `Ридер ${readerId} успешно аттестован`,
        });
      } else {
        throw new Error(verifyData.error || "Ошибка аттестации");
      }
    } catch (error) {
      toast({
        title: "Ошибка аттестации",
        description: error instanceof Error ? error.message : "Не удалось аттестовать ридер",
        variant: "destructive",
      });
    }
  };

  const handleQRResult = async (qrData: string) => {
    if (isProcessing) return;
    
    // Проверяем аттестацию ридера
    if (!isAttested) {
      await attestReader();
      if (!isAttested) {
        toast({
          title: "Ридер не аттестован",
          description: "Не удалось аттестовать ридер",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      // Try to parse as JSON first (for cardId, ctr, tag format)
      let parsed;
      try {
        parsed = JSON.parse(qrData);
      } catch (parseError) {
        // If not JSON, treat as base64url encoded QR code
        const qrVerifyRes = await fetch(`${API_BASE}/api/qr/verify`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
            "X-Device-Type": "WebReader",
            "X-Client-Version": "1.0.0"
          },
          body: JSON.stringify({ qrCode: qrData }),
        });
        
        if (!qrVerifyRes.ok) {
          const text = await qrVerifyRes.text().catch(() => "");
          throw new Error(`QR верификация вернула ${qrVerifyRes.status}: ${text || qrVerifyRes.statusText}`);
        }
        
        const qrResult: QrVerifyResponse = await qrVerifyRes.json();
        const success = qrResult.status === "OK";
        
        toast({
          title: success ? "Доступ разрешен" : "Доступ запрещен",
          description: success ? (qrResult.message || "QR-код действителен") : (qrResult.error || "Ошибка верификации QR-кода"),
          variant: success ? "default" : "destructive",
        });
        
        return;
      }

      // Handle JSON format (cardId, ctr, tag)
      const { cardId, ctr, tag } = parsed as { cardId?: string; ctr?: string; tag?: string } & Record<string, unknown>;
      
      if (!cardId || !ctr || !tag) {
        throw new Error("QR должен содержать cardId, ctr и tag");
      }

      // Verify on backend using values from QR
      
      const verifyRes = await fetch(`${API_BASE}/api/cards/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Reader-Id": readerId, // Required header for reader attestation
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        },
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
      
      <div className="max-w-md mx-auto space-y-6 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <Card className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-200 group-hover:scale-110 group-hover:rotate-6">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Считыватель</h1>
              <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200">Сканируйте QR для проверки</p>
            </div>
            <div className="space-y-3">
              {/* Статус аттестации */}
              <div className={`p-3 rounded-lg border ${
                isAttested 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50" 
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  {isAttested ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Shield className="w-4 h-4 text-amber-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    isAttested ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"
                  }`}>
                    {isAttested ? "Ридер аттестован" : "Ридер не аттестован"}
                  </span>
                </div>
                <div className={`text-xs mt-1 ${
                  isAttested ? "text-green-600 dark:text-green-300" : "text-amber-600 dark:text-amber-300"
                }`}>
                  ID: {readerId}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isAttested ? (
                  <Button
                    onClick={attestReader}
                    className="w-full sm:flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
                  >
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Аттестовать ридер
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    disabled={isProcessing}
                    className="w-full sm:flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Остановить сканирование
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Начать сканирование
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
        {isProcessing && (
          <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <Send className="w-5 h-5 animate-bounce" />
                <span className="font-medium animate-pulse">
                  Обработка QR...
                </span>
              </div>
            </div>
          </Card>
        )}

                    <div className="transition-all duration-200 hover:scale-105 w-full">
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