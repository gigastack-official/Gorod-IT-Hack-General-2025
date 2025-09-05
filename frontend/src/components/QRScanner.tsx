import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw } from "lucide-react";
import QrScanner from "qr-scanner";

interface QRScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRScanner = ({ onResult, onError, isActive }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const restartScanner = async () => {
    if (retryCount >= 3) {
      setHasPermission(false);
      onError?.("Не удалось запустить камеру после нескольких попыток");
      return;
    }

    try {
      // Clean up existing scanner
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error("Камера не найдена");
      }

      // Get available cameras
      const availableCameras = await QrScanner.listCameras(true);
      setCameras(availableCameras);
      
      if (availableCameras.length > 0) {
        setCurrentCamera(availableCameras[0].id);
      }

      // Create scanner with better error handling
      const scanner = new QrScanner(
        videoRef.current!,
        (result) => {
          onResult(result.data);
          setRetryCount(0); // Reset retry count on successful scan
        },
        {
          onDecodeError: (error) => {
            console.log("QR decode error:", error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
          maxScansPerSecond: 5, // Limit scan rate
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
      setHasPermission(true);
      setIsScanning(true);
      setRetryCount(0);
    } catch (error) {
      console.error("Scanner restart error:", error);
      setRetryCount(prev => prev + 1);
      
      // Retry after delay
      retryTimeoutRef.current = setTimeout(() => {
        restartScanner();
      }, 2000);
    }
  };

  useEffect(() => {
    if (!videoRef.current || !isActive) {
      setIsScanning(false);
      return;
    }

    restartScanner();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [isActive, onResult, onError]);

  // Monitor scanner state and restart if needed
  useEffect(() => {
    if (!isActive || !scannerRef.current) return;

    const checkScanner = () => {
      if (scannerRef.current && !isScanning) {
        console.log("Scanner stopped unexpectedly, restarting...");
        restartScanner();
      }
    };

    const interval = setInterval(checkScanner, 5000);
    return () => clearInterval(interval);
  }, [isActive, isScanning]);

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;

    const currentIndex = cameras.findIndex(cam => cam.id === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    try {
      await scannerRef.current.setCamera(nextCamera.id);
      setCurrentCamera(nextCamera.id);
    } catch (error) {
      console.error("Camera switch error:", error);
      onError?.("Не удалось переключить камеру");
    }
  };

  const handleManualRestart = () => {
    setRetryCount(0);
    restartScanner();
  };

  if (!isActive) return null;

  if (hasPermission === false) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="text-center space-y-4">
          <CameraOff className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Нет доступа к камере</h3>
            <p className="text-sm text-muted-foreground">
              Разрешите доступ к камере для сканирования QR-кодов
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Попытка {retryCount}/3
              </p>
            )}
          </div>
          <Button onClick={handleManualRestart} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Перезапустить
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-card shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className={`w-5 h-5 ${isScanning ? 'text-green-500' : 'text-primary'}`} />
            <span className="font-medium">Сканер QR-кодов</span>
            {isScanning && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Активен</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {cameras.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={switchCamera}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Сменить камеру
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRestart}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Перезапустить
            </Button>
          </div>
        </div>
        
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Наведите камеру на QR-код считывателя
        </p>
      </div>
    </Card>
  );
};

export default QRScanner;