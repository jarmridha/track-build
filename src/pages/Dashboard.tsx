import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { ROLE_LABEL, type ProjectStatus } from "@/lib/types";
import { FolderKanban, PlayCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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
    { label: "Total Projects", value: total, icon: FolderKanban, tone: "bg-primary/10 text-primary", to: "/projects" },
    { label: "Running", value: running, icon: PlayCircle, tone: "bg-info/10 text-info", to: "/projects?status=running" },
    { label: "Completed", value: completed, icon: CheckCircle2, tone: "bg-success/10 text-success", to: "/projects?status=completed" },
    { label: "Delayed", value: delayed, icon: AlertTriangle, tone: "bg-destructive/10 text-destructive", to: "/projects?status=delayed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all construction projects</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <Card className="p-4 lg:p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer h-full">
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
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Project Progress Overview</h2>
              <p className="text-xs text-muted-foreground">Completion percentage by project</p>
            </div>
          </div>
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projects.map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, progress: p.progress }))}
                margin={{ top: 10, right: 16, left: -10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v) => [`${v}%`, "Progress"]}
                />
                <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4">
            <h2 className="font-semibold text-lg">Status Distribution</h2>
            <p className="text-xs text-muted-foreground">Breakdown across all projects</p>
          </div>
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Running", value: running, color: "hsl(var(--info))" },
                    { name: "Completed", value: completed, color: "hsl(var(--success))" },
                    { name: "Delayed", value: delayed, color: "hsl(var(--destructive))" },
                    { name: "Not Started", value: Math.max(total - running - completed - delayed, 0), color: "hsl(var(--muted-foreground))" },
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {[
                    "hsl(var(--info))",
                    "hsl(var(--success))",
                    "hsl(var(--destructive))",
                    "hsl(var(--muted-foreground))",
                  ].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>
            <Link to="/activity" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {logs.map(l => (
              <Link key={l.id} to="/activity" className="flex gap-3 text-sm rounded-md p-2 -mx-2 hover:bg-accent transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground">{l.description}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm")}</div>
                </div>
              </Link>
            ))}
            {logs.length === 0 && <div className="text-sm text-muted-foreground py-4">No activity yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
