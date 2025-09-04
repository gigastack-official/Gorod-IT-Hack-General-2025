import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, User, Key, Trash2, Edit } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  credentialId: string;
  createdAt: Date;
  expiresAt: Date;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Иван Петров",
      email: "ivan@company.com",
      status: "active",
      credentialId: "cred_001",
      createdAt: new Date("2024-01-15"),
      expiresAt: new Date("2024-12-31")
    },
    {
      id: "2", 
      name: "Мария Сидорова",
      email: "maria@company.com",
      status: "active",
      credentialId: "cred_002",
      createdAt: new Date("2024-02-10"),
      expiresAt: new Date("2024-12-31")
    }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const { toast } = useToast();

  const addUser = () => {
    if (!newUserName || !newUserEmail) return;
    
    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      status: "active",
      credentialId: `cred_${Date.now()}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    setUsers([...users, newUser]);
    setNewUserName("");
    setNewUserEmail("");
    setShowAddUser(false);
    
    toast({
      title: "Пользователь добавлен",
      description: `${newUser.name} успешно создан`,
    });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    
    toast({
      title: "Статус изменен",
      description: "Статус пользователя обновлен",
    });
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "Пользователь удален",
      description: "Пользователь удален из системы",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Администрирование</h1>
                <p className="text-muted-foreground">Управление пользователями и ключами</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-gradient-primary hover:opacity-90 shadow-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить пользователя
            </Button>
          </div>
        </Card>

        {showAddUser && (
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="font-semibold mb-4">Новый пользователь</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addUser} className="bg-gradient-success hover:opacity-90">
                Создать
              </Button>
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                Отмена
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="font-semibold mb-4">Пользователи системы</h3>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Активен' : 'Отключен'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span>ID: {user.credentialId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Создан: </span>
                    {user.createdAt.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Истекает: </span>
                    {user.expiresAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;