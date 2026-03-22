import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, Package, Crop } from "lucide-react";
import Cropper from "react-easy-crop";
import { store, CATEGORIES } from "@/lib/data";
import type { Product, Landlord } from "@/lib/data";

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], description: "", city: "", price: "", image: "" });

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    async function load() {
      let id = await store.getCurrentSessionId();
      if (!id) id = localStorage.getItem("locahub_landlord_session");

      if (!id) { 
        navigate("/login-locador"); 
        return; 
      }

      const [lands, prods] = await Promise.all([
        store.getLandlords(),
        store.getProducts()
      ]);
      const mLand = lands.find(x => x.id === id);
      
      if (!mLand) { 
        alert("Ops! Seu cadastro ficou incompleto. O e-mail foi registrado, mas os dados da loja não foram salvos devido à falta das permissões anteriores do banco Público. Por favor, crie uma conta nova com outro e-mail, ou exclua essa conta lá no painel 'Authentication' do Supabase para tentar de novo.");
        store.setLandlordSession(null);
        await store.signOut();
        navigate("/login-locador"); 
        return; 
      }
      
      setLandlord(mLand);
      setProducts(prods.filter(p => p.landlordId === id));
    }
    load();
  }, [navigate]);

  const refreshProducts = async () => {
    if (!landlord) return;
    const all = await store.getProducts();
    setProducts(all.filter(p => p.landlordId === landlord.id));
  };

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
    
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", category: CATEGORIES[0], description: "", city: "", price: "", image: "" });
    refreshProducts();
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, description: p.description, city: p.city, price: p.price, image: p.image });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await store.deleteProduct(id);
    refreshProducts();
  };

  const handleLogout = async () => {
    await store.signOut();
    navigate("/login-locador");
  };

  if (!landlord) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Panel header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="font-display font-bold text-gradient text-lg">LocaHub</Link>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 space-y-4 animate-scale-in flex flex-col max-h-[90vh] overflow-y-auto">
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
              <input placeholder='Preço (ex: R$ 250,00 ou "Sob consulta")' value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              
              <div className="space-y-2 border border-border/60 rounded-xl p-3 bg-muted/20">
                <label className="text-sm font-medium text-foreground">Imagem do Produto (opcional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload}
                  className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer" />
                {form.image && form.image.startsWith("data:") && <img src={form.image} alt="Preview" className="h-32 w-full object-cover rounded-lg border border-border/50" />}
                {form.image && !form.image.startsWith("data:") && <img src={form.image} alt="Atual" className="h-32 w-full object-cover rounded-lg border border-border/50" />}
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
