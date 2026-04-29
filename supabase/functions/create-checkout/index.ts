import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, plan, priceId, successUrl, cancelUrl } = await req.json();
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
    if (!companyId || !priceId) throw new Error("companyId and priceId are required");

    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", successUrl || `${req.headers.get("origin")}/settings?payment=success`);
    body.set("cancel_url", cancelUrl || `${req.headers.get("origin")}/settings?payment=cancelled`);
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", "1");
    body.set("metadata[company_id]", companyId);
    body.set("metadata[plan]", plan || "pro");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) throw new Error(session.error?.message || "Stripe checkout failed");

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
