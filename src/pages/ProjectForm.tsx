import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

export default function ProjectForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [form, setForm] = useState({
    name: "", client: "", location: "", start_date: "", end_date: "",
    progress: 0, status: "not_started" as ProjectStatus, remarks: "",
    assigned_user_id: "" as string,
  });

  useEffect(() => {
    supabase.from("profiles").select("id,full_name,email").then(({ data }) => setUsers(data ?? []));
    if (editing && id) {
      supabase.from("projects").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) setForm({
          name: data.name, client: data.client ?? "", location: data.location ?? "",
          start_date: data.start_date ?? "", end_date: data.end_date ?? "",
          progress: data.progress, status: data.status as ProjectStatus, remarks: data.remarks ?? "",
          assigned_user_id: data.assigned_user_id ?? "",
        });
      });
    }
  }, [id, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.progress < 0 || form.progress > 100) return toast.error("Progress must be 0–100");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      assigned_user_id: form.assigned_user_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      created_by: user?.id ?? null,
    };
    if (editing && id) {
      const { error } = await supabase.from("projects").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
      await logActivity({ action_type: "project_updated", description: `Updated project "${form.name}"`, project_id: id });
      toast.success("Project updated");
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select().single();
      if (error) return toast.error(error.message);
      await logActivity({ action_type: "project_created", description: `Created project "${form.name}"`, project_id: data.id });
      toast.success("Project created");
    }
    navigate("/projects");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold mb-1">{editing ? "Edit" : "New"} Project</h1>
        <p className="text-muted-foreground mb-6">Project details and assignment</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project Name *</Label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Client / Owner</Label><Input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Progress (%)</Label>
              <Input type="number" min={0} max={100} value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as ProjectStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assigned Engineer / Supervisor</Label>
            <Select value={form.assigned_user_id || "none"} onValueChange={v => setForm({ ...form, assigned_user_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea rows={3} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? "Save changes" : "Create project"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
