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

type CreateCardResponse = {
  status: "OK" | "FAIL";
  cardId: string;
  owner: string;
  expiresAt: string; // ISO date-time
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.56:8080";

const KeyPage = () => {
  const [currentKey, setCurrentKey] = useState<KeyDto | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const requestNewKey = async (): Promise<KeyDto> => {
    const res = await fetch(`${API_BASE}/api/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "Web", ttlSeconds: 86400 }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ошибка ${res.status}: ${text || res.statusText}`);
    }

    const data = (await res.json()) as CreateCardResponse;
    if (data.status !== "OK") {
      throw new Error("Бэкенд вернул статус FAIL");
    }

    const expiresAtMs = new Date(data.expiresAt).getTime();
    const now = Date.now();
    const ttlMs = Math.max(0, expiresAtMs - now);

    const mapped: KeyDto = {
      id: data.cardId,
      value: "",
      createdAt: now,
      ttl: ttlMs,
      qrPayload: JSON.stringify(data),
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
        title: "Ключ создан",
        description: "QR-код готов к использованию",
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
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />

      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            <Button
              onClick={generateKey}
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
                  Создать ключ
                </>
              )}
            </Button>
          </div>
        </Card>

        {currentKey && (
          <>
            <QRGenerator
              data={qrData}
              title="QR-код ключа"
              onRefresh={generateKey}
              refreshDisabled={isGenerating}
            />

            <Card className="p-4 bg-gradient-card shadow-card">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Детали ключа</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>ID:</strong> {currentKey.id}</div>
                  <div><strong>Ключ:</strong> {currentKey.value}</div>
                  <div><strong>Создан:</strong> {new Date(currentKey.createdAt).toLocaleString()}</div>
                  <div><strong>TTL:</strong> {Math.round(currentKey.ttl / 1000)} сек</div>
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