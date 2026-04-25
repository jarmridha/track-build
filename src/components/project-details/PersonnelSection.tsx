import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Users, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

type Person = { id: string; full_name: string; role_title: string | null; phone: string | null; email: string | null; notes: string | null };

export function PersonnelSection({ projectId, canManage, userId }: { projectId: string; canManage: boolean; userId: string | null }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", role_title: "", phone: "", email: "", notes: "" });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_personnel")
      .select("id,full_name,role_title,phone,email,notes")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPeople(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projectId]);

  async function handleAdd() {
    if (!form.full_name.trim() || !userId) return;
    const { error } = await supabase.from("project_personnel").insert({
      project_id: projectId,
      added_by: userId,
      full_name: form.full_name.trim(),
      role_title: form.role_title || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Personnel added");
    setForm({ full_name: "", role_title: "", phone: "", email: "", notes: "" });
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("project_personnel").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Personnel</h2>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add person</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Role / title</Label><Input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} placeholder="e.g. Site Engineer" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : people.length === 0 ? (
        <div className="text-muted-foreground text-sm py-10 text-center flex flex-col items-center gap-2">
          <Users className="h-8 w-8 opacity-50" />
          No personnel assigned
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {people.map(p => (
            <div key={p.id} className="border rounded-lg p-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.full_name}</div>
                {p.role_title && <div className="text-xs text-muted-foreground">{p.role_title}</div>}
                <div className="mt-2 space-y-1 text-xs">
                  {p.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{p.phone}</div>}
                  {p.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" />{p.email}</div>}
                </div>
                {p.notes && <p className="text-xs mt-2">{p.notes}</p>}
              </div>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
