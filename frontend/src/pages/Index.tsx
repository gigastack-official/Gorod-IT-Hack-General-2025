import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Monitor, ArrowRight } from "lucide-react";
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

      {/* Primary Actions */}
      <div className="p-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Считыватель</h3>
                <p className="text-sm text-muted-foreground">Используйте карту для доступа</p>
              </div>
              <Button asChild className="w-full bg-gradient-primary">
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
                <h3 className="font-semibold text-lg">Ключ</h3>
                <p className="text-sm text-muted-foreground">Сканируйте QR для проверки</p>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link to="/reader">
                  Открыть считыватель
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
