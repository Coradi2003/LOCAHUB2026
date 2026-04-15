import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, Package, Crop } from "lucide-react";
import Cropper from "react-easy-crop";
import { store, CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Product, Landlord } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-data";
import { useQueryClient } from "@tanstack/react-query";

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], description: "", city: "", price: "", image: "" });

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Busca produtos com cache compartilhado
  const { data: allProducts = [] } = useProducts();
  const products = landlord ? allProducts.filter(p => p.landlordId === landlord.id) : [];

  useEffect(() => {
    async function load() {
      // 1. Verificar sessão ativa no Supabase
      const id = await store.getCurrentSessionId();
      
      if (!id) { 
        store.setLandlordSession(null);
        navigate("/login-locador"); 
        return; 
      }

      // 2. Buscar locador diretamente pelo ID (sem depender do hook de lista)
      const { data, error } = await supabase
        .from('landlords')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert("Ops! Seu cadastro ficou incompleto. O e-mail foi registrado, mas os dados da loja não foram salvos. Por favor, crie uma conta nova com outro e-mail.");
        store.setLandlordSession(null);
        await store.signOut();
        navigate("/login-locador"); 
        return; 
      }
      
      // 3. Mapear campos snake_case → camelCase
      const mLand: Landlord = {
        ...data,
        createdAt: data.created_at,
      };

      setLandlord(mLand);
      setLoading(false);
    }
    load();
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropImage(event.target.result as string);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPx: any) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const finishCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    
    const image = new Image();
    image.src = cropImage;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a maximum width of 800px for web optimization
    const targetWidth = Math.min(800, croppedAreaPixels.width);
    const scale = targetWidth / croppedAreaPixels.width;
    const targetHeight = croppedAreaPixels.height * scale;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const base64Image = canvas.toDataURL('image/webp', 0.8);
    setForm({ ...form, image: base64Image });
    setCropImage(null);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setForm({ ...form, price: "" });
      return;
    }
    const formatted = (Number(val) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    setForm({ ...form, price: formatted });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landlord || !form.name || !form.description || !form.city) return;

    if (editing) {
      await store.updateProduct(editing.id, { ...form });
    } else {
      await store.addProduct({
        id: Date.now().toString(),
        ...form,
        image: form.image || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
        landlordId: landlord.id,
        createdAt: new Date().toISOString(),
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", category: CATEGORIES[0], description: "", city: "", price: "", image: "" });
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, description: p.description, city: p.city, price: p.price, image: p.image });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await store.deleteProduct(id);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleLogout = async () => {
    await store.signOut();
    navigate("/login-locador");
  };

  if (loading || !landlord) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Panel header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="font-display font-bold text-gradient text-lg">LokaHub</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Olá, {landlord.name}</span>
            <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold">Meus Produtos</h1>
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", category: CATEGORIES[0], description: "", city: "", price: "", image: "" }); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-party text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97]"
          >
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>

        {/* Product form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl p-4 animate-scale-in my-auto">
              
              {/* Form side */}
              <div className="w-full lg:w-3/5 rounded-xl border border-border/60 bg-card p-6 space-y-4 flex flex-col shadow-2xl">
              {cropImage ? (
                <div className="space-y-4">
                  <h2 className="font-display font-semibold text-lg flex items-center gap-2"><Crop size={20} /> Ajustar Imagem</h2>
                  <p className="text-xs text-muted-foreground">Arraste para reposicionar e use a barra para dar zoom.</p>
                  <div className="relative w-full h-[40vh] min-h-[300px] bg-black/10 rounded-lg overflow-hidden border border-border/60">
                    <Cropper
                      image={cropImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={4 / 3}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="flex gap-2 items-center px-2">
                    <span className="text-xs font-semibold text-muted-foreground min-w-[40px]">Zoom</span>
                    <input 
                      type="range" min={1} max={3} step={0.05} 
                      value={zoom} onChange={e => setZoom(Number(e.target.value))} 
                      className="flex-1 accent-primary" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={finishCrop} className="flex-1 h-11 rounded-lg bg-gradient-party text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97]">
                      Cortar e Confirmar
                    </button>
                    <button type="button" onClick={() => setCropImage(null)} className="flex-1 h-11 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground active:scale-[0.97]">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4 flex flex-col">
                  <h2 className="font-display font-semibold text-lg">{editing ? "Editar Produto" : "Novo Produto"}</h2>
                  <input placeholder="Nome do produto" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              <input placeholder="Cidade / Região" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder='Preço (ex: R$ 250,00)' value={form.price} onChange={handlePriceChange}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              
              <div className="space-y-2 border border-border/60 rounded-xl p-3 bg-muted/20">
                <label className="text-sm font-medium text-foreground">Imagem do Produto (opcional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload}
                  className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer" />
              </div>

                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 h-10 rounded-lg bg-gradient-party text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97]">
                      {editing ? "Salvar" : "Adicionar"}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                      className="flex-1 h-10 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
              </div>

              {/* Preview Side */}
              <div className="w-full lg:w-2/5 flex flex-col items-center justify-center space-y-4">
                 <div className="text-center space-y-1">
                   <h3 className="font-display font-semibold text-lg text-white drop-shadow-md">Preview do Anúncio</h3>
                   <p className="text-sm text-white/80 drop-shadow">Veja como seu produto aparecerá.</p>
                 </div>
                 <div className="w-full max-w-[320px] shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl ring-1 ring-border/20 pointer-events-none bg-background">
                    <ProductCard
                      product={{
                        id: "preview",
                        name: form.name || "Nome do Produto",
                        description: form.description || "Descrição...",
                        price: form.price || "R$ 0,00",
                        category: form.category || CATEGORIES[0],
                        city: form.city || landlord.city || "Sua Cidade",
                        image: form.image || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
                        landlordId: landlord.id,
                        createdAt: new Date().toISOString()
                      }}
                      landlord={landlord}
                    />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Product list */}
        {products.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package size={40} className="mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
            <p className="text-xs text-muted-foreground">Clique em "Adicionar Produto" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors">
                <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.city}</p>
                  <p className="text-xs font-medium text-secondary">{p.price}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
