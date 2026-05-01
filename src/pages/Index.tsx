import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Cpu, Factory, CheckCircle2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilamentSpool3D from "@/components/FilamentSpool3D";
import { track } from "@/lib/analytics";

const features = [
  { icon: Layers, title: "Material comparison", desc: "Side-by-side specs for PLA, ABS, PETG, TPU, Nylon and more." },
  { icon: Sparkles, title: "Smart selector tool", desc: "Answer 5 quick questions and get a tailored recommendation." },
  { icon: Factory, title: "Industry use cases", desc: "From rapid prototyping to outdoor enclosures — covered." },
];

const steps = [
  { n: "01", title: "Tell us your project", desc: "Describe your part — strength, heat, flexibility, budget." },
  { n: "02", title: "We match the material", desc: "Our guided logic narrows down the best filament for the job." },
  { n: "03", title: "Print with confidence", desc: "Get pros, cons, and tips before you load the spool." },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container-tight pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
              <Sparkles className="size-3.5" /> Updated for 2025 materials
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Find the perfect <span className="text-gradient">3D printing filament</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              An interactive guide that recommends the right material based on your project's strength,
              flexibility, heat and budget needs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-lift">
                <Link to="/selector" onClick={() => track("cta_click", { cta: "hero_selector" })}>
                  Start Selecting <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/compare" onClick={() => track("cta_click", { cta: "hero_compare" })}>
                  <Scale className="size-4 mr-1" /> Compare materials
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> 6+ materials</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> 60-second quiz</div>
            </div>
          </div>

          <FilamentSpool3D />
        </div>
      </section>

      {/* Features */}
      <section className="container-tight py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Everything you need to choose right</h2>
          <p className="mt-4 text-muted-foreground">Stop guessing. Start printing parts that perform.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group p-7 rounded-2xl bg-card border border-border shadow-elegant hover:shadow-lift transition-all hover:-translate-y-1">
              <div className="size-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-5 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-soft border-y border-border">
        <div className="container-tight py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-muted-foreground">Three steps from question to confident choice.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative p-7 rounded-2xl bg-card border border-border">
                <div className="font-display text-5xl font-bold text-gradient mb-4">{s.n}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-tight py-20 md:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 md:p-16 text-center shadow-lift">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
          <div className="relative">
            <Cpu className="size-10 mx-auto text-primary-foreground mb-5" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to find your filament?
            </h2>
            <p className="mt-4 text-primary-foreground/85 max-w-lg mx-auto">
              Get a personalized recommendation in under a minute. No signup required.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 shadow-lift">
              <Link to="/selector">Try the selector <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
