import { Link } from "react-router-dom";
import { Search, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import heroTrampoline from "@/assets/hero-trampoline.png";
import heroBilhar from "@/assets/hero-bilhar.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store, type Product, CATEGORIES, CATEGORY_ICONS } from "@/lib/data";

const STEPS = [
  { icon: Search, title: "Encontre", desc: "Busque o produto ideal para seu evento nos filtros por categoria e região." },
  { icon: Shield, title: "Preencha", desc: "Envie seus dados com segurança para liberar o contato do locador." },
  { icon: Zap, title: "Alugue", desc: "Fale direto pelo WhatsApp e feche o aluguel de forma rápida e prática." },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    store.getProducts().then(setProducts);
  }, []);

  const featured = products.filter(p => p.isFeatured).slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/produtos?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative min-h-[46vh] py-10 flex items-center justify-center overflow-hidden bg-slate-950 dark">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a15] via-[#0a0515] to-[#02050a]" />
        
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] min-w-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] min-w-[600px] bg-blue-600/20 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[15%] w-[35vw] h-[35vw] min-w-[400px] bg-cyan-500/15 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] left-[20%] w-[40vw] h-[40vw] min-w-[400px] bg-indigo-500/20 rounded-full blur-[110px] mix-blend-screen" />
        
        <div className="absolute inset-0 bg-background/5 backdrop-blur-3xl mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        {/* Decorative product images */}
        <img
          src={heroTrampoline}
          alt=""
          aria-hidden="true"
          className="absolute left-[-4%] bottom-[5%] w-[28vw] max-w-[380px] opacity-20 blur-[2px] pointer-events-none select-none hidden lg:block drop-shadow-[0_0_40px_hsl(270_80%_60%/0.4)]"
        />
        <img
          src={heroBilhar}
          alt=""
          aria-hidden="true"
          className="absolute right-[-2%] bottom-[2%] w-[26vw] max-w-[360px] opacity-20 blur-[2px] pointer-events-none select-none hidden lg:block drop-shadow-[0_0_40px_hsl(200_90%_50%/0.4)]"
        />

        <div className="relative container text-center space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium animate-fade-up">
            <Sparkles size={14} />
            Plataforma #1 de locação para eventos
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tight opacity-0 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            Tudo para sua{" "}
            <span className="text-gradient">festa</span>
            <br />em um só lugar
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Encontre camas elásticas, mesas de jogos, infláveis e muito mais.
            Conecte-se a locadores de confiança na sua região.
          </p>

          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto flex gap-2 opacity-0 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Buscar por produto, categoria..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              Buscar
            </button>
          </form>

          <div
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <Link
              to="/produtos"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todos os produtos <ArrowRight size={14} />
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
                <ProductCard product={p} />
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
