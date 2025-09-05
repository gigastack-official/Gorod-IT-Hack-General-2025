import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRGenerator from "@/components/QRGenerator";
import { useToast } from "@/hooks/use-toast";

export type KeyDto = {
  id: string;
  value: string;      // сам ключ
  createdAt: number;  // ms epoch
  ttl: number;        // ms
  qrPayload?: string; // строка для QR, если бэкенд вернёт
};

type SimResponse = {
  status: "OK" | "FAIL";
  ctr?: string | null;
  tag?: string | null;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.56:8080";
const FIXED_CARD_ID = "Vzb3KEtkgIngNybRe6FKVg";

const KeyPage = () => {
  const [currentKey, setCurrentKey] = useState<KeyDto | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const requestNewKey = async (): Promise<KeyDto> => {
    const res = await fetch(`${API_BASE}/api/sim/response/${encodeURIComponent(FIXED_CARD_ID)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ошибка ${res.status}: ${text || res.statusText}`);
    }

    const data = (await res.json()) as SimResponse;
    if (data.status !== "OK" || !data.ctr || !data.tag) {
      throw new Error("Не удалось получить ctr/tag от эмулятора");
    }

    const now = Date.now();
    const mapped: KeyDto = {
      id: FIXED_CARD_ID,
      value: "",
      createdAt: now,
      ttl: 0,
      qrPayload: JSON.stringify({ cardId: FIXED_CARD_ID, ctr: data.ctr, tag: data.tag }),
    };
    return mapped;
  };

  const generateKey = async () => {
    setIsGenerating(true);

    try {
      const key = await requestNewKey();

      setCurrentKey(key);
      setQrData(key.qrPayload ?? JSON.stringify(key));

      toast({
        title: "QR сгенерирован",
        description: "Данные получены от эмулятора",
      });
    } catch (err: any) {
      console.error("Ошибка генерации ключа:", err);
      toast({
        title: "Ошибка",
        description: err?.message ?? "Не удалось создать ключ",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 p-4 space-y-6">
      <Navigation />

      <div className="max-w-md mx-auto space-y-6">
        <Card className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Генератор QR</h2>
              <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200">
                Создайте QR-код для проверки доступа
              </p>
            </div>
            <Button
              onClick={generateKey}
              disabled={isGenerating}
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-lg font-semibold"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Создать ключ
                </>
              )}
            </Button>
          </div>
        </Card>

        {currentKey && (
          <>
            <div className="transition-all duration-200 hover:scale-105">
              <QRGenerator
                data={qrData}
                title="QR-код ключа"
                onRefresh={generateKey}
                refreshDisabled={isGenerating}
              />
            </div>

            <Card className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Детали ключа</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200">ID</div>
                    <div className="text-xs text-purple-600 dark:text-purple-300 font-mono">{currentKey.id}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Создан</div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">{new Date(currentKey.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">TTL</div>
                    <div className="text-xs text-green-600 dark:text-green-300">{Math.round(currentKey.ttl / 1000)} сек</div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default KeyPage;