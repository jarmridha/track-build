import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Invite = { id: string; email: string; role: string; status: string; expires_at: string | null; company_id: string | null };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    supabase.from("user_invites").select("id,email,role,status,expires_at,company_id").eq("token", token).maybeSingle().then(({ data, error }) => {
      if (error) toast.error(error.message);
      setInvite((data as Invite) ?? null);
      setLoading(false);
    });
  }, [token]);

  async function acceptInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");

    const { data, error } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return toast.error(error.message);

    const userId = data.user?.id;
    if (userId && invite.company_id) {
      await supabase.from("company_users").insert({ company_id: invite.company_id, user_id: userId, role: invite.role, status: "active" });
      await supabase.from("user_roles").insert({ user_id: userId, role: invite.role });
      await supabase.from("user_invites").update({ status: "accepted" }).eq("id", invite.id);
    }

    toast.success("Invite accepted. You can now login.");
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Checking invite…</div>;

  if (!invite || invite.status !== "pending") {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-3">
          <h1 className="text-xl font-bold">Invalid or expired invite</h1>
          <p className="text-muted-foreground">Please ask your company admin to send a new invite.</p>
          <Button asChild><Link to="/auth">Go to Login</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <Card className="max-w-md w-full p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Accept Company Invite</h1>
          <p className="text-muted-foreground text-sm">Create your account for {invite.email}</p>
        </div>
        <form onSubmit={acceptInvite} className="space-y-4">
          <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={invite.email} readOnly /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <Button className="w-full" type="submit">Accept Invite</Button>
        </form>
      </Card>
    </div>
  );
}
