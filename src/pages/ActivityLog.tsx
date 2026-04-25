import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";

type Row = { id: string; action_type: string; description: string; created_at: string; user_id: string | null; project_id: string | null };

export default function ActivityLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  const filtered = useMemo(() => rows.filter(r => q === "" || r.description.toLowerCase().includes(q.toLowerCase()) || r.action_type.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Audit trail of every action</p>
      </div>
      <Card className="p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search activity…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </Card>
      <Card className="shadow-[var(--shadow-card)]">
        <div className="divide-y">
          {filtered.map(r => (
            <div key={r.id} className="p-4 flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted text-muted-foreground font-medium shrink-0">
                {r.action_type.replace(/_/g, " ")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{r.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(r.created_at), "MMM d, yyyy 'at' HH:mm")}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground">No activity</div>}
        </div>
      </Card>
    </div>
  );
}
