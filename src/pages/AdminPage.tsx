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
  const { data: forms = [] } = useForms();
  
  const [showAddLandlord, setShowAddLandlord] = useState(false);
  const [landlordForm, setLandlordForm] = useState({
    name: "", document: "", phone: "", email: "", password: "", city: "", cep: "", type: "pf" as "pf" | "pj",
  });
  const [landlordError, setLandlordError] = useState("");

  const toggleFeature = async (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    await store.updateProduct(id, { isFeatured: !p.isFeatured });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const result = await store.deleteProduct(id);
    if (result?.error) {
      alert("Erro ao excluir produto: " + result.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const editProduct = async (product: Product) => {
    const newName = prompt("Novo nome:", product.name);
    if (newName === null) return;
    const newPrice = prompt("Novo preço:", product.price);
    if (newPrice === null) return;

    await store.updateProduct(product.id, { name: newName || product.name, price: newPrice || product.price });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const deleteLandlord = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este locador e todos os seus produtos anunciados?")) return;
    
    const result = await store.deleteLandlord(id);
    if (result?.error) {
      alert(result.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
          <h1 className="text-xl font-display font-bold text-center">Admin <span className="text-gradient">LokaHub</span></h1>
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
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-gradient text-lg">LokaHub Admin</span>
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
          <div className="overflow-x-auto rounded-xl border border-border/50">
            {forms.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">Nenhum formulário enviado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-left">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">CPF</th>
                    <th className="p-3 font-medium">Endereço</th>
                    <th className="p-3 font-medium">Produto</th>
                    <th className="p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map(f => (
                    <tr key={f.id} className="border-t border-border/30 hover:bg-muted/10">
                      <td className="p-3">{f.fullName}</td>
                      <td className="p-3 text-muted-foreground">{f.cpf}</td>
                      <td className="p-3 text-muted-foreground">{f.address}</td>
                      <td className="p-3 text-muted-foreground">{f.productName}</td>
                      <td className="p-3 text-muted-foreground">{new Date(f.createdAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
