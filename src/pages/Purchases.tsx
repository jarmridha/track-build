import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Project = { id: string; name: string };
type Purchase = {
  id: string;
  project_id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_amount: number | null;
  supplier: string | null;
  purchase_date: string;
  remarks: string | null;
  projects?: { name: string } | null;
};

export default function Purchases() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<Purchase[]>([]);
  const [form, setForm] = useState({ project_id: "", item_name: "", quantity: 0, unit: "pcs", unit_price: 0, supplier: "", purchase_date: new Date().toISOString().slice(0, 10), remarks: "" });

  const total = rows.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);

  async function load() {
    const { data } = await supabase.from("site_purchases").select("*, projects(name)").order("purchase_date", { ascending: false });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
    supabase.from("projects").select("id,name").order("name").then(({ data }) => setProjects(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Login required");
    if (!form.project_id || !form.item_name) return toast.error("Project and item are required");
    const total_amount = Number(form.quantity || 0) * Number(form.unit_price || 0);
    const { error } = await supabase.from("site_purchases").insert({ ...form, total_amount, created_by: user.id });
    if (error) return toast.error(error.message);
    toast.success("Purchase entry saved");
    setOpen(false);
    setForm({ ...form, item_name: "", quantity: 0, unit_price: 0, supplier: "", remarks: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Site Purchases</h1>
          <p className="text-muted-foreground">Track necessary site materials, supplier and cost entries.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Purchase</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Site Purchase</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Project *</Label><Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Item / Material *</Label><Input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="Cement, sand, screw, cable, glass, hardware..." /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Qty</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
                <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
                <div><Label>Unit Price</Label><Input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></div>
              </div>
              <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
              <Button className="w-full" type="submit">Save Purchase</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-sm text-muted-foreground">Total Entries</div><div className="text-2xl font-bold">{rows.length}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Total Cost</div><div className="text-2xl font-bold">৳ {total.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Projects</div><div className="text-2xl font-bold">{new Set(rows.map(r => r.project_id)).size}</div></Card>
      </div>

      <div className="space-y-3">
        {rows.map(r => <Card key={r.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4" />{r.item_name}</div><div className="text-sm text-muted-foreground">{r.projects?.name ?? "Project"} · {r.supplier ?? "No supplier"}</div></div><div className="text-right"><div className="font-bold">৳ {Number(r.total_amount ?? 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">{r.quantity ?? 0} {r.unit ?? ""}</div></div></div>{r.remarks && <p className="text-sm mt-2 border-t pt-2">{r.remarks}</p>}</Card>)}
        {rows.length === 0 && <Card className="p-12 text-center text-muted-foreground">No purchase entries yet</Card>}
      </div>
    </div>
  );
}
