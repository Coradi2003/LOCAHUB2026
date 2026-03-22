import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store } from "@/lib/data";

export default function LandlordLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userId, error: signInError } = await store.signIn(email, password);
    if (signInError || !userId) { 
      setError(signInError || "Erro ao fazer login."); 
      return; 
    }
    
    store.setLandlordSession(userId);
    navigate("/painel-locador");
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="pt-24 pb-16">
        <div className="container max-w-md">
          <ScrollReveal>
            <h1 className="text-3xl font-display font-bold text-center mb-2">
              Login do <span className="text-gradient">Locador</span>
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">Acesse seu painel.</p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button type="submit" className="w-full h-11 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]">
                Entrar
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Não tem conta? <Link to="/cadastro-locador" className="text-primary hover:underline">Cadastre-se</Link>
              </p>
            </form>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
