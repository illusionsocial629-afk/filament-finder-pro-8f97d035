import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, XCircle, Share2, FileText, MessageCircle, Scale, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Answers, recommend, decodeAnswers, encodeAnswers, ScoredFilament } from "@/lib/filaments";
import FilamentSpool3D from "@/components/FilamentSpool3D";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

const RatingBar = ({ label, value, max = 5 }: { label: string; value: number; max?: number }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-gradient-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

type Q = {
  key: keyof Answers;
  title: string;
  subtitle?: string;
  options: { value: string; label: string; desc?: string }[];
};

const QUESTIONS: Q[] = [
  {
    key: "useCase",
    title: "What are you printing?",
    subtitle: "Pick the closest match.",
    options: [
      { value: "prototype", label: "Prototype", desc: "Quick iteration, form-only" },
      { value: "functional", label: "Functional part", desc: "Actually used in service" },
      { value: "decorative", label: "Decorative model", desc: "Display, art, cosplay" },
      { value: "flexible", label: "Flexible part", desc: "Bends, stretches, dampens" },
      { value: "outdoor", label: "Outdoor use", desc: "Sun, rain, weather exposure" },
    ],
  },
  { key: "strength", title: "How strong does it need to be?", options: [
    { value: "low", label: "Low", desc: "Looks > load" },
    { value: "medium", label: "Medium", desc: "Everyday use" },
    { value: "high", label: "High", desc: "Mechanical stress" },
  ]},
  { key: "flexibility", title: "How flexible should it be?", options: [
    { value: "rigid", label: "Rigid", desc: "Holds its shape" },
    { value: "semi", label: "Slightly flexible" },
    { value: "flexible", label: "Very flexible", desc: "Rubber-like" },
  ]},
  { key: "heat", title: "Heat exposure?", options: [
    { value: "low", label: "Indoors", desc: "Below 50°C" },
    { value: "medium", label: "Warm", desc: "50–80°C" },
    { value: "high", label: "Hot", desc: "Above 80°C / engine bay" },
  ]},
  { key: "ease", title: "Ease of printing matters?", options: [
    { value: "easy", label: "Beginner friendly", desc: "I want it simple" },
    { value: "any", label: "I'm okay either way" },
    { value: "advanced", label: "I can dial it in", desc: "Enclosure, drying, etc." },
  ]},
  { key: "budget", title: "Budget?", options: [
    { value: "low", label: "Tight", desc: "Cheapest possible" },
    { value: "medium", label: "Standard", desc: "Best value" },
    { value: "high", label: "Premium", desc: "Performance > price" },
  ]},
];

const RatingsCard = ({ s }: { s: ScoredFilament }) => (
  <div className="space-y-3">
    <RatingBar label="Strength" value={s.filament.ratings.strength} />
    <RatingBar label="Flexibility" value={s.filament.ratings.flexibility} />
    <RatingBar label="Heat resistance" value={s.filament.ratings.heat} />
    <RatingBar label="Ease of printing" value={s.filament.ratings.ease} />
    <RatingBar label="UV / outdoor" value={s.filament.ratings.uv} />
    <RatingBar label="Cost (1=cheap)" value={s.filament.ratings.cost} />
  </div>
);

const Selector = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("a") ? decodeAnswers(params.get("a")!) ?? {} : {};
  const [answers, setAnswers] = useState<Answers>(initial);
  const [step, setStep] = useState(Object.keys(initial).length >= QUESTIONS.length ? QUESTIONS.length : 0);
  const done = step >= QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  useEffect(() => { if (step === 0 && !params.get("a")) track("selector_started"); }, []); // eslint-disable-line

  const select = (val: string) => {
    setAnswers((a) => {
      const next = { ...a, [current.key]: val as never };
      track("selector_step", { step: current.key, value: val });
      return next;
    });
    setTimeout(() => setStep((s) => s + 1), 180);
  };

  const reset = () => { setAnswers({}); setStep(0); setParams({}); };

  const rec = useMemo(() => done ? recommend(answers) : null, [answers, done]);

  useEffect(() => {
    if (done && rec) {
      track("selector_completed", { answers });
      track("recommendation_shown", { primary: rec.primary.filament.id, match: rec.primary.match });
      // sync share param
      setParams({ a: encodeAnswers(answers) }, { replace: true });
    }
  }, [done, rec]); // eslint-disable-line

  if (done && rec) {
    const r = rec.primary;
    const f = r.filament;
    const shareUrl = `${window.location.origin}/selector?a=${encodeAnswers(answers)}`;
    const copyShare = async () => {
      await navigator.clipboard.writeText(shareUrl);
      track("share_link_created", { primary: f.id });
      toast.success("Share link copied!");
    };

    return (
      <div className="container-tight py-12 md:py-20">
        <div className="max-w-5xl mx-auto reveal space-y-10">
          {/* Hero result */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
              <CheckCircle2 className="size-3.5" /> Recommendation ready
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold mb-4">
                  <Sparkles className="size-3" /> {r.match}% Match
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold">Try <span className="text-gradient">{f.name}</span></h1>
                <p className="mt-4 text-lg text-muted-foreground">{f.tagline}</p>
                <p className="mt-3 text-sm text-foreground/80">{rec.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={copyShare} variant="outline" size="sm"><Share2 className="size-4 mr-1" /> Share</Button>
                  <Button asChild size="sm" variant="outline"><Link to={`/compare?ids=${f.id},${rec.alternatives.map(a=>a.filament.id).join(",")}`} onClick={() => track("cta_click", { cta: "compare", from: "result" })}><Scale className="size-4 mr-1" />Compare materials</Link></Button>
                  <Button asChild size="sm" className="bg-gradient-primary"><Link to={`/contact?material=${f.id}&useCase=${answers.useCase ?? ""}`} onClick={() => track("cta_click", { cta: "contact", from: "result" })}><MessageCircle className="size-4 mr-1" />Contact for project</Link></Button>
                </div>
              </div>
              <FilamentSpool3D color={f.color} className="w-full aspect-square max-w-[360px] mx-auto" />
            </div>
          </div>

          {/* Property bars + pros/cons */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-display font-semibold mb-4">Properties</h3>
              <RatingsCard s={r} />
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Why this material</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {f.pros.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><XCircle className="size-4 text-destructive" /> When NOT to use</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {f.avoidWhen.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          </div>

          {/* Alternatives */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">Also consider</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {rec.alternatives.map((alt) => (
                <div key={alt.filament.id} className="p-6 rounded-2xl border border-border bg-card hover:shadow-lift transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-semibold text-lg">{alt.filament.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">{alt.match}% match</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{alt.filament.tagline}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alt.filament.bestFor.slice(0,3).map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{b}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart CTA + related guide */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-soft border border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-2"><Lightbulb className="size-4 text-primary" /> Need help sourcing this material?</div>
              <p className="text-sm text-muted-foreground mb-4">Our team can advise on grade, color, and supplier for {f.name}.</p>
              <Button asChild size="sm" className="bg-gradient-primary"><Link to={`/contact?material=${f.id}`}>Get sourcing advice</Link></Button>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 text-sm font-medium mb-2"><FileText className="size-4 text-primary" /> Compare {f.name} vs alternatives</div>
              <p className="text-sm text-muted-foreground mb-4">See how it stacks up against other materials side-by-side.</p>
              <Button asChild size="sm" variant="outline"><Link to="/compare">Compare materials</Link></Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={reset} variant="outline"><RotateCcw className="size-4 mr-1" /> Start over</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1 disabled:opacity-30 hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <span>Step {step + 1} of {QUESTIONS.length}</span>
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-10">
          <div
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div key={step} className="reveal">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{current.title}</h2>
          {current.subtitle && <p className="mt-3 text-muted-foreground">{current.subtitle}</p>}

          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {current.options.map((opt) => {
              const active = answers[current.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => select(opt.value)}
                  className={cn(
                    "text-left p-5 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-elegant",
                    active ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="font-display font-semibold flex items-center justify-between">
                    {opt.label}
                    {active && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  {opt.desc && <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>}
                </button>
              );
            })}
          </div>

          {answers[current.key] && (
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep((s) => s + 1)} className="bg-gradient-primary">
                Continue <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Selector;
