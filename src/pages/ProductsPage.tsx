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
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1 pt-20 pb-10">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <ScrollReveal>
              <div className="space-y-2">
                <h1 className="text-4xl font-display font-bold tracking-tight">
                  Explorar <span className="text-gradient">Locações</span>
                </h1>
                <p className="text-muted-foreground">Encontre o que você precisa em um só lugar.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={60}>
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Buscar equipamentos..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Categories filter */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap gap-2 mb-12">
              <button
                onClick={() => handleCatClick("")}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all active:scale-[0.96] ${
                  selectedCat === ""
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                Todos
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCatClick(cat)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all active:scale-[0.96] ${
                    selectedCat === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
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
