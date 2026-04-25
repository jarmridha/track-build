import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Row = { id: string; date: string; work_completed: string | null; manpower_count: number | null; progress_percent: number | null; remarks: string | null; project_id: string; projects?: { name: string } | null; };
type Proj = { id: string; name: string };

export default function DailyUpdates() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialProject = params.get("project") || "";
  const [open, setOpen] = useState(initialProject !== "");
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [form, setForm] = useState({
    project_id: initialProject, date: format(new Date(), "yyyy-MM-dd"),
    work_completed: "", manpower_count: 0, materials_used: "",
    issues: "", next_day_plan: "", progress_percent: 0, remarks: "",
  });

  async function load() {
    const { data } = await supabase.from("daily_updates").select("*, projects(name)").order("date", { ascending: false }).limit(100);
    setRows((data as any) ?? []);
  }
  useEffect(() => {
    load();
    supabase.from("projects").select("id,name").order("name").then(({ data }) => setProjects(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.project_id) return toast.error("Pick a project");
    if (form.progress_percent < 0 || form.progress_percent > 100) return toast.error("Progress 0–100");
    const { error } = await supabase.from("daily_updates").insert({ ...form, user_id: user.id });
    if (error) return toast.error(error.message);
    if (form.progress_percent > 0) {
      await supabase.from("projects").update({ progress: form.progress_percent }).eq("id", form.project_id);
    }
    const proj = projects.find(p => p.id === form.project_id);
    await logActivity({ action_type: "daily_update", description: `Submitted daily update for "${proj?.name ?? "project"}"`, project_id: form.project_id });
    toast.success("Update submitted");
    setOpen(false);
    setForm({ ...form, work_completed: "", manpower_count: 0, materials_used: "", issues: "", next_day_plan: "", remarks: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Daily Updates</h1>
          <p className="text-muted-foreground">Log site progress from anywhere</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Update</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Submit Daily Update</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Project *</Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Manpower</Label><Input type="number" min={0} value={form.manpower_count} onChange={e => setForm({ ...form, manpower_count: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Work Completed Today</Label><Textarea rows={2} value={form.work_completed} onChange={e => setForm({ ...form, work_completed: e.target.value })} /></div>
              <div><Label>Materials Used</Label><Textarea rows={2} value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} /></div>
              <div><Label>Issues / Obstacles</Label><Textarea rows={2} value={form.issues} onChange={e => setForm({ ...form, issues: e.target.value })} /></div>
              <div><Label>Next Day Plan</Label><Textarea rows={2} value={form.next_day_plan} onChange={e => setForm({ ...form, next_day_plan: e.target.value })} /></div>
              <div><Label>Progress % (overall)</Label><Input type="number" min={0} max={100} value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: Number(e.target.value) })} /></div>
              <div><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
              <Button type="submit" className="w-full">Submit Update</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {rows.map(r => (
          <Card key={r.id} className="p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div>
                <Link to={`/projects/${r.project_id}`} className="font-semibold hover:text-primary">{r.projects?.name ?? "Project"}</Link>
                <div className="text-xs text-muted-foreground">{format(new Date(r.date), "EEE, MMM d, yyyy")}</div>
              </div>
              {r.progress_percent !== null && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.progress_percent}%</span>}
            </div>
            {r.work_completed && <p className="text-sm mb-1">{r.work_completed}</p>}
            <div className="text-xs text-muted-foreground">{r.manpower_count ? `${r.manpower_count} workers` : ""}{r.remarks ? ` · ${r.remarks}` : ""}</div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-12 text-center text-muted-foreground">No updates yet</Card>}
      </div>
    </div>
  );
}
