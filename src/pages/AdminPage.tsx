import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, FileText, LogOut, Star, Edit, Trash2, Plus } from "lucide-react";
import { store } from "@/lib/data";
import type { Product, Landlord, ClientForm } from "@/lib/data";
import { isValidCPF } from "@/lib/utils";
import { useProducts, useLandlords, useForms } from "@/hooks/use-data";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";

const ADMIN_EMAIL = "admin@lokahub.com.br"; // Recommended admin email format

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(store.isAdminLoggedIn());
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"landlords" | "products" | "forms">("landlords");

  // Usa hooks com cache
  const { data: landlords = [], refetch: refetchLandlords } = useLandlords();
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { data: forms = [], refetch: refetchForms } = useForms();
  
  const [showAddLandlord, setShowAddLandlord] = useState(false);
  const [landlordForm, setLandlordForm] = useState({
    name: "", document: "", phone: "", email: "", password: "", city: "", cep: "", type: "pf" as "pf" | "pj",
  });
  const [landlordError, setLandlordError] = useState("");

  const toggleFeature = async (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    
    // Atualização Otimista
    queryClient.setQueryData(["products"], (old: Product[] | undefined) => 
      old ? old.map(prod => prod.id === id ? { ...prod, isFeatured: !prod.isFeatured } : prod) : []
    );

    const result = await store.updateProduct(id, { isFeatured: !p.isFeatured });
    if (result?.error) {
      alert("Erro ao destacar produto: " + result.error);
      await refetchProducts(); // Rollback
    } else {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    
    // Atualização Otimista: Remove o produto da UI instantaneamente
    queryClient.setQueryData(["products"], (old: Product[] | undefined) => 
      old ? old.filter(p => p.id !== id) : []
    );

    const result = await store.deleteProduct(id);
    if (result?.error) {
      alert("Erro ao excluir produto: " + result.error);
      // Rollback: Recarrega do banco se der erro
      await refetchProducts();
    }
  };

  const editProduct = async (product: Product) => {
    const newName = prompt("Novo nome:", product.name);
    if (newName === null) return;
    const newPrice = prompt("Novo preço:", product.price);
    if (newPrice === null) return;

    // Atualização Otimista
    queryClient.setQueryData(["products"], (old: Product[] | undefined) => 
      old ? old.map(p => p.id === product.id ? { ...p, name: newName || product.name, price: newPrice || product.price } : p) : []
    );

    const result = await store.updateProduct(product.id, { name: newName || product.name, price: newPrice || product.price });
    if (result?.error) {
      alert("Erro ao editar produto: " + result.error);
      await refetchProducts(); // Rollback
    } else {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const deleteLandlord = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este locador e todos os seus produtos anunciados?")) return;
    
    // Atualização Otimista: Remove o locador da UI instantaneamente
    queryClient.setQueryData(["landlords"], (old: Landlord[] | undefined) => 
      old ? old.filter(l => l.id !== id) : []
    );
    // Também remove os produtos desse locador otimisticamente
    queryClient.setQueryData(["products"], (old: Product[] | undefined) => 
      old ? old.filter(p => p.landlordId !== id) : []
    );

    const result = await store.deleteLandlord(id);
    if (result?.error) {
      alert(result.error);
      // Rollback: Recarrega do banco se der erro
      await Promise.all([refetchLandlords(), refetchProducts()]);
    }
  };
  
  const deleteForm = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este formulário?")) return;
    
    // Atualização Otimista
    queryClient.setQueryData(["forms"], (old: ClientForm[] | undefined) => 
      old ? old.filter(f => f.id !== id) : []
    );

    const result = await store.deleteForm(id);
    if (result?.error) {
      alert(result.error);
      await refetchForms();
    }
  };

  const handleAddLandlord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLandlordError("");

    if (!landlordForm.name || !landlordForm.document || !landlordForm.phone || !landlordForm.email || !landlordForm.password || !landlordForm.city) {
      setLandlordError("Preencha todos os campos.");
      return;
    }

    const cleanPhone = landlordForm.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setLandlordError("Por favor, insira um número de WhatsApp válido com DDD.");
      return;
    }

    if (landlordForm.type === "pf" && !isValidCPF(landlordForm.document)) {
      setLandlordError("Por favor, insira um CPF válido.");
      return;
    }

    const newLandlord: Landlord = {
      id: "",
      ...landlordForm,
      createdAt: new Date().toISOString(),
    };

    const { data: userId, error: signUpError } = await store.signUpLandlord(newLandlord);
    if (signUpError) {
      setLandlordError(signUpError);
      return;
    }

    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      setShowAddLandlord(false);
      setLandlordForm({
        name: "", document: "", phone: "", email: "", password: "", city: "", cep: "", type: "pf",
      });
    }
  };

  // Tabs do painel admin (precisa estar antes de qualquer return condicional)
  const TABS = useMemo(() => [
    { key: "landlords" as const, label: "Locadores", icon: Users, count: landlords.length },
    { key: "products" as const, label: "Produtos", icon: Package, count: products.length },
    { key: "forms" as const, label: "Formulários", icon: FileText, count: forms.length },
  ], [landlords.length, products.length, forms.length]);

  // Debounce do CEP para evitar múltiplas chamadas
  const debouncedCep = useDebounce(landlordForm.cep, 800);

  useEffect(() => {
    const val = debouncedCep.replace(/\D/g, "");
    if (val.length === 8) {
      fetch(`https://viacep.com.br/ws/${val}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setLandlordForm(prev => ({
              ...prev,
              city: `${data.logradouro}, Bairro ${data.bairro}, ${data.localidade} - ${data.uf}`
            }));
          }
        })
        .catch(err => console.error("Erro ao buscar CEP", err));
    }
  }, [debouncedCep]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    const formatted = val.replace(/^(\d{5})(\d)/, "$1-$2");
    setLandlordForm(prev => ({ ...prev, cep: formatted }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (landlordForm.type === "pf") {
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
    setLandlordForm(prev => ({ ...prev, document: val }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userId, error: signInError } = await store.signIn(email, pass);
    if (signInError || !userId || email !== ADMIN_EMAIL) {
      setError("Credenciais inválidas ou acesso não autorizado.");
      store.signOut(); // Ensure we don't leave a partial session if it wasn't the admin
    } else {
      store.setAdminSession(true);
      setLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    await store.signOut();
    store.setAdminSession(false);
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <img src="/logo.png" alt="LokaHub Logo" className="h-64 w-auto" />
            <h1 className="text-xl font-display font-bold text-center">Painel Admin</h1>
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <input placeholder="E-mail do Administrador" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input placeholder="Senha" type="password" value={pass} onChange={e => setPass(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="submit" className="w-full h-11 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.97]">
            Entrar
          </button>
        </form>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-32">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="LokaHub Logo" className="h-24 w-auto" />
            <span className="font-display font-bold text-gradient text-lg">Admin</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="container py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Landlords */}
        {tab === "landlords" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddLandlord(!showAddLandlord)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity active:scale-[0.97]"
              >
                <Plus size={16} />
                {showAddLandlord ? "Cancelar" : "Adicionar Locador"}
              </button>
            </div>

            {showAddLandlord && (
              <form onSubmit={handleAddLandlord} className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold">Novo Locador</h3>
                {landlordError && <p className="text-sm text-destructive">{landlordError}</p>}

                <input
                  placeholder="Nome completo"
                  value={landlordForm.name}
                  onChange={e => setLandlordForm({ ...landlordForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="CPF"
                  value={landlordForm.document}
                  onChange={handleDocumentChange}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="WhatsApp (com DDD, ex: 11999999999)"
                  value={landlordForm.phone}
                  onChange={e => setLandlordForm({ ...landlordForm, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="E-mail"
                  type="email"
                  value={landlordForm.email}
                  onChange={e => setLandlordForm({ ...landlordForm, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="Senha"
                  type="password"
                  value={landlordForm.password}
                  onChange={e => setLandlordForm({ ...landlordForm, password: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="CEP (00000-000)"
                  value={landlordForm.cep}
                  onChange={handleCepChange}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  placeholder="Endereço completo"
                  value={landlordForm.city}
                  onChange={e => setLandlordForm({ ...landlordForm, city: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-party text-primary-foreground font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
                >
                  Cadastrar Locador
                </button>
              </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-left">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Documento</th>
                    <th className="p-3 font-medium">E-mail</th>
                    <th className="p-3 font-medium">Senha</th>
                    <th className="p-3 font-medium">Cidade</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {landlords.map(l => (
                    <tr key={l.id} className="border-t border-border/30 hover:bg-muted/10">
                      <td className="p-3">{l.name}</td>
                      <td className="p-3 text-muted-foreground">{l.type === "pf" ? "PF" : "PJ"}</td>
                      <td className="p-3 text-muted-foreground">{l.document}</td>
                      <td className="p-3 text-muted-foreground">{l.email}</td>
                      <td className="p-3 text-muted-foreground font-mono">{l.password}</td>
                      <td className="p-3 text-muted-foreground">{l.city}</td>
                      <td className="p-3 flex items-center justify-end gap-1">
                        <button onClick={() => deleteLandlord(l.id)} title="Excluir Locador" className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                           <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground text-left">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Categoria</th>
                  <th className="p-3 font-medium">Cidade</th>
                  <th className="p-3 font-medium">Preço</th>
                  <th className="p-3 font-medium">Locador</th>
                  <th className="p-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const l = landlords.find(x => x.id === p.landlordId);
                  return (
                    <tr key={p.id} className="border-t border-border/30 hover:bg-muted/10">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.category}</td>
                      <td className="p-3 text-muted-foreground">{p.city}</td>
                      <td className="p-3 text-muted-foreground">{p.price}</td>
                      <td className="p-3 text-muted-foreground">{l?.name || "—"}</td>
                      <td className="p-3 flex items-center justify-end gap-1">
                        <button onClick={() => toggleFeature(p.id)} title={p.isFeatured ? "Remover da Home" : "Destacar na Home"} className={`p-1.5 rounded-md transition-colors ${p.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-muted'}`}>
                           <Star size={16} strokeWidth={2.5} fill={p.isFeatured ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => editProduct(p)} title="Editar" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                           <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} title="Excluir" className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                           <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Forms */}
        {tab === "forms" && (
          <div className="space-y-4">
            {forms.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">Nenhum formulário enviado.</p>
            ) : (
              <div className="space-y-3">
                {forms.map(f => {
                  // Extrai telefone embutido no endereço: "...endereço (Tel: XXXXX)"
                  const telMatch = f.address.match(/\(Tel:\s*(.+)\)$/);
                  const phone = telMatch ? telMatch[1].trim() : "—";
                  const cleanAddress = f.address.replace(/\s*\(Tel:.*?\)$/, "").trim();

                  return (
                    <div key={f.id} className="rounded-xl border border-border/50 bg-card p-5">
                      {/* Header do card */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-semibold text-foreground text-base">{f.fullName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enviado em {new Date(f.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteForm(f.id)}
                          title="Excluir"
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Grid de informações */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <InfoRow label="CPF" value={f.cpf} />
                        <InfoRow label="Telefone / WhatsApp" value={phone} />
                        <InfoRow label="Produto de Interesse" value={f.productName} />
                        <InfoRow label="Endereço" value={cleanAddress} className="col-span-2 md:col-span-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Componente auxiliar para exibir campo/valor ────────────────────────────
function InfoRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg bg-muted/30 border border-border/40 p-3 ${className}`}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-foreground font-medium break-words">{value || "—"}</p>
    </div>
  );
}
