import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

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

  useEffect(() => {
    if (!videoRef.current || !isActive) return;

    const initScanner = async () => {
      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          onError?.("Камера не найдена");
          return;
        }

        // Get available cameras
        const availableCameras = await QrScanner.listCameras(true);
        setCameras(availableCameras);
        
        if (availableCameras.length > 0) {
          setCurrentCamera(availableCameras[0].id);
        }

        // Create scanner
        const scanner = new QrScanner(
          videoRef.current!,
          (result) => {
            onResult(result.data);
          },
          {
            onDecodeError: (error) => {
              console.log("QR decode error:", error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment", // Prefer back camera
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
        setHasPermission(true);
      } catch (error) {
        console.error("Scanner init error:", error);
        setHasPermission(false);
        onError?.("Не удалось получить доступ к камере");
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isActive, onResult, onError]);

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
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-card shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-medium">Сканер QR-кодов</span>
          </div>
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