import { Link } from "react-router-dom";
// Force-redeploy to trigger Vercel build after Hero redesign
import { Search, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/data";
import { useProducts, useLandlords } from "@/hooks/use-data";

const STEPS = [
  { icon: Search, title: "Encontre", desc: "Busque o produto ideal para seu evento nos filtros por categoria e região." },
  { icon: Shield, title: "Preencha", desc: "Envie seus dados com segurança para liberar o contato do locador." },
  { icon: Zap, title: "Alugue", desc: "Fale direto pelo WhatsApp e feche o aluguel de forma rápida e prática." },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  
  // Usa hooks com cache compartilhado - evita requests duplicados
  const { data: products = [] } = useProducts();
  const { data: landlords = [] } = useLandlords();

  const featured = products.filter(p => p.isFeatured).slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/produtos?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Redesign */}
      <section className="relative min-h-[650px] lg:min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0">
          <img 
            src="/hero-bg.png" 
            alt="Event background" 
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>
        
        {/* Decorative Blobs */}
        <div className="absolute top-1/4 -left-20 w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[35vw] h-[35vw] bg-accent/20 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative container max-w-6xl text-center space-y-10 pt-12 md:pt-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-primary-foreground/90 text-xs md:text-sm font-medium animate-fade-up">
            <Sparkles size={14} className="text-primary" />
            <span className="tracking-wider">PLATAFORMA #1 DE LOCAÇÃO PARA EVENTOS</span>
          </div>

          <div className="space-y-6">
            <h1
              className="text-5xl sm:text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tighter opacity-0 animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Tudo para <br />
              <span className="text-gradient drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]">locação</span>{' '}
              em um só lugar
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-up leading-relaxed"
              style={{ animationDelay: "200ms" }}
            >
              Encontre camas elásticas, infláveis, mesas de jogos e muito mais. 
              Conecte-se aos melhores locadores da sua região.
            </p>
          </div>

          {/* Glass Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col sm:flex-row gap-2 opacity-0 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="O que você precisa para seu evento?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-lg"
              />
            </div>
            <button
              type="submit"
              className="h-14 px-10 rounded-xl bg-gradient-party text-white font-bold text-lg hover:shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all active:scale-[0.98] group shrink-0"
            >
              <span className="flex items-center justify-center gap-2">
                Buscar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </form>

          {/* Trust Indicators */}
          <div
            className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 opacity-0 animate-fade-up pt-4"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
              <Shield size={16} className="text-primary" />
              Segurança Garantida
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
              <Zap size={16} className="text-primary" />
              Aluguel Rápido
            </div>
            <Link
              to="/produtos"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos os detalhes <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 surface-elevated">
        <div className="container">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-display font-bold">
                Produtos em <span className="text-gradient">Destaque</span>
              </h2>
              <Link to="/produtos" className="text-sm text-primary hover:underline hidden sm:inline">
                Ver todos →
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 80}>
                <ProductCard
                  product={p}
                  landlord={landlords.find(l => l.id === p.landlordId)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Categorias em <span className="text-gradient">Destaque</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={cat} delay={i * 60}>
                <Link
                  to={`/produtos?cat=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_24px_hsl(270_80%_60%/0.1)] active:scale-[0.97]"
                >
                  <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-sm font-medium text-card-foreground text-center group-hover:text-primary transition-colors">
                    {cat}
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="text-3xl font-display font-bold text-center mb-16">
              Como <span className="text-gradient">Funciona</span>
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="text-center space-y-4 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-party flex items-center justify-center mx-auto">
                    <step.icon size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <ScrollReveal>
            <div className="relative rounded-2xl overflow-hidden p-12 md:p-16 text-center bg-gradient-party">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Pronto para alugar?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Encontre tudo o que precisa para fazer sua festa ou evento acontecer.
              </p>
              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-background text-foreground font-semibold hover:bg-background/90 transition-colors active:scale-[0.97]"
              >
                Explorar Produtos <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
