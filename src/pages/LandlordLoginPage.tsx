import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store } from "@/lib/data";
import { LandlordRegisterModal } from "@/components/LandlordRegisterModal";

import { MessageCircle } from "lucide-react";

export default function LandlordLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userId, error: signInError } = await store.signIn(email, password);
    if (signInError || !userId) { 
      setError(signInError || "Erro ao fazer login."); 
      return; 
    }
    
    store.setLandlordSession(userId);
    navigate("/painel-locador");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center p-4 pt-32 pb-20">
        <div className="w-full max-w-md">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-display font-bold mb-3">
                Painel do <span className="text-gradient">Locador</span>
              </h1>
              <p className="text-muted-foreground">Gerencie suas locações de forma simples e rápida.</p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-8 shadow-xl shadow-primary/5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">E-mail</label>
                  <input 
                    placeholder="exemplo@email.com" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Senha</label>
                  <input 
                    placeholder="••••••••" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-party text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                >
                  Entrar no Painel
                </button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Ainda não é um parceiro LokaHub?
                  </p>
                  <button
                    type="button"
                    id="btn-quero-ser-locador"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] font-bold hover:bg-[#25D366] hover:text-white transition-all active:scale-[0.98]"
                  >
                    <MessageCircle size={18} />
                    Quero ser um Locador
                  </button>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />

      {/* Modal de Cadastro de Locador */}
      <LandlordRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
