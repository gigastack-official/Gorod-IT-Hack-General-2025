import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Monitor, Settings, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="relative p-8 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Система контроля доступа
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Безопасная криптографическая аутентификация с поддержкой цифровых карт
              </p>
            </div>
            
            <Navigation />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                  <Smartphone className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Цифровая карта</h3>
                  <p className="text-sm text-muted-foreground">
                    Безопасное хранение приватных ключей и подпись челленджей
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/card">
                    Открыть карту
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                  <Monitor className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Считыватель</h3>
                  <p className="text-sm text-muted-foreground">
                    Генерация челленджей и проверка цифровых подписей
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/reader">
                    Открыть считыватель
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Администрирование</h3>
                  <p className="text-sm text-muted-foreground">
                    Управление пользователями, ключами и политиками доступа
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/admin">
                    Админ-панель
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                  <Activity className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Журнал событий</h3>
                  <p className="text-sm text-muted-foreground">
                    Мониторинг всех попыток доступа и системных событий
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/events">
                    Посмотреть события
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Technical Info */}
          <Card className="mt-12 p-8 bg-gradient-card shadow-card">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">Технические особенности</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="font-semibold text-primary">Криптография</div>
                  <div className="text-muted-foreground">
                    ECDSA P-256, SHA-256<br/>
                    WebCrypto API<br/>
                    AES-GCM шифрование
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-primary">Безопасность</div>
                  <div className="text-muted-foreground">
                    Приватные ключи в IndexedDB<br/>
                    PIN защита (PBKDF2)<br/>
                    TTL челленджей
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-primary">Архитектура</div>
                  <div className="text-muted-foreground">
                    React + TypeScript<br/>
                    REST API интеграция<br/>
                    Офлайн поддержка
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
