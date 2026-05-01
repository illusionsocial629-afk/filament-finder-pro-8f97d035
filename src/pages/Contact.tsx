import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { track } from "@/lib/analytics";
import { FILAMENTS } from "@/lib/filaments";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  selected_filament: z.string().max(50).optional(),
  use_case: z.string().max(80).optional(),
});

const Contact = () => {
  const [params] = useSearchParams();
  const presetMaterial = params.get("material") ?? "";
  const presetUseCase = params.get("useCase") ?? "";

  const [form, setForm] = useState({
    name: "", email: "", message: "",
    selected_filament: presetMaterial,
    use_case: presetUseCase,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { document.title = "Contact — Filora"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      selected_filament: parsed.data.selected_filament || null,
      use_case: parsed.data.use_case || null,
      source: presetMaterial ? "selector" : "contact_page",
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    track("contact_submitted", { material: parsed.data.selected_filament });
    // Best-effort email notification (only works if function is deployed + env set)
    supabase.functions.invoke("send-contact-notification", { body: parsed.data }).catch(() => {});
    setDone(true);
    setBusy(false);
  };

  if (done) {
    return (
      <div className="container-tight py-24 max-w-xl text-center reveal">
        <div className="size-14 rounded-full bg-accent text-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Message received</h1>
        <p className="mt-3 text-muted-foreground">We'll get back to you within 1–2 business days.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/selector">Try the selector</Link></Button>
          <Button asChild className="bg-gradient-primary"><Link to="/">Back to home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-16 md:py-20 max-w-2xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
        <MessageCircle className="size-3.5" /> Talk to us
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
      <p className="mt-3 text-muted-foreground">Tell us about your project. If you came from the selector, we've prefilled what we know.</p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Maker" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label>Selected material</Label>
            <select
              value={form.selected_filament}
              onChange={(e) => setForm((f) => ({ ...f, selected_filament: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {Object.values(FILAMENTS).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Use case</Label>
            <Input value={form.use_case} onChange={(e) => setForm((f) => ({ ...f, use_case: e.target.value }))} placeholder="e.g. outdoor enclosure" />
          </div>
        </div>

        <div>
          <Label>Message</Label>
          <Textarea rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Tell us about your part, batch size, and any constraints…" />
        </div>

        <Button type="submit" disabled={busy} className="bg-gradient-primary">
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
};

export default Contact;
