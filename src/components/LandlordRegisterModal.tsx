import { useState, useEffect, useRef } from "react";
import { X, User, CreditCard, Phone, Mail, Lock, MapPin, Home, MessageCircle, ChevronRight } from "lucide-react";

// ─── CONSTANTE DO ADMINISTRADOR ────────────────────────────────────────────────
// Altere apenas este número para mudar o destino do WhatsApp
const ADMIN_WHATSAPP = "5541999995443";
// ───────────────────────────────────────────────────────────────────────────────

interface LandlordRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nome: string;
  cpf: string;
  whatsapp: string;
  email: string;
  senha: string;
  cep: string;
  endereco: string;
}

const INITIAL_FORM: FormData = {
  nome: "",
  cpf: "",
  whatsapp: "",
  email: "",
  senha: "",
  cep: "",
  endereco: "",
};

// ─── Helpers de formatação ──────────────────────────────────────────────────────
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Valida CPF usando o algoritmo dos dígitos verificadores */
function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // Rejeita sequências iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i]) * (len + 1 - i);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };
  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/** Exige exatamente 11 dígitos (celular com DDD) */
function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}
// ───────────────────────────────────────────────────────────────────────────────

interface FieldErrors {
  cpf?: string;
  whatsapp?: string;
}

export function LandlordRegisterModal({ isOpen, onClose }: LandlordRegisterModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animação de entrada / saída
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fechar ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setForm(INITIAL_FORM);
      setFieldErrors({});
    }, 300);
  };

  // Fechar ao clicar no overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === "cpf") value = formatCPF(value);
    if (field === "whatsapp") value = formatPhone(value);
    if (field === "cep") value = formatCEP(value);
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo ao digitar
    if (field === "cpf" || field === "whatsapp") {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlurValidation = (field: "cpf" | "whatsapp") => () => {
    if (field === "cpf" && form.cpf && !isValidCPF(form.cpf)) {
      setFieldErrors((prev) => ({ ...prev, cpf: "CPF inválido" }));
    }
    if (field === "whatsapp" && form.whatsapp && !isValidPhone(form.whatsapp)) {
      setFieldErrors((prev) => ({ ...prev, whatsapp: "Digite todos os 11 dígitos (DDD + 9 dígitos)" }));
    }
  };

  // Busca automática do endereço pelo CEP
  const handleCEPBlur = async () => {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            endereco: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          }));
        }
      } catch {
        // ignora erros de rede
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Valida CPF
    if (!isValidCPF(form.cpf)) {
      setFieldErrors((prev) => ({ ...prev, cpf: "CPF inválido" }));
      return;
    }
    // Valida WhatsApp completo (11 dígitos)
    if (!isValidPhone(form.whatsapp)) {
      setFieldErrors((prev) => ({ ...prev, whatsapp: "Digite todos os 11 dígitos (DDD + 9 dígitos)" }));
      return;
    }

    const message = `*NOVO PEDIDO DE CADASTRO - LOCADOR*

👤 Nome: ${form.nome}
🪪 CPF: ${form.cpf}
📱 WhatsApp: ${form.whatsapp}
📧 E-mail: ${form.email}
🔒 Senha: ${form.senha}
📍 CEP: ${form.cep}
🏠 Endereço: ${form.endereco}`;

    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    handleClose();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Modal box */}
      <div
        className="relative w-full max-w-lg bg-card border border-border/40 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden"
        style={{
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
          opacity: isVisible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
        }}
      >
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)] px-6 pt-6 pb-10">
          {/* Blob decorativo */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={handleClose}
            aria-label="Fechar modal"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white leading-tight">
                Quero ser um Locador
              </h2>
              <p className="text-white/70 text-xs mt-0.5">Preencha seus dados para cadastro</p>
            </div>
          </div>
        </div>

        {/* Curved connector */}
        <div className="relative -mt-5 bg-card">
          <svg viewBox="0 0 400 40" className="w-full" style={{ marginTop: "-1px" }}>
            <path d="M0,0 Q200,40 400,0 L400,40 L0,40 Z" fill="hsl(var(--card))" />
          </svg>
        </div>

        {/* Scrollable form area */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto custom-scrollbar -mt-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="landlord-register-form">
            {/* Nome */}
            <FieldInput
              id="reg-nome"
              label="Nome Completo"
              icon={<User size={16} />}
              placeholder="Seu nome completo"
              value={form.nome}
              onChange={handleChange("nome")}
              required
            />

            {/* CPF */}
            <FieldInput
              id="reg-cpf"
              label="CPF"
              icon={<CreditCard size={16} />}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange("cpf")}
              onBlur={handleBlurValidation("cpf")}
              error={fieldErrors.cpf}
              inputMode="numeric"
              required
            />

            {/* WhatsApp */}
            <FieldInput
              id="reg-whatsapp"
              label="WhatsApp com DDD"
              icon={<Phone size={16} />}
              placeholder="(41) 99999-0000"
              value={form.whatsapp}
              onChange={handleChange("whatsapp")}
              onBlur={handleBlurValidation("whatsapp")}
              error={fieldErrors.whatsapp}
              inputMode="numeric"
              required
            />

            {/* E-mail */}
            <FieldInput
              id="reg-email"
              label="E-mail"
              icon={<Mail size={16} />}
              placeholder="seu@email.com"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              required
            />

            {/* Senha */}
            <FieldInput
              id="reg-senha"
              label="Senha"
              icon={<Lock size={16} />}
              placeholder="Crie uma senha segura"
              type="password"
              value={form.senha}
              onChange={handleChange("senha")}
              required
            />

            {/* CEP */}
            <FieldInput
              id="reg-cep"
              label="CEP"
              icon={<MapPin size={16} />}
              placeholder="00000-000"
              value={form.cep}
              onChange={handleChange("cep")}
              onBlur={handleCEPBlur}
              inputMode="numeric"
              required
            />

            {/* Endereço completo */}
            <FieldInput
              id="reg-endereco"
              label="Endereço Completo"
              icon={<Home size={16} />}
              placeholder="Rua, número, bairro, cidade/UF"
              value={form.endereco}
              onChange={handleChange("endereco")}
              required
            />

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] shadow-lg shadow-green-500/20 hover:shadow-green-500/40 active:scale-[0.98] transition-all duration-200"
            >
              <MessageCircle size={20} />
              Enviar Dados Para Cadastro
              <ChevronRight size={18} className="ml-1 opacity-70" />
            </button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Seus dados serão enviados com segurança via WhatsApp
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente de campo ────────────────────────────────────────────────────
interface FieldInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  error?: string;
}

function FieldInput({
  id, label, icon, placeholder, value, onChange, onBlur, type = "text", inputMode, required, error,
}: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span className={error ? "text-red-500" : "text-primary opacity-80"}>{icon}</span>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputMode={inputMode}
        required={required}
        className={`w-full h-12 px-4 rounded-xl bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
          error
            ? "border border-red-500/70 focus:ring-red-400/40 focus:border-red-500/70"
            : "border border-border/60 focus:ring-primary/40 focus:border-primary/40"
        }`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
