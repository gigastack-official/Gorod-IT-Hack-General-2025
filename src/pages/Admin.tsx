import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Trash2, Clock, RefreshCw } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type CardRecord = {
  cardId: string;
  kMaster?: string;
  owner?: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
};

type StatusResponse = {
  status: "OK" | "FAIL";
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.20.179.56:8080";

const AdminPage = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [owner, setOwner] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState<number>(86400);
  const [extendSeconds, setExtendSeconds] = useState<number>(3600);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/list`);
      if (!res.ok) throw new Error(`list ${res.status}`);
      const data = (await res.json()) as CardRecord[];
      setCards(data);
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось загрузить список карт", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const createCard = async () => {
    if (!owner) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, ttlSeconds }),
      });
      if (!res.ok) throw new Error(`create ${res.status}`);
      const created = await res.json() as { status: "OK" | "FAIL"; cardId: string; owner: string; expiresAt: string };
      if (created.status !== "OK") throw new Error("FAIL");
      setCards(prev => [{
        cardId: created.cardId,
        owner: created.owner,
        createdAt: new Date().toISOString(),
        expiresAt: created.expiresAt,
        active: true,
      }, ...prev]);
      toast({ title: "Карта создана", description: created.cardId });
      setOwner("");
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось создать карту", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const revokeCard = async (cardId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/revoke/${encodeURIComponent(cardId)}`, { method: "POST" });
      if (!res.ok) throw new Error(`revoke ${res.status}`);
      const status = (await res.json()) as StatusResponse;
      if (status.status !== "OK") throw new Error("FAIL");
      setCards(prev => prev.map(c => c.cardId === cardId ? { ...c, active: false } : c));
      toast({ title: "Карта деактивирована", description: cardId });
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось деактивировать", variant: "destructive" });
    }
  };

  const extendCard = async (cardId: string, extraSeconds: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/extend/${encodeURIComponent(cardId)}?extraSeconds=${extraSeconds}`, { method: "POST" });
      if (!res.ok) throw new Error(`extend ${res.status}`);
      const status = (await res.json()) as StatusResponse;
      if (status.status !== "OK") throw new Error("FAIL");
      setCards(prev => prev.map(c => {
        if (c.cardId !== cardId) return c;
        const old = c.expiresAt ? new Date(c.expiresAt).getTime() : Date.now();
        const extended = new Date(old + extraSeconds * 1000).toISOString();
        return { ...c, expiresAt: extended };
      }));
      toast({ title: "Срок продлён", description: `${cardId} +${extraSeconds}s` });
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось продлить", variant: "destructive" });
    }
  };

  const prettyDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }, [cards]);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Navigation />

      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Администрирование</h1>
                <p className="text-muted-foreground">Карты доступа</p>
              </div>
            </div>
            <Button onClick={fetchCards} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />Обновить
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="font-semibold mb-4">Создать карту</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="owner">Владелец</Label>
              <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Иван" />
            </div>
            <div>
              <Label htmlFor="ttl">TTL (сек)</Label>
              <Input id="ttl" type="number" min={60} value={ttlSeconds} onChange={(e) => setTtlSeconds(Number(e.target.value) || 60)} />
            </div>
            <div className="flex items-end">
              <Button onClick={createCard} disabled={creating || !owner || ttlSeconds < 60} className="w-full bg-gradient-primary">
                {creating ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Список карт {loading && <span className="text-xs text-muted-foreground">(загрузка...)</span>}</h3>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="space-y-3">
                {[0,1,2].map((i) => (
                  <div key={i} className="p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && sortedCards.map((c) => (
              <div key={c.cardId} className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <div><strong>ID:</strong> {c.cardId}</div>
                    <div className="flex items-center gap-2">
                      <span><strong>Владелец:</strong> {c.owner || "—"}</span>
                      <Badge variant={c.active ? "default" : "destructive"}>{c.active ? "Активна" : "Отключена"}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span><strong>Создан:</strong> {prettyDate(c.createdAt)}</span>
                      <span className="ml-3"><strong>Истекает:</strong> {prettyDate(c.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Select value={String(extendSeconds)} onValueChange={(v) => setExtendSeconds(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Продлить" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3600">+1 час</SelectItem>
                          <SelectItem value="86400">+1 день</SelectItem>
                          <SelectItem value="604800">+7 дней</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => extendCard(c.cardId, extendSeconds)}>
                        <Clock className="w-3 h-3 mr-1" /> Продлить
                      </Button>
                    </div>

                    <AlertDialog open={revokingId === c.cardId} onOpenChange={(open) => setRevokingId(open ? c.cardId : null)}>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" onClick={() => setRevokingId(c.cardId)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Отключить
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Деактивировать карту?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Карта {c.cardId} будет отключена. Это действие можно отменить только повторной активацией на сервере.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => revokeCard(c.cardId)}>Отключить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {!loading && sortedCards.length === 0 && (
              <div className="text-sm text-muted-foreground">Нет карт</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;