import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { FloatingSelectorButton } from "./FloatingSelectorButton";
import { initTheme } from "./ThemeToggle";

export const Layout = () => {
  useEffect(() => { initTheme(); }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
      <FloatingSelectorButton />
    </div>
  );
};
