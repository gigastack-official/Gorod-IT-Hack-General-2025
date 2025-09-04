import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Smartphone, Monitor, Settings, Activity } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Главная", icon: Shield, variant: "default" as const },
    { path: "/card", label: "Карта", icon: Smartphone, variant: "secondary" as const },
    { path: "/reader", label: "Считыватель", icon: Monitor, variant: "secondary" as const },
    { path: "/admin", label: "Админ", icon: Settings, variant: "secondary" as const },
    { path: "/events", label: "События", icon: Activity, variant: "outline" as const },
  ];

  return (
    <Card className="p-4 bg-gradient-card shadow-card">
      <nav className="flex flex-wrap gap-2 justify-center">
        {navItems.map(({ path, label, icon: Icon, variant }) => (
          <Button
            key={path}
            variant={location.pathname === path ? "default" : variant}
            size="sm"
            asChild
            className="flex items-center gap-2 transition-all duration-300 hover:shadow-primary"
          >
            <Link to={path}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          </Button>
        ))}
      </nav>
    </Card>
  );
};

export default Navigation;