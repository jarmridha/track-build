import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Update = { id: string; date: string; work_completed: string | null; manpower_count: number | null; progress_percent: number | null; remarks: string | null };

export function TimelineSection({ projectId }: { projectId: string }) {
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    supabase.from("daily_updates").select("*").eq("project_id", projectId).order("date", { ascending: false })
      .then(({ data }) => setUpdates((data as Update[]) ?? []));
  }, [projectId]);

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Progress Timeline</h2>
        <Link to={`/daily-updates/new?project=${projectId}`}><Button size="sm">Add Update</Button></Link>
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
  );
}
