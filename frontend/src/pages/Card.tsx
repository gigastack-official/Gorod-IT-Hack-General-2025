import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Key, CheckCircle2, AlertCircle, Send } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import QRScanner from "@/components/QRScanner";
import { useToast } from "@/hooks/use-toast";
import { 
  generateKeyPair, 
  signChallenge, 
  exportKeyToJWK, 
  importKeyFromJWK,
  type Challenge,
  type KeyPair,
  type StoredCredential 
} from "@/lib/crypto";

const CardPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [lastChallenge, setLastChallenge] = useState<Challenge | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load stored credential on mount
  useEffect(() => {
    loadStoredCredential();
  }, []);

  const loadStoredCredential = async () => {
    try {
      const stored = localStorage.getItem('accessCard.credential');
      if (stored) {
        const cred: StoredCredential = JSON.parse(stored);
        setCredential(cred);
        setHasPrivateKey(true);
        
        // Import private key
        if (cred.privateKeyJWK) {
          const privateKey = await importKeyFromJWK(cred.privateKeyJWK, ['sign']);
          const publicKey = await importKeyFromJWK(cred.publicKeyJWK, ['verify']);
          setKeyPair({ privateKey, publicKey });
        }
      }
    } catch (error) {
      console.error('Failed to load credential:', error);
    }
  };

  const handleQRResult = async (qrData: string) => {
    if (!keyPair || isProcessing) return;
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      // Parse challenge from QR code
      const challenge: Challenge = JSON.parse(qrData);
      setLastChallenge(challenge);
      
      // Sign the challenge
      const signature = await signChallenge(keyPair.privateKey, challenge);
      
      // Prepare response
      const response = {
        challengeId: challenge.id,
        credentialId: credential!.id,
        signatureB64: signature,
        publicKeyJWK: credential!.publicKeyJWK
      };
      
      toast({
        title: "Челлендж подписан",
        description: `Подпись создана для челленджа ${challenge.id}`,
      });
      
      // Here you would normally send to server
      console.log('Challenge response:', response);
      
      // Simulate server response
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        toast({
          title: success ? "Доступ разрешен" : "Доступ запрещен",
          description: success ? "Аутентификация успешна" : "Ошибка верификации",
          variant: success ? "default" : "destructive",
        });
      }, 1500);
      
    } catch (error) {
      console.error('Challenge processing error:', error);
      toast({
        title: "Ошибка обработки",
        description: "Не удалось обработать QR-код",
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

  const generateNewKeyPair = async () => {
    try {
      // Generate new key pair
      const newKeyPair = await generateKeyPair();
      
      // Export keys
      const privateKeyJWK = await exportKeyToJWK(newKeyPair.privateKey);
      const publicKeyJWK = await exportKeyToJWK(newKeyPair.publicKey);
      
      // Create credential
      const newCredential: StoredCredential = {
        id: `cred_${Date.now()}`,
        publicKeyJWK,
        privateKeyJWK,
        userId: `user_${Date.now()}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };
      
      // Store locally
      localStorage.setItem('accessCard.credential', JSON.stringify(newCredential));
      
      setCredential(newCredential);
      setKeyPair(newKeyPair);
      setHasPrivateKey(true);
      
      toast({
        title: "Ключи сгенерированы",
        description: "Новые ключи созданы и сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать ключи",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Карта доступа</h1>
              <p className="text-muted-foreground">Цифровая карта безопасности</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <span className="font-medium">Статус ключа</span>
              </div>
              <Badge variant={hasPrivateKey ? "default" : "destructive"}>
                {hasPrivateKey ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {hasPrivateKey ? "Активен" : "Отсутствует"}
              </Badge>
            </div>

            {!hasPrivateKey && (
              <Button 
                onClick={generateNewKeyPair}
                className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                Генерировать ключи
              </Button>
            )}
            
            {hasPrivateKey && credential && (
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong>ID:</strong> {credential.id}</div>
                <div><strong>Создан:</strong> {new Date(credential.createdAt).toLocaleDateString()}</div>
                <div><strong>Истекает:</strong> {new Date(credential.expiresAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </Card>

        {hasPrivateKey && (
          <>
            <div className="space-y-4">
              <Button
                onClick={() => setIsScanning(!isScanning)}
                disabled={isProcessing}
                className="w-full bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                {isScanning ? "Остановить сканирование" : "Начать сканирование"}
              </Button>
              
              {isProcessing && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Send className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">
                      Обработка челленджа...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <QRScanner
              isActive={isScanning}
              onResult={handleQRResult}
              onError={handleScanError}
            />

            {lastChallenge && (
              <Card className="p-4 bg-gradient-card shadow-card">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Последний челлендж</span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>ID:</strong> {lastChallenge.id}</div>
                    <div><strong>Считыватель:</strong> {lastChallenge.readerId}</div>
                    <div><strong>Время:</strong> {new Date(lastChallenge.timestamp).toLocaleString()}</div>
                    <div><strong>Nonce:</strong> {lastChallenge.nonce}</div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CardPage;