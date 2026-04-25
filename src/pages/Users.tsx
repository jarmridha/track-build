import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, Shield, UserPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import type { AppRole, UserStatus } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

type Profile = { id: string; full_name: string; email: string; phone: string | null; status: UserStatus };
type Row = Profile & { role: AppRole | null };

export default function Users() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<{ full_name: string; phone: string; role: AppRole; status: UserStatus }>({ full_name: "", phone: "", role: "engineer", status: "active" });

  async function load() {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const merged = (profiles ?? []).map(p => ({
      ...(p as Profile),
      role: ((roles ?? []).find(r => r.user_id === p.id)?.role ?? null) as AppRole | null,
    }));
    setRows(merged);
  }
  useEffect(() => { load(); }, []);

  function openEdit(u: Row) {
    setEditing(u);
    setForm({ full_name: u.full_name, phone: u.phone ?? "", role: (u.role ?? "engineer") as AppRole, status: u.status });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone || null, status: form.status,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    if (form.role !== editing.role) {
      await supabase.from("user_roles").delete().eq("user_id", editing.id);
      await supabase.from("user_roles").insert({ user_id: editing.id, role: form.role });
    }
    await logActivity({ action_type: "user_updated", description: `Updated user ${form.full_name || editing.email}` });
    toast.success("User updated");
    setEditing(null);
    load();
  }

  async function del(u: Row) {
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    if (error) return toast.error(error.message);
    await logActivity({ action_type: "user_deleted", description: `Deleted user ${u.full_name || u.email}` });
    toast.success("User deleted");
    load();
  }

  const filtered = rows.filter(r => q === "" || r.full_name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Admins, engineers, and supervisors</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Invite team member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Share this signup link. New members register with their email and a password, then appear here as <strong>Engineer</strong> by default. You can change their role afterward.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/auth`} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth`);
                    toast.success("Signup link copied");
                  }}
                ><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Shield className="h-3 w-3" />{u.role ? ROLE_LABEL[u.role] : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                          <AlertDialogDescription>This removes their profile and role. The auth account remains in the system.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del(u)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No users</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as UserStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
