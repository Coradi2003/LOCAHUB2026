import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft, Tag, MessageCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { store } from "@/lib/data";
import type { ClientForm, Product, Landlord } from "@/lib/data";
import { isValidCPF } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [landlord, setLandlord] = useState<Landlord | null | undefined>(undefined);

  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState({ fullName: "", cpf: "", phone: "", cep: "", address: "", houseNumber: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!form.phone.trim() || cleanPhone.length < 10) e.phone = "Telefone obrigatório (com DDD)";
    
    if (!form.cep.trim() || form.cep.replace(/\D/g, "").length < 8) e.cep = "CEP obrigatório";
    if (!form.address.trim()) e.address = "Endereço obrigatório";
    if (!form.houseNumber.trim()) e.houseNumber = "Número obrigatório";
    if (!agreedToTerms) e.terms = "Você deve concordar com os Termos de Uso";
    
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    
    if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
    }
    if (val.length > 9) {
      val = `${val.substring(0, 10)}-${val.substring(10)}`;
    }
    setForm(prev => ({ ...prev, phone: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const entry: ClientForm = {
      id: Date.now().toString(),
      fullName: form.fullName.trim(),
      cpf: form.cpf.trim(),
      address: `${form.address.trim()}, Nº ${form.houseNumber.trim()} (Tel: ${form.phone.trim()})`,
      productId: product.id,
      productName: product.name,
      createdAt: new Date().toISOString(),
    };
    store.addForm(entry).then(() => setFormSent(true));
  };

  let waNumber = "5541999995443";
  if (landlord?.phone) {
    let cleanPhone = landlord.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = "55" + cleanPhone;
    }
    if (cleanPhone.length >= 12) {
      waNumber = cleanPhone;
    }
  }

  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Olá, acabei de preencher meus dados na LokaHub e tenho interesse em um produto. Pode me ajudar?"
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
                          placeholder="Telefone / WhatsApp (com DDD)"
                          value={form.phone}
                          onChange={handlePhoneChange}
                          className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
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
                      <div className="flex gap-3">
                        <div className="flex-[3]">
                          <input
                            placeholder="Nome da Rua / Bairro"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                        </div>
                        <div className="flex-1">
                          <input
                            placeholder="Nº"
                            value={form.houseNumber}
                            onChange={e => setForm({ ...form, houseNumber: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          {errors.houseNumber && <p className="text-xs text-destructive mt-1">{errors.houseNumber}</p>}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            id="terms" 
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                            className="mt-0.5"
                          />
                          <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                            Li e concordo com os{" "}
                            <Dialog>
                              <DialogTrigger asChild>
                                <button type="button" className="text-primary hover:underline font-medium">
                                  Termos de Uso
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Termos de Uso - LOKAHUB</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 text-sm text-muted-foreground">
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">1. ACEITAÇÃO DOS TERMOS</h3>
                                    <p>Ao acessar e utilizar a plataforma LOKAHUB, o usuário declara que leu, compreendeu e concorda integralmente com os presentes Termos de Uso, bem como com a legislação aplicável.</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">2. OBJETO DA PLATAFORMA</h3>
                                    <p>A LOKAHUB é uma plataforma digital que atua exclusivamente como intermediadora entre locadores (prestadores de serviços/produtos) e clientes interessados na contratação. A plataforma disponibiliza o ambiente tecnológico para facilitar o contato, divulgação e negociação entre as partes.</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">3. NATUREZA DA INTERMEDIAÇÃO</h3>
                                    <p>A LOKAHUB não participa da relação comercial final, não sendo parte integrante das negociações, contratos, entregas ou execuções dos serviços/produtos ofertados.</p>
                                    <p className="mt-2">Dessa forma, fica expressamente estabelecido que:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                      <li>A LOKAHUB atua única e exclusivamente como intermediadora digital;</li>
                                      <li>A plataforma não realiza vendas diretas;</li>
                                      <li>Não há vínculo empregatício, societário ou de representação entre a LOKAHUB e os locadores.</li>
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">4. RESPONSABILIDADE PELAS VENDAS E SERVIÇOS</h3>
                                    <p>Toda e qualquer transação realizada por meio da plataforma é de total e exclusiva responsabilidade do locador e do cliente.</p>
                                    <p className="mt-2">A LOKAHUB não se responsabiliza, em hipótese alguma, por:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                      <li>Qualidade, entrega, execução ou cumprimento dos serviços/produtos ofertados;</li>
                                      <li>Negociações realizadas entre as partes;</li>
                                      <li>Pagamentos, reembolsos, cancelamentos ou inadimplência;</li>
                                      <li>Informações fornecidas pelos locadores;</li>
                                      <li>Danos diretos ou indiretos decorrentes das transações realizadas.</li>
                                    </ul>
                                    <p className="mt-2">O locador é o único responsável por:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                      <li>Cumprir com o que foi ofertado ao cliente;</li>
                                      <li>Garantir a veracidade das informações;</li>
                                      <li>Respeitar prazos, condições e legislação vigente.</li>
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">5. RESPONSABILIDADE DO CLIENTE</h3>
                                    <p>O cliente é responsável por:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                      <li>Avaliar as informações do locador antes de contratar;</li>
                                      <li>Negociar diretamente as condições do serviço/produto;</li>
                                      <li>Verificar a idoneidade do locador.</li>
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">6. LIMITAÇÃO DE RESPONSABILIDADE</h3>
                                    <p>A LOKAHUB não garante resultados, lucros, qualidade ou satisfação nas transações realizadas entre usuários, sendo sua responsabilidade limitada apenas à disponibilização da plataforma.</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">7. USO DA PLATAFORMA</h3>
                                    <p>Os usuários se comprometem a utilizar a LOKAHUB de forma ética, legal e de boa-fé, sendo vedado:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                      <li>Inserir informações falsas ou enganosas;</li>
                                      <li>Utilizar a plataforma para práticas ilícitas;</li>
                                      <li>Violar direitos de terceiros.</li>
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">8. ALTERAÇÕES DOS TERMOS</h3>
                                    <p>A LOKAHUB poderá, a qualquer momento, modificar estes Termos de Uso, sendo responsabilidade do usuário revisá-los periodicamente.</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2">9. DISPOSIÇÕES FINAIS</h3>
                                    <p>Estes Termos são regidos pelas leis brasileiras. Qualquer controvérsia será resolvida no foro da comarca competente, conforme legislação vigente.</p>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-border">
                                    <p className="text-center font-medium text-foreground">LOKAHUB – Plataforma intermediadora. As transações são de responsabilidade exclusiva entre locador e cliente.</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {" "}e Política de Privacidade.
                          </label>
                        </div>
                        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
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
