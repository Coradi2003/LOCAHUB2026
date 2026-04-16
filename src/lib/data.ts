import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  price: string;
  image: string;
  landlordId: string;
  createdAt: string;
  isFeatured?: boolean;
}

export interface Landlord {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  cep?: string;
  type: 'pf' | 'pj';
  createdAt: string;
}

export interface ClientForm {
  id: string;
  fullName: string;
  cpf: string;
  address: string;
  productId: string;
  productName: string;
  createdAt: string;
}

export const CATEGORIES = [
  "Brinquedos",
  "Mesa de Jogos",
  "Audiovisual",
  "Equipamentos para Eventos",
  "Estruturas para Eventos",
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Brinquedos": "🎉",
  "Mesa de Jogos": "🎱",
  "Audiovisual": "🎵",
  "Equipamentos para Eventos": "🎪",
  "Estruturas para Eventos": "⛺",
};

export const store = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) { console.error("Error fetching products:", error); return []; }
    return data.map(d => ({
      ...d,
      landlordId: d.landlord_id,
      isFeatured: d.is_featured,
      createdAt: d.created_at
    }));
  },
  
  setProducts: async (p: Product[]) => {
    // Deprecated for direct use, but we can implement single inserts via addProduct instead
  },

  addProduct: async (p: Product) => {
    const { error } = await supabase.from('products').insert([{
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      city: p.city,
      image: p.image,
      landlord_id: p.landlordId,
      is_featured: p.isFeatured || false,
      created_at: p.createdAt || new Date().toISOString()
    }]);
    if (error) console.error("Error adding product:", error);
  },

  deleteProduct: async (id: string) => {
    // 1. Delete associated forms first
    await supabase.from('client_forms').delete().eq('product_id', id);

    // 2. Delete the product and return the result
    const { error, data, status } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error deleting product:", error);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { error: "Nenhum produto foi excluído. Verifique suas permissões." };
    }

    return { success: true };
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const payload: any = { ...updates };
    if (updates.landlordId) payload.landlord_id = updates.landlordId;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
    delete payload.landlordId;
    delete payload.isFeatured;
    delete payload.createdAt;
    delete payload.id;

    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) console.error("Error updating product:", error);
  },

  getLandlords: async (): Promise<Landlord[]> => {
    const { data, error } = await supabase.from('landlords').select('*');
    if (error) { console.error("Error fetching landlords:", error); return []; }
    return data.map(d => ({
      ...d,
      createdAt: d.created_at
    }));
  },
  
  signUpLandlord: async (l: Landlord) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: l.email,
      password: l.password,
    });
    
    if (authError) return { error: authError.message };
    if (!authData.user?.id) return { error: "Erro desconhecido ao criar auth." };

    const { error: dbError } = await supabase.from('landlords').insert([{
      id: authData.user.id,
      name: l.name,
      document: l.document,
      phone: l.phone,
      email: l.email,
      password: "auth-managed", 
      city: l.city,
      cep: l.cep,
      type: l.type,
      created_at: l.createdAt || new Date().toISOString()
    }]);

    if (dbError) return { error: dbError.message };
    return { data: authData.user.id };
  },

  signIn: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: "E-mail ou senha inválidos." };
    return { data: data.user?.id };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("lokahub_landlord_session");
    localStorage.removeItem("lokahub_admin");
  },

  getCurrentSessionId: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  },

  deleteLandlord: async (id: string) => {
    // 1. Delete associated products first
    await supabase.from('products').delete().eq('landlord_id', id);

    // 2. Delete the landlord
    const { error, data } = await supabase
      .from('landlords')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error deleting landlord:", error);
      return { error: "Erro ao excluir locador: " + error.message };
    }

    if (!data || data.length === 0) {
      return { error: "Nenhum locador foi excluído. Verifique suas permissões." };
    }

    return { success: true };
  },

  getForms: async (): Promise<ClientForm[]> => {
    const { data, error } = await supabase.from('client_forms').select('*');
    if (error) { console.error("Error fetching forms:", error); return []; }
    return data.map(d => ({
      ...d,
      fullName: d.full_name,
      productId: d.product_id,
      productName: d.product_name,
      createdAt: d.created_at
    }));
  },

  addForm: async (f: ClientForm) => {
    const { error } = await supabase.from('client_forms').insert([{
      id: f.id,
      full_name: f.fullName,
      cpf: f.cpf,
      address: f.address,
      product_id: f.productId,
      product_name: f.productName,
      created_at: f.createdAt || new Date().toISOString()
    }]);
    if (error) console.error("Error adding form:", error);
  },

  deleteForm: async (id: string) => {
    const { error, data } = await supabase
      .from('client_forms')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error deleting form:", error);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { error: "Nenhum formulário foi excluído. Verifique suas permissões." };
    }

    return { success: true };
  },

  // Auth helpers (still using localStorage for local session tracking, but can be synced properly later)
  getCurrentLandlordId: (): string | null => {
    return localStorage.getItem("lokahub_landlord_session");
  },
  setLandlordSession: (id: string | null) => {
    if (id) localStorage.setItem("lokahub_landlord_session", id);
    else localStorage.removeItem("lokahub_landlord_session");
  },
  isAdminLoggedIn: () => localStorage.getItem("lokahub_admin") === "true",
  setAdminSession: (v: boolean) => {
    if (v) localStorage.setItem("lokahub_admin", "true");
    else localStorage.removeItem("lokahub_admin");
  }
};
