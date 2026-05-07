import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, Upload, X, FileIcon } from "lucide-react";
import { track } from "@/lib/analytics";
import { FILAMENTS } from "@/lib/filaments";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  selected_filament: z.string().max(50).optional(),
  use_case: z.string().max(80).optional(),
});

const ALLOWED_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "doc", "docx", "zip", "rar",
  "stl", "obj", "3mf", "amf",
  "step", "stp", "iges", "igs",
  "x_t", "x_b", "sat",
  "sldprt", "sldasm",
  "ipt", "f3d",
  "catpart", "catproduct",
  "dwg", "dxf",
  "ply", "glb", "gltf", "fbx",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const getExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;

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
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Contact — Filora"; }, []);

  const validateFile = (f: File): string | null => {
    const ext = getExt(f.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `Unsupported file type: .${ext}`;
    if (f.size > MAX_FILE_SIZE) return `File too large (max 15MB). Selected: ${formatBytes(f.size)}`;
    return null;
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) { toast.error(err); return; }
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);

    let file_url: string | null = null;
    try {
      if (file) {
        const ext = getExt(file.name);
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("project-files")
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("project-files").getPublicUrl(path);
        file_url = pub.publicUrl;
      }

      const insertPayload = {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        selected_filament: parsed.data.selected_filament || null,
        use_case: parsed.data.use_case || null,
        source: presetMaterial ? "selector" : "contact_page",
        file_url,
      };
      const { error } = await supabase.from("contact_submissions").insert(insertPayload);
      if (error) throw new Error(error.message);

      track("contact_submitted", { material: parsed.data.selected_filament, has_file: !!file_url });
      supabase.functions.invoke("send-contact-notification", {
        body: { ...parsed.data, file_url },
      }).catch(() => {});
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container-tight py-24 max-w-xl text-center reveal">
        <div className="size-14 rounded-full bg-accent text-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Thank you for your enquiry!</h1>
        <p className="mt-3 text-muted-foreground">
          We've received your project details and will get back to you shortly with a customized quote.
        </p>
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
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <a href="https://amorphousindia.com" target="_blank" rel="noopener noreferrer">← Back to amorphousindia.com</a>
        </Button>
      </div>

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

        <div>
          <Label>Attach project file (optional)</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-2 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? "border-primary bg-accent/40" : "border-input hover:border-primary/50 hover:bg-accent/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="size-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="rounded-full p-1 hover:bg-muted"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Upload className="size-6" />
                <div><span className="font-medium text-foreground">Click to upload</span> or drag & drop</div>
                <div className="text-xs">CAD, 3D models, PDFs, images — up to 15MB</div>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={busy} className="bg-gradient-primary">
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
};

export default Contact;
