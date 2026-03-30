import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
          <span className="text-2xl font-bold font-display text-gradient">LokaHub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/produtos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Produtos</Link>
          <Link to="/login-locador" className="text-sm font-medium bg-gradient-party text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity active:scale-[0.97]">
            Login Locador
          </Link>
        </nav>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground" aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-fade-up">
          <nav className="container flex flex-col gap-4 py-4">
            <Link to="/" onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-sm text-muted-foreground">Home</Link>
            <Link to="/produtos" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Produtos</Link>
            <Link to="/login-locador" onClick={() => setOpen(false)} className="text-sm font-medium bg-gradient-party text-primary-foreground px-4 py-2 rounded-lg text-center">
              Login Locador
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
