import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { to: "/", label: "Home" },
  { to: "/selector", label: "Selector" },
  { to: "/compare", label: "Compare" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
      )}
    >
      <nav className="container-tight flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <img 
  src="/logo.png" 
  alt="Amorphous India Logo" 
  className="size-10 rounded-lg shadow-glow object-cover group-hover:scale-105 transition-transform" 
/>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">Amorphous Guide</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" onClick={() => navigate("/selector")} className="bg-gradient-primary hover:opacity-90 transition">
            Start Selecting
          </Button>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container-tight py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Button onClick={() => { setOpen(false); navigate("/selector"); }} className="bg-gradient-primary mt-2">
              Start Selecting
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
