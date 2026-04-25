import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { ROLE_LABEL, type ProjectStatus } from "@/lib/types";
import { FolderKanban, PlayCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type Proj = { id: string; name: string; client: string | null; progress: number; status: ProjectStatus; end_date: string | null };
type Log = { id: string; action_type: string; description: string; created_at: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<Proj[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    supabase.from("projects").select("id,name,client,progress,status,end_date").order("updated_at", { ascending: false }).then(({ data }) => setProjects((data as Proj[]) ?? []));
    supabase.from("activity_logs").select("id,action_type,description,created_at").order("created_at", { ascending: false }).limit(8).then(({ data }) => setLogs((data as Log[]) ?? []));
  }, []);

  const total = projects.length;
  const running = projects.filter(p => p.status === "running").length;
  const completed = projects.filter(p => p.status === "completed").length;
  const delayed = projects.filter(p => p.status === "delayed").length;

  const stats = [
    { label: "Total Projects", value: total, icon: FolderKanban, tone: "bg-primary/10 text-primary" },
    { label: "Running", value: running, icon: PlayCircle, tone: "bg-info/10 text-info" },
    { label: "Completed", value: completed, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Delayed", value: delayed, icon: AlertTriangle, tone: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all construction projects</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4 lg:p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs lg:text-sm text-muted-foreground font-medium">{s.label}</div>
                <div className="text-2xl lg:text-3xl font-bold mt-1">{s.value}</div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Project Progress</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 6).map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.client}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{p.progress}%</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <Progress value={p.progress} className="h-2" />
              </Link>
            ))}
            {projects.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">No projects yet</div>}
          </div>
        </Card>

        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {logs.map(l => (
              <div key={l.id} className="flex gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground">{l.description}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm")}</div>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-sm text-muted-foreground py-4">No activity yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
