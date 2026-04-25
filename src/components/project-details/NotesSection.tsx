import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Note = { id: string; title: string | null; content: string; created_at: string; user_id: string };

export function NotesSection({ projectId, canManage, userId }: { projectId: string; canManage: boolean; userId: string | null }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_notes")
      .select("id,title,content,created_at,user_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setNotes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projectId]);

  async function handleAdd() {
    if (!content.trim() || !userId) return;
    setSaving(true);
    const { error } = await supabase.from("project_notes").insert({
      project_id: projectId, user_id: userId,
      title: title.trim() || null, content: content.trim(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setTitle(""); setContent("");
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("project_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-lg mb-4">Notes</h2>
      {canManage && (
        <div className="space-y-2 mb-6 p-4 rounded-lg border bg-muted/30">
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Write a note…" rows={3} value={content} onChange={e => setContent(e.target.value)} />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!content.trim() || saving}>
              <Plus className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="text-muted-foreground text-sm py-10 text-center flex flex-col items-center gap-2">
          <StickyNote className="h-8 w-8 opacity-50" />
          No notes yet
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  {n.title && <div className="font-medium">{n.title}</div>}
                  <div className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, yyyy · HH:mm")}</div>
                </div>
                {(canManage || n.user_id === userId) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
