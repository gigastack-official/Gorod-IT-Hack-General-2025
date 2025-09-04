import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, RefreshCw } from "lucide-react";

interface QRGeneratorProps {
  data: string;
  title?: string;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
}

const QRGenerator = ({ data, title = "QR-код", onRefresh, refreshDisabled }: QRGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const generateQR = async () => {
      try {
        const canvas = canvasRef.current!;
        await QRCode.toCanvas(canvas, data, {
          width: 256,
          margin: 2,
          color: {
            dark: "#1e293b", // foreground color
            light: "#ffffff", // background color
          },
          errorCorrectionLevel: "M",
        });

        // Also generate data URL for download
        const dataUrl = await QRCode.toDataURL(data, {
          width: 256,
          margin: 2,
          color: {
            dark: "#1e293b",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error("QR generation error:", error);
      }
    };

    generateQR();
  }, [data]);

  const downloadQR = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="text-center space-y-4">
          <QrCode className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-muted-foreground">QR-код не создан</h3>
            <p className="text-sm text-muted-foreground">
              Нет данных для генерации QR-кода
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={refreshDisabled}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={downloadQR}
              disabled={!qrDataUrl}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-inner">
            <canvas
              ref={canvasRef}
              className="block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">Данные QR-кода:</div>
          <div className="p-2 bg-muted rounded text-xs font-mono break-all">
            {data.length > 100 ? `${data.substring(0, 100)}...` : data}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QRGenerator;