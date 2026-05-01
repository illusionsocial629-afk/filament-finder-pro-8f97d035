import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const FloatingSelectorButton = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/selector")) return null;
  return (
    <Link
      to="/selector"
      className="md:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-primary text-primary-foreground shadow-lift active:scale-95 transition-transform"
      aria-label="Open filament selector"
    >
      <Sparkles className="size-4" /> <span className="text-sm font-medium">Selector</span>
    </Link>
  );
};
