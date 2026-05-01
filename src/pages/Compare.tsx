import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FILAMENTS, Filament } from "@/lib/filaments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Plus, X, ArrowLeft } from "lucide-react";
import { track } from "@/lib/analytics";

const ALL = Object.values(FILAMENTS);

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

const Compare = () => {
  const [params, setParams] = useSearchParams();
  const initial = (params.get("ids") ?? "").split(",").filter((id) => id in FILAMENTS);
  const [selected, setSelected] = useState<string[]>(initial.length ? initial.slice(0, 3) : ["PLA", "PETG"]);

  useEffect(() => {
    document.title = "Compare filaments — Filora";
    track("comparison_viewed", { ids: selected });
  }, []); // eslint-disable-line

  useEffect(() => { setParams({ ids: selected.join(",") }, { replace: true }); }, [selected]); // eslint-disable-line

  const toggle = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]);
  };

  const items: Filament[] = useMemo(() => selected.map((id) => FILAMENTS[id]).filter(Boolean), [selected]);

  return (
    <div className="container-tight py-12 md:py-20">
      <Link to="/selector" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to selector
      </Link>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Compare materials</h1>
      <p className="mt-3 text-muted-foreground">Pick 2–3 filaments to see them side-by-side.</p>

      {/* Picker */}
      <div className="flex flex-wrap gap-2 mt-8">
        {ALL.map((f) => {
          const active = selected.includes(f.id);
          const disabled = !active && selected.length >= 3;
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all",
                active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card hover:border-primary/50",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {f.name}
            </button>
          );
        })}
      </div>

      {/* Side by side */}
      <div className={cn("grid gap-5 mt-10", items.length === 2 ? "md:grid-cols-2" : items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-1")}>
        {items.map((f) => (
          <div key={f.id} className="rounded-2xl border border-border bg-card p-6 hover:shadow-lift transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-2xl font-bold">{f.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.tagline}</p>
              </div>
              <button onClick={() => toggle(f.id)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="size-4" /></button>
            </div>
            <div className="space-y-3 mt-6">
              <RatingBar label="Strength" value={f.ratings.strength} />
              <RatingBar label="Flexibility" value={f.ratings.flexibility} />
              <RatingBar label="Heat resistance" value={f.ratings.heat} />
              <RatingBar label="Ease of printing" value={f.ratings.ease} />
              <RatingBar label="UV / outdoor" value={f.ratings.uv} />
              <RatingBar label="Cost (1=cheap)" value={f.ratings.cost} />
            </div>
            <div className="mt-6 pt-5 border-t border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Best for</h4>
              <div className="flex flex-wrap gap-1.5">
                {f.bestFor.map((b) => <span key={b} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{b}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length < 2 && (
        <div className="mt-10 p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground">
          Pick at least 2 filaments to compare.
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild className="bg-gradient-primary"><Link to="/selector">Find your match</Link></Button>
        <Button asChild variant="outline"><Link to="/contact">Talk to us about a project</Link></Button>
      </div>
    </div>
  );
};

export default Compare;
