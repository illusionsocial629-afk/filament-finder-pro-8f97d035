const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const NOTIFY_TO = Deno.env.get("CONTACT_NOTIFY_TO") ?? "";
const SENDER_DOMAIN = Deno.env.get("SENDER_DOMAIN") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { name, email, message, selected_filament, use_case } = body ?? {};

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!NOTIFY_TO || !SENDER_DOMAIN) {
      // Email not configured yet — silently succeed; submission is still in DB
      return new Response(JSON.stringify({ ok: true, emailed: false, reason: "email_not_configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lovable Email API
    const callbackUrl = "https://api.lovable.dev/email/send";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: true, emailed: false, reason: "no_api_key" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <h2>New contact submission</h2>
      <p><strong>${name}</strong> &lt;${email}&gt;</p>
      ${selected_filament ? `<p>Material: <strong>${selected_filament}</strong></p>` : ""}
      ${use_case ? `<p>Use case: ${use_case}</p>` : ""}
      <p style="white-space:pre-wrap">${message}</p>
    `;

    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `Filora <notify@${SENDER_DOMAIN}>`,
        to: [NOTIFY_TO],
        reply_to: email,
        subject: `New contact: ${name}${selected_filament ? ` (${selected_filament})` : ""}`,
        html,
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
