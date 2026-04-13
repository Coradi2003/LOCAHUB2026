import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CATEGORIES } from "@/lib/data";
import { useProducts, useLandlords } from "@/hooks/use-data";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const initialQ = searchParams.get("q") || "";

  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  
  // Usa hooks com cache compartilhado - evita requests duplicados
  const { data: products = [] } = useProducts();
  const { data: landlords = [] } = useLandlords();

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCat = !selectedCat || p.category === selectedCat;
      const matchesQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQ;
    });
  }, [products, selectedCat, query]);

  const handleCatClick = (cat: string) => {
    const next = selectedCat === cat ? "" : cat;
    setSelectedCat(next);
    const sp = new URLSearchParams(searchParams);
    if (next) sp.set("cat", next); else sp.delete("cat");
    setSearchParams(sp);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="pt-24 pb-16">
        <div className="container">
          <ScrollReveal>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
              Nossos <span className="text-gradient">Produtos</span>
            </h1>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={60}>
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </ScrollReveal>

          {/* Categories filter */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap gap-2 mb-10">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCatClick(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all active:scale-[0.96] ${
                    selectedCat === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum produto encontrado. Tente ajustar os filtros.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 60}>
                  <ProductCard
                    product={p}
                    landlord={landlords.find(l => l.id === p.landlordId)}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
