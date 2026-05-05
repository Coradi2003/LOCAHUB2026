import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 py-12">
      <div className="container">
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <img src="/logo.png" alt="LokaHub Logo" className="h-20 w-auto" />
            <p className="text-sm text-muted-foreground">Conectando você à locação perfeita.</p>
          </div>
          
          <nav className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground font-medium">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/produtos" className="hover:text-foreground transition-colors">Produtos</Link>
            <Link to="/login-locador" className="hover:text-foreground transition-colors">Área do Locador</Link>
          </nav>

          <div className="pt-8 border-t border-border/50 text-xs text-muted-foreground">
            © {new Date().getFullYear()} LokaHub. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
