import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Monitor, Settings, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="relative p-8 text-center">
          <div className="mx-auto max-w-5xl space-y-12">
            <div className="space-y-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 dark:from-slate-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                  Система контроля доступа
                </h1>
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  Безопасная криптографическая аутентификация с поддержкой цифровых карт
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="p-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Выберите действие
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Начните работу с системой контроля доступа
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-[1.02] hover:-translate-y-4">
              <div className="space-y-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-200 group-hover:scale-105">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Считыватель</h3>
                  <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200 text-lg leading-relaxed">
                    Используйте карту для доступа к защищённым зонам
                  </p>
                </div>
                <Button asChild className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 text-lg font-semibold">
                  <Link to="/card">
                    Открыть считыватель
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-150" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="group p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-[1.02] hover:-translate-y-4">
              <div className="space-y-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-all duration-200 group-hover:scale-105">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">Ключ</h3>
                  <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200 text-lg leading-relaxed">
                    Сканируйте QR-коды для проверки и генерации ключей
                  </p>
                </div>
                <Button asChild className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 text-lg font-semibold">
                  <Link to="/reader">
                    Открыть генератор
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-150" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="group p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-[1.02] hover:-translate-y-4">
              <div className="space-y-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all duration-200 group-hover:scale-105">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">Админ</h3>
                  <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-200 text-lg leading-relaxed">
                    Управление картами доступа и пользователями
                  </p>
                </div>
                <Button asChild className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 text-lg font-semibold">
                  <Link to="/admin">
                    Открыть админку
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-150" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
