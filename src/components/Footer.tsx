import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-8">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Esquerda: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="LokaHub" className="h-12 w-auto" />
            </Link>
          </div>
          
          {/* Centro: Copyright */}
          <div className="flex-1 flex justify-center order-3 md:order-2">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              © {new Date().getFullYear()} LokaHub. Todos os direitos reservados.
            </p>
          </div>
          
          {/* Direita: Links */}
          <div className="flex-1 flex justify-end order-2 md:order-3">
            <nav className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
              <Link to="/login-locador" className="hover:text-primary transition-colors whitespace-nowrap">Área do Locador</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
