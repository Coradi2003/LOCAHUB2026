import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store } from "@/lib/data";
import type { Landlord } from "@/lib/data";
import { isValidCPF } from "@/lib/utils";

export default function LandlordRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", document: "", phone: "", email: "", password: "", city: "", cep: "", type: "pf" as "pf" | "pj",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.document || !form.phone || !form.email || !form.password || !form.city) {
      setError("Preencha todos os campos.");
      return;
    }

    if (form.type === "pf" && !isValidCPF(form.document)) {
      setError("Por favor, insira um CPF válido.");
      return;
    }

    const landlords = await store.getLandlords();
    if (landlords.find(l => l.email === form.email)) {
      setError("E-mail já cadastrado.");
      return;
    }
    const newLandlord: Landlord = {
      id: `l${Date.now()}`,
      ...form,
      createdAt: new Date().toISOString(),
    };
    
    await store.addLandlord(newLandlord);
    store.setLandlordSession(newLandlord.id);
    navigate("/painel-locador");
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

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
            city: `${data.logradouro}, Bairro ${data.bairro}, ${data.localidade} - ${data.uf}`
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (form.type === "pf") {
      val = val.substring(0, 11);
      val = val.replace(/(\d{3})(\d)/, "$1.$2");
      val = val.replace(/(\d{3})(\d)/, "$1.$2");
      val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      val = val.substring(0, 14);
      val = val.replace(/^(\d{2})(\d)/, "$1.$2");
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      val = val.replace(/\.(\d{3})(\d)/, ".$1/$2");
      val = val.replace(/(\d{4})(\d)/, "$1-$2");
    }
    set("document", val);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="pt-24 pb-16">
        <div className="container max-w-lg">
          <ScrollReveal>
            <h1 className="text-3xl font-display font-bold text-center mb-2">
              Cadastro de <span className="text-gradient">Locador</span>
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Cadastre-se e comece a anunciar seus produtos.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
              {error && <p className="text-sm text-destructive">{error}</p>}

              <input placeholder="Nome completo" value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="CPF" value={form.document} onChange={handleDocumentChange}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Telefone" value={form.phone} onChange={e => set("phone", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="E-mail" type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Senha" type="password" value={form.password} onChange={e => set("password", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              
              <input placeholder="CEP (00000-000)" value={form.cep} onChange={handleCepChange}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Endereço completo" value={form.city} onChange={e => set("city", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />

              <button type="submit" className="w-full h-11 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]">
                Cadastrar
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Já tem conta? <Link to="/login-locador" className="text-primary hover:underline">Fazer login</Link>
              </p>
            </form>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
