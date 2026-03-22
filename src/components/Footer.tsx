import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-bold font-display text-gradient">LocaHub</span>
            <p className="text-sm text-muted-foreground mt-1">Conectando você à diversão perfeita.</p>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/produtos" className="hover:text-foreground transition-colors">Produtos</Link>
            <Link to="/login-locador" className="hover:text-foreground transition-colors">Área do Locador</Link>
          </nav>
        </div>
        <div className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} LocaHub. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
