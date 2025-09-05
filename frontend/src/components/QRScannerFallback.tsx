import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw, AlertCircle } from "lucide-react";

// Динамический импорт qr-scanner для декодирования
let QrScanner: any = null;

interface QRScannerFallbackProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRScannerFallback = ({ onResult, onError, isActive }: QRScannerFallbackProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasPermission(true);
          setError(null);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setHasPermission(false);
        setError("Не удалось получить доступ к камере");
        onError?.("Не удалось получить доступ к камере");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, onError]);

  // Функция для сканирования QR кода из видео
  const scanQRFromVideo = async () => {
    if (!videoRef.current || !canvasRef.current || !QrScanner) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Устанавливаем размеры canvas как у видео
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Рисуем текущий кадр на canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Конвертируем canvas в blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          const result = await QrScanner.scanImage(blob);
          onResult(result);
          setIsScanning(false);
        } catch (error) {
          // QR код не найден, продолжаем сканирование
        }
      }, 'image/png');
    } catch (error) {
      console.error("QR scan error:", error);
    }
  };

  // Запускаем периодическое сканирование
  useEffect(() => {
    if (!isActive || !hasPermission) return;

    const initQRScanner = async () => {
      if (!QrScanner) {
        const QrScannerModule = await import("qr-scanner");
        QrScanner = QrScannerModule.default;
      }
    };

    initQRScanner();

    const interval = setInterval(() => {
      if (isScanning) {
        scanQRFromVideo();
      }
    }, 1000); // Сканируем каждую секунду

    return () => clearInterval(interval);
  }, [isActive, hasPermission, isScanning]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Динамический импорт qr-scanner
      if (!QrScanner) {
        const QrScannerModule = await import("qr-scanner");
        QrScanner = QrScannerModule.default;
      }

      // Декодируем QR код из изображения
      const result = await QrScanner.scanImage(file);
      onResult(result);
    } catch (error) {
      console.error("QR decode error:", error);
      onError?.("Не удалось декодировать QR-код из изображения");
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  if (!isActive) return null;

  if (hasPermission === false) {
    return (
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl">
        <div className="text-center space-y-4">
          <CameraOff className="w-12 h-12 mx-auto text-red-500" />
          <div>
            <h3 className="font-semibold text-red-600 dark:text-red-400">Нет доступа к камере</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Разрешите доступ к камере для сканирования QR-кодов
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Или загрузите изображение с QR-кодом:
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Сканер QR-кодов</span>
          </div>
          {hasPermission && (
            <div className="flex gap-2">
              {!isScanning ? (
                <Button
                  size="sm"
                  onClick={startScanning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Начать сканирование
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={stopScanning}
                  variant="destructive"
                >
                  Остановить
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="absolute inset-0 border-2 border-blue-500/50 rounded-lg">
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
          </div>
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-sm font-medium">
                Сканирование QR-кода...
              </div>
            </div>
          )}
        </div>
        
        {/* Скрытый canvas для обработки кадров */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            Наведите камеру на QR-код или загрузите изображение
          </p>
          <div className="text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QRScannerFallback;
