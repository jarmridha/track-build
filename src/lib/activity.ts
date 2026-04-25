import { supabase } from "@/integrations/supabase/client";

export async function logActivity(params: {
  action_type: string;
  description: string;
  project_id?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    project_id: params.project_id ?? null,
    action_type: params.action_type,
    description: params.description,
  });
}
