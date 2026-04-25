import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, MapPin, Calendar } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";
import { format } from "date-fns";

type Proj = {
  id: string; name: string; client: string | null; location: string | null;
  start_date: string | null; end_date: string | null; progress: number; status: ProjectStatus;
};

export default function Projects() {
  const { role } = useAuth();
  const [items, setItems] = useState<Proj[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Proj[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    return items.filter(p =>
      (status === "all" || p.status === status) &&
      (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.client?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [items, q, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage all construction projects</p>
        </div>
        {role === "admin" && (
          <Link to="/projects/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
          </Link>
        )}
      </div>

      <Card className="p-4 shadow-[var(--shadow-card)]">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search projects or clients…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`}>
            <Card className="p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{p.client}</p>
              <div className="space-y-2 text-xs text-muted-foreground mb-4">
                {p.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{p.location}</div>}
                {p.end_date && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Due {format(new Date(p.end_date), "MMM d, yyyy")}</div>}
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                <span className="text-sm font-semibold tabular-nums">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-2" />
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground">No projects found</Card>
        )}
      </div>
    </div>
  );
}
