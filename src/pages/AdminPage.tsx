import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, FileText, LogOut, Star, Edit, Trash2 } from "lucide-react";
import { store } from "@/lib/data";
import type { Product, Landlord, ClientForm } from "@/lib/data";

const ADMIN_USER = "teste";
const ADMIN_PASS = "teste";

export default function AdminPage() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(store.isAdminLoggedIn());
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"landlords" | "products" | "forms">("landlords");

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [forms, setForms] = useState<ClientForm[]>([]);

  useEffect(() => {
    if (loggedIn) {
      store.getLandlords().then(setLandlords);
      store.getProducts().then(setProducts);
      store.getForms().then(setForms);
    }
  }, [loggedIn]);

  const toggleFeature = async (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const updated = products.map(x => x.id === id ? { ...x, isFeatured: !x.isFeatured } : x);
    setProducts(updated);
    await store.updateProduct(id, { isFeatured: !p.isFeatured });
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await store.deleteProduct(id);
  };

  const editProduct = async (product: Product) => {
    const newName = prompt("Novo nome:", product.name);
    if (newName === null) return;
    const newPrice = prompt("Novo preço:", product.price);
    if (newPrice === null) return;

    const updated = products.map(p => p.id === product.id ? { ...p, name: newName || p.name, price: newPrice || p.price } : p);
    setProducts(updated);
    await store.updateProduct(product.id, { name: newName || product.name, price: newPrice || product.price });
  };

  const deleteLandlord = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este locador e todos os seus produtos anunciados?")) return;
    
    const updatedLandlords = landlords.filter(l => l.id !== id);
    setLandlords(updatedLandlords);
    await store.deleteLandlord(id);

    const updatedProducts = products.filter(p => p.landlordId !== id);
    setProducts(updatedProducts);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userId, error: signInError } = await store.signIn(user, pass);
    if (signInError || !userId) {
      setError("Usuário ou senha inválidos.");
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
          <h1 className="text-xl font-display font-bold text-center">Admin <span className="text-gradient">LocaHub</span></h1>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)}
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

  const TABS = [
    { key: "landlords" as const, label: "Locadores", icon: Users, count: landlords.length },
    { key: "products" as const, label: "Produtos", icon: Package, count: products.length },
    { key: "forms" as const, label: "Formulários", icon: FileText, count: forms.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-gradient text-lg">LocaHub Admin</span>
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
