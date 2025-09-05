import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Smartphone, Monitor, Settings, History, BarChart3 } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Главная", icon: Shield, variant: "default" as const },
    { path: "/card", label: "Считыватель", icon: Smartphone, variant: "secondary" as const },
    { path: "/reader", label: "Ключ", icon: Monitor, variant: "secondary" as const },
    { path: "/admin", label: "Админ", icon: Settings, variant: "secondary" as const },
    { path: "/access-history", label: "История", icon: History, variant: "secondary" as const },
    { path: "/audit-dashboard", label: "Аудит", icon: BarChart3, variant: "secondary" as const },
  ];

  return (
    <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl">
      <nav className="flex flex-wrap gap-3 justify-center">
        {navItems.map(({ path, label, icon: Icon, variant }) => (
          <Button
            key={path}
            variant={location.pathname === path ? "default" : variant}
            size="sm"
            asChild
            className={`group flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:-translate-y-1 ${
              location.pathname === path 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25" 
                : "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:shadow-lg"
            }`}
          >
            <Link to={path}>
              <Icon className="w-4 h-4 transition-all duration-150 group-hover:scale-110 group-hover:rotate-12" />
              <span className="font-medium">{label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </Card>
  );
};

export default Navigation;