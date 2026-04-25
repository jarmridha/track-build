import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Download, Printer, FileText } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { format } from "date-fns";

type Proj = { id: string; name: string; client: string | null; location: string | null; start_date: string | null; end_date: string | null; progress: number; status: ProjectStatus; remarks: string | null; };
type Update = { project_id: string; date: string; work_completed: string | null; remarks: string | null };

export default function Reports() {
  const [projects, setProjects] = useState<Proj[]>([]);
  const [updates, setUpdates] = useState<Record<string, Update | undefined>>({});
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    supabase.from("projects").select("*").order("name").then(({ data }) => setProjects((data as Proj[]) ?? []));
    supabase.from("daily_updates").select("project_id,date,work_completed,remarks").order("date", { ascending: false }).then(({ data }) => {
      const map: Record<string, Update> = {};
      (data ?? []).forEach((u: any) => { if (!map[u.project_id]) map[u.project_id] = u; });
      setUpdates(map);
    });
  }, []);

  const filtered = useMemo(() => projects.filter(p => {
    if (status !== "all" && p.status !== status) return false;
    if (from && p.start_date && p.start_date < from) return false;
    if (to && p.end_date && p.end_date > to) return false;
    return true;
  }), [projects, status, from, to]);

  function exportCSV() {
    const headers = ["Name", "Client", "Location", "Start", "End", "Progress %", "Status", "Remarks"];
    const lines = [headers.join(",")];
    filtered.forEach(p => {
      const cells = [p.name, p.client ?? "", p.location ?? "", p.start_date ?? "", p.end_date ?? "", p.progress, STATUS_LABEL[p.status], (p.remarks ?? "").replace(/"/g, '""')];
      lines.push(cells.map(c => `"${c}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Summary across all projects</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / PDF</Button>
        </div>
      </div>

      <Card className="p-4 shadow-[var(--shadow-card)] print:hidden">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Start from</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><Label>End by</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
      </Card>

      <div className="print:block">
        <div className="hidden print:flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6" />
          <div>
            <div className="font-bold text-xl">SiteTrack Project Report</div>
            <div className="text-xs text-muted-foreground">Generated {format(new Date(), "PPpp")}</div>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(p => {
            const last = updates[p.id];
            return (
              <Card key={p.id} className="p-5 shadow-[var(--shadow-card)] print:shadow-none print:border">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <div className="text-sm text-muted-foreground">{p.client} · {p.location}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div><span className="text-muted-foreground">Start:</span> {p.start_date ?? "—"}</div>
                  <div><span className="text-muted-foreground">End:</span> {p.end_date ?? "—"}</div>
                  <div><span className="text-muted-foreground">Progress:</span> <span className="font-semibold">{p.progress}%</span></div>
                </div>
                <Progress value={p.progress} className="h-2 mb-3" />
                {p.remarks && <div className="text-sm"><span className="font-medium">Remarks:</span> {p.remarks}</div>}
                {last && (
                  <div className="text-sm mt-2 pt-2 border-t">
                    <span className="font-medium">Latest update ({format(new Date(last.date), "MMM d")}):</span> {last.work_completed ?? last.remarks ?? "—"}
                  </div>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && <Card className="p-12 text-center text-muted-foreground">No projects match filters</Card>}
        </div>
      </div>
    </div>
  );
}
