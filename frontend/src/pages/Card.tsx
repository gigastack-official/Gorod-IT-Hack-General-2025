import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Send, Shield, CheckCircle, Keyboard } from "lucide-react";
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

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://gigastack.v6.rocks/api";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAttested, setIsAttested] = useState(false);
  const [readerId] = useState("READER-001");
  const [testInput, setTestInput] = useState("");
  const { toast } = useToast();

  // Аттестация ридера
  const attestReader = async () => {
    try {
      console.log("Starting reader attestation for:", readerId);
      console.log("Attestation challenge URL:", `${API_BASE}/attest/challenge/${encodeURIComponent(readerId)}`);
      
      // Получаем челлендж
      const challengeRes = await fetch(`${API_BASE}/attest/challenge/${encodeURIComponent(readerId)}`, {
        method: "POST",
        headers: {
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        }
      });

      console.log("Challenge response status:", challengeRes.status);

      if (!challengeRes.ok) {
        const text = await challengeRes.text().catch(() => "");
        console.error("Challenge error response:", text);
        throw new Error(`Ошибка получения челленджа ${challengeRes.status}: ${text}`);
      }

      const challengeData: AttestationChallenge = await challengeRes.json();
      console.log("Challenge data:", challengeData);
      
      // В реальном приложении здесь должна быть подпись устройства
      // Для демонстрации используем простую подпись
      const signature = `device-signature-${challengeData.challenge}`;

      // Верифицируем аттестацию
      const verifyRes = await fetch(`${API_BASE}/attest/verify/${encodeURIComponent(readerId)}`, {
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

      console.log("Verify attestation response status:", verifyRes.status);

      if (!verifyRes.ok) {
        const text = await verifyRes.text().catch(() => "");
        console.error("Attestation verify error response:", text);
        throw new Error(`Ошибка верификации аттестации ${verifyRes.status}: ${text}`);
      }

      const verifyData: AttestationResponse = await verifyRes.json();
      console.log("Attestation verify data:", verifyData);
      
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
      console.error("Ошибка аттестации:", error);
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
      console.log("Reader not attested, attempting attestation first...");
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
      console.log("QR Data received:", qrData);
      
      // Try to parse as JSON first (for cardId, ctr, tag format)
      let parsed;
      try {
        parsed = JSON.parse(qrData);
        console.log("Parsed QR data as JSON:", parsed);
      } catch (parseError) {
        console.log("Failed to parse as JSON, trying as base64url QR code:", parseError);
        // If not JSON, treat as base64url encoded QR code
        const qrVerifyRes = await fetch(`${API_BASE}/qr/verify`, {
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
      console.log("Extracted data:", { cardId, ctr, tag });
      console.log("Full parsed data:", parsed);
      
      if (!cardId || !ctr || !tag) {
        throw new Error("QR должен содержать cardId, ctr и tag");
      }

      // Verify on backend using values from QR
      console.log("Verifying card:", { cardId, ctr, tag, readerId });
      console.log("API URL:", `${API_BASE}/cards/verify`);
      
      const verifyRes = await fetch(`${API_BASE}/cards/verify`, {
        method: "POST",
        mode: 'cors',
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
          "X-Reader-Id": readerId, // Required header for reader attestation
          "User-Agent": "CryptoKeyGate-Frontend/1.0.0",
          "X-Device-Type": "WebReader",
          "X-Client-Version": "1.0.0"
        },
        body: JSON.stringify({ cardId, ctr, tag }),
      });
      
      console.log("Verify response status:", verifyRes.status);
      console.log("Verify response headers:", Object.fromEntries(verifyRes.headers.entries()));
      
      if (!verifyRes.ok) {
        const text = await verifyRes.text().catch(() => "");
        console.error("Verify error response:", text);
        console.error("Error status:", verifyRes.status);
        console.error("Error statusText:", verifyRes.statusText);
        throw new Error(`Проверка вернула ${verifyRes.status}: ${text || verifyRes.statusText}`);
      }
      const status: StatusResponse = await verifyRes.json();
      console.log("Verify response:", status);

      const success = status.status === "OK";
      toast({
        title: success ? "Доступ разрешен" : "Доступ запрещен",
        description: success ? "Аутентификация успешна" : "Ошибка верификации",
        variant: success ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error('Challenge processing error:', error);
      
      // Проверяем тип ошибки
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - request may not have reached backend');
        toast({
          title: "Ошибка сети",
          description: "Запрос не дошел до сервера. Проверьте подключение к интернету.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message.includes('CORS')) {
        console.error('CORS error - backend may not allow this request');
        toast({
          title: "Ошибка CORS",
          description: "Сервер не разрешает этот запрос. Проверьте настройки CORS.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка обработки",
          description: error instanceof Error ? error.message : "Не удалось обработать QR-код",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error("QR Scan Error:", error);
    toast({
      title: "Ошибка сканирования",
      description: error,
      variant: "destructive",
    });
    
    // If camera permission error, suggest manual input
    if (error.includes("доступ") || error.includes("камера")) {
      setTimeout(() => {
        toast({
          title: "Альтернативный способ",
          description: "Используйте поле 'Тестовый ввод' для ручного ввода QR-кода",
          variant: "default",
        });
      }, 2000);
    }
  };

  const handleTestInput = () => {
    if (testInput.trim()) {
      handleQRResult(testInput.trim());
      setTestInput("");
    }
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
              <div className="flex gap-3">
                {!isAttested ? (
                  <Button
                    onClick={attestReader}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Аттестовать ридер
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    disabled={isProcessing}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
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
                    {/* Тестовый ввод */}
                    <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl transition-all duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Keyboard className="w-4 h-4" />
                          <span className="text-sm font-medium">Тестовый ввод</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="testInput">Введите QR данные вручную:</Label>
                            <div className="flex gap-2">
                              <Input
                                id="testInput"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                placeholder="Вставьте QR данные здесь..."
                                className="flex-1"
                              />
                              <Button
                                onClick={handleTestInput}
                                disabled={!testInput.trim() || isProcessing}
                                className="px-4"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Проверить
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setTestInput('{"cardId":"invalid-card-id","ctr":"invalid-ctr","tag":"invalid-tag"}')}
                              >
                                Тестовые данные (ошибка)
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setTestInput('{"cardId":"test-card-123","ctr":"test-ctr-456","tag":"test-tag-789"}')}
                              >
                                Тестовые данные (успех)
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setTestInput('')}
                              >
                                Очистить
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Скопируйте данные из генератора QR-кодов и вставьте сюда для тестирования
                          </div>
                        </div>
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