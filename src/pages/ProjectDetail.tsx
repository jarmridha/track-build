import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, Image as ImageIcon, FileText, Users, StickyNote, Activity } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

import { OverviewSection } from "@/components/project-details/OverviewSection";
import { ImagesSection } from "@/components/project-details/ImagesSection";
import { DocumentsSection } from "@/components/project-details/DocumentsSection";
import { PersonnelSection } from "@/components/project-details/PersonnelSection";
import { NotesSection } from "@/components/project-details/NotesSection";
import { TimelineSection } from "@/components/project-details/TimelineSection";

type Detail = {
  id: string; name: string; client: string | null; location: string | null;
  start_date: string | null; end_date: string | null; progress: number;
  status: ProjectStatus; remarks: string | null; assigned_user_id: string | null;
};

type SectionKey = "overview" | "timeline" | "images" | "documents" | "personnel" | "notes";

const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "timeline", label: "Timeline", icon: Activity },
  { key: "images", label: "Images", icon: ImageIcon },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "personnel", label: "Personnel", icon: Users },
  { key: "notes", label: "Notes", icon: StickyNote },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Detail | null>(null);
  const [assignee, setAssignee] = useState<string>("");
  const [section, setSection] = useState<SectionKey>("overview");

  useEffect(() => {
    if (!id) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      setProject(data as Detail);
      if (data?.assigned_user_id) {
        const { data: p } = await supabase.from("profiles").select("full_name,email").eq("id", data.assigned_user_id).maybeSingle();
        setAssignee(p?.full_name || p?.email || "");
      }
    });
  }, [id]);

  const canManage = useMemo(() => {
    if (!project || !user) return false;
    return role === "admin" || role === "supervisor" || project.assigned_user_id === user.id;
  }, [project, role, user]);

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
    <div className="space-y-4 max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Section nav */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible bg-card border rounded-lg p-2">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {section === "overview" && (
            <OverviewSection
              project={project}
              assignee={assignee}
              isAdmin={role === "admin"}
              onDelete={handleDelete}
            />
          )}
          {section === "timeline" && <TimelineSection projectId={project.id} />}
          {section === "images" && <ImagesSection projectId={project.id} canManage={canManage} userId={user?.id ?? null} />}
          {section === "documents" && <DocumentsSection projectId={project.id} canManage={canManage} userId={user?.id ?? null} />}
          {section === "personnel" && <PersonnelSection projectId={project.id} canManage={canManage} userId={user?.id ?? null} />}
          {section === "notes" && <NotesSection projectId={project.id} canManage={canManage} userId={user?.id ?? null} />}
        </div>
      </div>
    </div>
  );
}
