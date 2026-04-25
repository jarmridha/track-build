import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Pencil, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import type { ProjectStatus } from "@/lib/types";

type Props = {
  project: {
    id: string;
    name: string;
    client: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    progress: number;
    status: ProjectStatus;
    remarks: string | null;
  };
  assignee: string;
  isAdmin: boolean;
  onDelete: () => void;
};

export function OverviewSection({ project, assignee, isAdmin, onDelete }: Props) {
  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground">{project.client}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link to={`/projects/${project.id}/edit`}><Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Edit</Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove "{project.name}" and all related data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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
          <p className="text-sm whitespace-pre-wrap">{project.remarks}</p>
        </div>
      )}
    </Card>
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
