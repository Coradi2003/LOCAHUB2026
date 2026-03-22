import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft, Tag, MessageCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store } from "@/lib/data";
import type { ClientForm, Product, Landlord } from "@/lib/data";
import { isValidCPF } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [landlord, setLandlord] = useState<Landlord | null | undefined>(undefined);

  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState({ fullName: "", cpf: "", cep: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const prods = await store.getProducts();
      const p = prods.find(x => x.id === id);
      setProduct(p || null);
      if (p) {
        const lands = await store.getLandlords();
        setLandlord(lands.find(l => l.id === p.landlordId) || null);
      } else {
        setLandlord(null);
      }
    }
    load();
  }, [id]);

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Produto não encontrado.</p>
          <Link to="/produtos" className="text-primary hover:underline">Voltar aos produtos</Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Nome obrigatório";
    if (!form.cpf.trim() || !isValidCPF(form.cpf)) e.cpf = "CPF inválido";
    if (!form.cep.trim() || form.cep.replace(/\D/g, "").length < 8) e.cep = "CEP obrigatório";
    if (!form.address.trim()) e.address = "Endereço obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setForm(prev => ({ ...prev, cpf: val }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    const formatted = val.replace(/^(\d{5})(\d)/, "$1-$2");
    setForm(prev => ({ ...prev, cep: formatted }));

    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: `${data.logradouro}, Bairro ${data.bairro}, ${data.localidade} - ${data.uf}`
          }));
          setErrors(prev => ({ ...prev, address: "" }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const entry: ClientForm = {
      id: Date.now().toString(),
      fullName: form.fullName.trim(),
      cpf: form.cpf.trim(),
      address: form.address.trim(),
      productId: product.id,
      productName: product.name,
      createdAt: new Date().toISOString(),
    };
    store.addForm(entry).then(() => setFormSent(true));
  };

  const whatsappUrl = `https://wa.me/5541999995443?text=${encodeURIComponent(
    "Olá, acabei de preencher meus dados na LocaHub e tenho interesse em um produto. Pode me ajudar?"
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="pt-24 pb-16">
        <div className="container max-w-5xl">
          <ScrollReveal>
            <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
              <ArrowLeft size={14} /> Voltar aos produtos
            </Link>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <ScrollReveal>
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>

            {/* Info */}
            <ScrollReveal delay={100}>
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
                    <Tag size={12} /> {product.category}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-display font-bold">{product.name}</h1>
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {landlord && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Locador:</span> <span className="text-foreground text-opacity-80">{landlord.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin size={14} /> {product.city}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

                <div className="text-xl font-bold text-secondary">{product.price}</div>

                {/* Contact form or success */}
                {!formSent ? (
                  <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                    <h3 className="font-display font-semibold text-lg">Liberar contato com segurança</h3>
                    <p className="text-xs text-muted-foreground">Preencha seus dados para acessar o contato do locador.</p>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                        <input
                          placeholder="Nome completo"
                          value={form.fullName}
                          onChange={e => setForm({ ...form, fullName: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <input
                          placeholder="CPF"
                          value={form.cpf}
                          onChange={handleCpfChange}
                          className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                      <div>
                        <input
                          placeholder="CEP (00000-000)"
                          value={form.cep}
                          onChange={handleCepChange}
                          className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.cep && <p className="text-xs text-destructive mt-1">{errors.cep}</p>}
                      </div>
                      <div>
                        <input
                          placeholder="Endereço completo (com número)"
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                      </div>
                      <button
                        type="submit"
                        className="w-full h-11 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
                      >
                        Enviar e Liberar Contato
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-6 space-y-4 animate-scale-in">
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle size={20} />
                      <span className="font-semibold">Dados enviados com sucesso!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Agora você pode entrar em contato pelo WhatsApp.</p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-opacity active:scale-[0.97]"
                      style={{ backgroundColor: "#25D366", color: "#fff" }}
                    >
                      <MessageCircle size={18} />
                      Falar pelo WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
