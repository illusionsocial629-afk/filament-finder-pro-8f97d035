import { ExternalLink } from "lucide-react";

export const FloatingBackToSiteButton = () => {
  return (
    <a
      href="https://amorphousindia.com"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-card border border-border text-foreground shadow-lift hover:bg-accent active:scale-95 transition-all"
      aria-label="Back to amorphousindia.com"
    >
      <ExternalLink className="size-4" />
      <span className="text-sm font-medium">Back to Amorphous India</span>
    </a>
  );
};
