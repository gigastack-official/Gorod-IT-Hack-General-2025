import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRGenerator from "@/components/QRGenerator";
import { useToast } from "@/hooks/use-toast";
import { successTone, failTone, infoTone } from "@/lib/audio";

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

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
type CreateCardResponse = {
  status: "OK" | "FAIL";
  cardId: string;
  owner: string;
  expiresAt: string;
};

const KeyPage = () => {
  const [currentKey, setCurrentKey] = useState<KeyDto | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const createCard = async (): Promise<CreateCardResponse> => {
    const res = await fetch(`${API_BASE}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "Demo", ttlSeconds: 86400 }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ошибка ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as CreateCardResponse;
  };

  const requestNewKey = async (): Promise<KeyDto> => {
    // 1) Создаём карту (персонализация)
    const created = await createCard();
    const cardId = created.cardId;

    // 2) Запрашиваем ctr/tag от эмулятора для этой карты
    const res = await fetch(`${API_BASE}/sim/response/${encodeURIComponent(cardId)}`, {
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
      id: cardId,
      value: "",
      createdAt: now,
      ttl: 0,
      qrPayload: JSON.stringify({ cardId, ctr: data.ctr, tag: data.tag }),
    };
    return mapped;
  };

  const generateKey = async () => {
    setIsGenerating(true);

    try {
      infoTone().catch(() => {});
      const key = await requestNewKey();

      setCurrentKey(key);
      setQrData(key.qrPayload ?? JSON.stringify(key));

      toast({
        title: "QR сгенерирован",
        description: "Данные получены от эмулятора",
      });
      successTone().catch(() => {});
    } catch (err: any) {
      console.error("Ошибка генерации ключа:", err);
      toast({
        title: "Ошибка",
        description: err?.message ?? "Не удалось создать ключ",
        variant: "destructive",
      });
      failTone().catch(() => {});
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