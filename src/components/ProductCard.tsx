import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { store, type Product, type Landlord } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const [landlord, setLandlord] = useState<Landlord | null>(null);

  useEffect(() => {
    store.getLandlords().then(lands => {
      setLandlord(lands.find(l => l.id === product.landlordId) || null);
    });
  }, [product.landlordId]);
  return (
    <Link
      to={`/produto/${product.id}`}
      className="group block rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_hsl(270_80%_60%/0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 text-xs font-medium px-3 py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
          {product.category}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-display font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        {landlord && (
          <div className="text-xs text-muted-foreground">
            Locador: <span className="font-medium text-foreground text-opacity-80">{landlord.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span>{product.city}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-secondary">{product.price}</span>
          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver detalhes →
          </span>
        </div>
      </div>
    </Link>
  );
}
