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
  "Audio",
  "Eventos",
  "Obras",
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Brinquedos": "🎉",
  "Mesa de Jogos": "🎱",
  "Audio": "🎵",
  "Eventos": "🎪",
  "Obras": "🏗️",
};

export const store = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) { console.error("Error fetching products:", error); return []; }
    return data.map(d => ({
      ...d,
      category: (d.category === "Equipamentos para Eventos" || d.category === "Estruturas para Eventos") ? "Eventos" : 
                (d.category === "Audiovisual") ? "Audio" : 
                (d.category === "Equipamentos Para Obras") ? "Obras" : d.category,
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
    const { error, data } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error deleting product:", error);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { error: "Erro de permissão: O banco de dados não permitiu excluir este produto. Verifique as políticas RLS no Supabase." };
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
    if (error) {
      console.error("Error updating product:", error);
      return { error: error.message };
    }
    return { success: true };
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
    // Salva as credenciais admin para restaurar a sessão depois
    const adminEmail = "admin@lokahub.com.br";
    const adminSession = localStorage.getItem("lokahub_admin") === "true";

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: l.email,
      password: l.password,
    });
    
    if (authError) return { error: authError.message };
    if (!authData.user?.id) return { error: "Erro desconhecido ao criar auth." };

    const newUserId = authData.user.id;

    // Restaura a sessão do admin imediatamente após criar o locador
    // pois o signUp substitui a sessão ativa
    if (adminSession) {
      const adminPass = prompt("Para confirmar, insira a senha do admin novamente:");
      if (adminPass) {
        await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
      }
    }

    const { error: dbError } = await supabase.from('landlords').insert([{
      id: newUserId,
      name: l.name,
      document: l.document,
      phone: l.phone,
      email: l.email,
      password: l.password, 
      city: l.city,
      cep: l.cep,
      type: l.type,
      created_at: l.createdAt || new Date().toISOString()
    }]);

    if (dbError) return { error: dbError.message };
    return { data: newUserId };
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
    try {
      // 1. Buscar os IDs dos produtos deste locador
      const { data: landlordProducts } = await supabase
        .from('products')
        .select('id')
        .eq('landlord_id', id);

      if (landlordProducts && landlordProducts.length > 0) {
        const productIds = landlordProducts.map(p => p.id);
        
        // 2. Excluir formulários desses produtos
        await supabase.from('client_forms').delete().in('product_id', productIds);
        
        // 3. Excluir os produtos
        await supabase.from('products').delete().in('id', productIds);
      }

      // 4. Excluir o locador e verificar se algo foi removido
      const { data, error: deleteError } = await supabase
        .from('landlords')
        .delete()
        .eq('id', id)
        .select();

      if (deleteError) {
        console.error("Error deleting landlord:", deleteError);
        return { error: "Erro ao excluir locador: " + deleteError.message };
      }

      // Se data estiver vazio, significa que o RLS bloqueou a exclusão
      if (!data || data.length === 0) {
        return { 
          error: "A deleção foi bloqueada pelo banco (RLS).\n\n" +
                 "Verifique se você está logado como admin@lokahub.com.br.\n\n" +
                 "Rode este comando no SQL Editor:\n" +
                 "DROP POLICY IF EXISTS \"Admin Full Access\" ON landlords;\n" +
                 "CREATE POLICY \"Admin Full Access\" ON landlords FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@lokahub.com.br');"
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Critical error in deleteLandlord:", err);
      return { error: "Erro crítico: " + err.message };
    }
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
      return { error: "Erro de permissão: O banco de dados não permitiu excluir este formulário. Verifique as políticas RLS no Supabase." };
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
