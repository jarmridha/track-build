import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "Track Build",
    tagline: "Construction Project Management",
    website: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    primary_color: "#0f172a",
  });

  useEffect(() => {
    supabase.from("company_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...form, ...data });
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("company_settings").upsert({ id: 1, ...form, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Company branding saved");
  }

  if (loading) return <div className="text-muted-foreground">Loading branding settings…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Company Branding</h1>
        <p className="text-muted-foreground">Admin-only settings after installation. These values can be used in reports, headers and company identity.</p>
      </div>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://.../logo.png" />
            <p className="text-xs text-muted-foreground mt-1">Upload logo to Supabase Storage or any public image host, then paste the logo URL here.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <Input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>

          <div>
            <Label>Company Address</Label>
            <Textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="text-sm font-semibold mb-2">Preview</div>
            <div className="flex items-center gap-3">
              {form.logo_url ? <img src={form.logo_url} alt="Company logo" className="h-12 w-12 rounded object-contain bg-background border" /> : <div className="h-12 w-12 rounded bg-primary" />}
              <div>
                <div className="font-bold text-lg">{form.company_name || "Company Name"}</div>
                <div className="text-sm text-muted-foreground">{form.tagline || "Company tagline"}</div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Branding"}</Button>
        </form>
      </Card>
    </div>
  );
}
