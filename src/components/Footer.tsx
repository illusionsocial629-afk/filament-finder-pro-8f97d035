import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-24 bg-gradient-soft">
      <div className="container-tight py-5 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} AmorphousIndia. All rights reserved.</span>
        <span>Made for makers.</span>
      </div>
    </footer>
  );
};