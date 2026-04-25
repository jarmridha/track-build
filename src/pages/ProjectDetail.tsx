import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil, Trash2, MapPin, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ProjectStatus } from "@/lib/types";

type Detail = { id: string; name: string; client: string | null; location: string | null; start_date: string | null; end_date: string | null; progress: number; status: ProjectStatus; remarks: string | null; assigned_user_id: string | null; };
type Update = { id: string; date: string; work_completed: string | null; manpower_count: number | null; progress_percent: number | null; remarks: string | null; user_id: string };

export default function ProjectDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Detail | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [assignee, setAssignee] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      setProject(data as Detail);
      if (data?.assigned_user_id) {
        const { data: p } = await supabase.from("profiles").select("full_name,email").eq("id", data.assigned_user_id).maybeSingle();
        setAssignee(p?.full_name || p?.email || "");
      }
    });
    supabase.from("daily_updates").select("*").eq("project_id", id).order("date", { ascending: false }).then(({ data }) => setUpdates((data as Update[]) ?? []));
  }, [id]);

  async function handleDelete() {
    if (!id || !project) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logActivity({ action_type: "project_deleted", description: `Deleted project "${project.name}"` });
    toast.success("Project deleted");
    navigate("/projects");
  }

  if (!project) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground">{project.client}</p>
          </div>
          {role === "admin" && (
            <div className="flex gap-2">
              <Link to={`/projects/${project.id}/edit`}><Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Edit</Button></Link>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove "{project.name}" and all daily updates.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
          {project.location && <Info icon={MapPin} label="Location" value={project.location} />}
          {project.start_date && <Info icon={Calendar} label="Start" value={format(new Date(project.start_date), "MMM d, yyyy")} />}
          {project.end_date && <Info icon={Calendar} label="End" value={format(new Date(project.end_date), "MMM d, yyyy")} />}
          <Info icon={User} label="Assigned" value={assignee || "Unassigned"} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
        </div>

        {project.remarks && (
          <div className="mt-5 p-4 rounded-lg bg-muted">
            <div className="text-xs font-medium text-muted-foreground mb-1">Remarks</div>
            <p className="text-sm">{project.remarks}</p>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Progress Timeline</h2>
          <Link to={`/daily-updates/new?project=${project.id}`}><Button size="sm">Add Update</Button></Link>
        </div>
        {updates.length === 0 ? (
          <div className="text-muted-foreground text-sm py-6 text-center">No daily updates yet</div>
        ) : (
          <div className="space-y-4">
            {updates.map(u => (
              <div key={u.id} className="border-l-2 border-primary pl-4 pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="text-sm font-semibold">{format(new Date(u.date), "EEE, MMM d, yyyy")}</div>
                  {u.progress_percent !== null && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{u.progress_percent}% progress</span>}
                </div>
                {u.work_completed && <p className="text-sm">{u.work_completed}</p>}
                <div className="text-xs text-muted-foreground mt-1">
                  {u.manpower_count ? `${u.manpower_count} workers · ` : ""}{u.remarks}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
