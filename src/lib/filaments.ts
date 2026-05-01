export type Filament = {
  id: string;
  name: string;
  tagline: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  /** HSL color string for the 3D spool visualization */
  color: string;
  /** 1-5 ratings used by selector + comparison tools */
  ratings: {
    strength: number;     // tensile / impact
    flexibility: number;  // 1 rigid, 5 rubber
    heat: number;         // heat deflection
    ease: number;         // ease of printing
    cost: number;         // 1 cheap, 5 premium
    uv: number;           // UV/outdoor durability
  };
  /** Short blog slug suggestion (auto-link if matching slug exists) */
  guideSlug?: string;
  /** When NOT to use this material */
  avoidWhen: string[];
};

export const FILAMENTS: Record<string, Filament> = {
  PLA: {
    id: "PLA", name: "PLA",
    tagline: "Easy to print, biodegradable, perfect for prototypes and decorative parts.",
    pros: ["Beginner friendly", "Low odor", "Wide color range", "Affordable"],
    cons: ["Low heat resistance (~60°C)", "Brittle under stress"],
    bestFor: ["Prototypes", "Decorative models", "Cosplay props"],
    avoidWhen: ["Part is exposed to sun or heat", "Mechanical load is heavy", "Used outdoors long term"],
    color: "hsl(214, 95%, 55%)",
    ratings: { strength: 2, flexibility: 1, heat: 1, ease: 5, cost: 1, uv: 1 },
    guideSlug: "pla-guide",
  },
  PETG: {
    id: "PETG", name: "PETG",
    tagline: "Tough, food-safe, great balance of strength and ease of use.",
    pros: ["Impact resistant", "Chemical resistant", "Good layer adhesion"],
    cons: ["Stringing prone", "Sticky on bed"],
    bestFor: ["Functional parts", "Outdoor use", "Mechanical brackets"],
    avoidWhen: ["You need very high temperature resistance", "You print fine miniature detail"],
    color: "hsl(160, 70%, 45%)",
    ratings: { strength: 4, flexibility: 2, heat: 3, ease: 4, cost: 2, uv: 3 },
    guideSlug: "petg-vs-pla",
  },
  ABS: {
    id: "ABS", name: "ABS",
    tagline: "Strong, heat-resistant, great for engineering parts.",
    pros: ["High heat tolerance (~100°C)", "Tough & durable", "Post-process with acetone"],
    cons: ["Warps easily", "Fumes — needs ventilation"],
    bestFor: ["Automotive parts", "Enclosures", "Tools"],
    avoidWhen: ["No enclosure or ventilation", "Outdoor parts (use ASA)"],
    color: "hsl(0, 0%, 18%)",
    ratings: { strength: 4, flexibility: 2, heat: 4, ease: 2, cost: 2, uv: 2 },
    guideSlug: "abs-printing-tips",
  },
  TPU: {
    id: "TPU", name: "TPU",
    tagline: "Flexible rubber-like filament for soft, bendable parts.",
    pros: ["Highly flexible", "Abrasion resistant", "Vibration dampening"],
    cons: ["Slow to print", "Tricky with bowden setups"],
    bestFor: ["Phone cases", "Gaskets", "Wheels & grips"],
    avoidWhen: ["Part must hold rigid load-bearing shape", "Fast print times required"],
    color: "hsl(340, 80%, 55%)",
    ratings: { strength: 3, flexibility: 5, heat: 2, ease: 2, cost: 3, uv: 3 },
    guideSlug: "printing-flexible-tpu",
  },
  Nylon: {
    id: "Nylon", name: "Nylon",
    tagline: "Engineering-grade material with high strength and durability.",
    pros: ["Excellent toughness", "Wear resistant", "Good chemical resistance"],
    cons: ["Hygroscopic — needs drying", "Higher temps required"],
    bestFor: ["Gears", "Living hinges", "Industrial tooling"],
    avoidWhen: ["You can't dry filament before printing", "Tight budget"],
    color: "hsl(45, 30%, 88%)",
    ratings: { strength: 5, flexibility: 3, heat: 4, ease: 2, cost: 4, uv: 3 },
    guideSlug: "nylon-engineering",
  },
  ASA: {
    id: "ASA", name: "ASA",
    tagline: "UV-resistant cousin of ABS, ideal for outdoor functional parts.",
    pros: ["UV stable", "Weather resistant", "Strong & rigid"],
    cons: ["Warps", "Needs enclosure"],
    bestFor: ["Outdoor signage", "Automotive exterior", "Garden mounts"],
    avoidWhen: ["Beginner with no enclosure", "Indoor decorative use only"],
    color: "hsl(25, 90%, 55%)",
    ratings: { strength: 4, flexibility: 2, heat: 4, ease: 2, cost: 3, uv: 5 },
    guideSlug: "asa-outdoor",
  },
};

export type Answers = {
  useCase?: "prototype" | "functional" | "decorative" | "flexible" | "outdoor";
  strength?: "low" | "medium" | "high";
  flexibility?: "rigid" | "semi" | "flexible";
  heat?: "low" | "medium" | "high";
  ease?: "easy" | "any" | "advanced";
  budget?: "low" | "medium" | "high";
};

const LEVEL: Record<string, number> = { low: 1, medium: 3, high: 5, easy: 5, any: 3, advanced: 1, rigid: 1, semi: 3, flexible: 5 };

export type ScoredFilament = {
  filament: Filament;
  score: number;     // 0..100
  match: number;     // % match for UI
  reasons: string[]; // human reasons
};

export type Recommendation = {
  primary: ScoredFilament;
  alternatives: ScoredFilament[];
  summary: string;
};

/** Weighted scoring across all filaments. Returns primary + 2 alternatives. */
export function recommend(a: Answers): Recommendation {
  const wantStrength = a.strength ? LEVEL[a.strength] : 3;
  const wantFlex = a.flexibility ? LEVEL[a.flexibility] : 1;
  const wantHeat = a.heat ? LEVEL[a.heat] : 1;
  const wantEase = a.ease ? LEVEL[a.ease] : 4;
  const wantUv = a.useCase === "outdoor" ? 5 : 1;
  // Lower budget value = wants cheaper. Cost rating is 1 cheap → 5 premium.
  // Penalty if material cost rating exceeds budget tolerance.
  const budgetTolerance = a.budget ? LEVEL[a.budget] : 3;

  const W = { strength: 22, flexibility: 18, heat: 18, ease: 12, uv: 18, budget: 12 };

  const scored = Object.values(FILAMENTS).map<ScoredFilament>((f) => {
    const r = f.ratings;
    const dist = (want: number, got: number) => 1 - Math.abs(want - got) / 4; // 0..1
    const meets = (want: number, got: number) => (got >= want ? 1 : 1 - (want - got) / 4);
    const budgetFit = r.cost <= budgetTolerance ? 1 : 1 - (r.cost - budgetTolerance) / 4;

    const sStrength = meets(wantStrength, r.strength);
    const sFlex = dist(wantFlex, r.flexibility);
    const sHeat = meets(wantHeat, r.heat);
    const sEase = meets(wantEase, r.ease);
    const sUv = meets(wantUv, r.uv);

    let score =
      W.strength * sStrength +
      W.flexibility * sFlex +
      W.heat * sHeat +
      W.ease * sEase +
      W.uv * sUv +
      W.budget * budgetFit;

    // Hard nudges based on intent
    if (a.flexibility === "flexible" && f.id === "TPU") score += 12;
    if (a.useCase === "outdoor" && f.id === "ASA") score += 8;
    if (a.useCase === "decorative" && f.id === "PLA") score += 4;

    score = Math.max(0, Math.min(100, score));

    const reasons: string[] = [];
    if (sStrength >= 0.9 && wantStrength >= 4) reasons.push("matches your strength requirement");
    if (sFlex >= 0.9) reasons.push("flexibility profile aligns with your need");
    if (sHeat >= 0.9 && wantHeat >= 4) reasons.push("handles your heat exposure");
    if (sEase >= 0.9 && wantEase >= 4) reasons.push("easy to print");
    if (sUv >= 0.9 && wantUv >= 4) reasons.push("UV stable for outdoor use");
    if (budgetFit >= 0.9 && budgetTolerance <= 2) reasons.push("fits a tight budget");
    if (reasons.length === 0) reasons.push("best overall balance for your inputs");

    return { filament: f, score, match: Math.round(score), reasons };
  });

  scored.sort((x, y) => y.score - x.score);
  const [primary, ...rest] = scored;
  const summary = `Recommended because it ${primary.reasons.slice(0, 2).join(" and ")}.`;
  return { primary, alternatives: rest.slice(0, 2), summary };
}

/** Encode/decode answers in URL hash for sharing without DB. */
export function encodeAnswers(a: Answers): string {
  const json = JSON.stringify(a);
  return btoa(unescape(encodeURIComponent(json)));
}
export function decodeAnswers(s: string): Answers | null {
  try {
    const json = decodeURIComponent(escape(atob(s)));
    return JSON.parse(json) as Answers;
  } catch {
    return null;
  }
}
