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
  "Cama Elástica",
  "Mesa de Jogos",
  "Piscina de Bolinha",
  "Audiovisual",
  "Infláveis",
  "Brinquedos para Festas",
  "Equipamentos para Eventos",
  "Estruturas para Eventos",
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Cama Elástica": "🤸",
  "Mesa de Jogos": "🎱",
  "Piscina de Bolinha": "🔴",
  "Audiovisual": "🎵",
  "Infláveis": "🎈",
  "Brinquedos para Festas": "🎉",
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
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error("Error deleting product:", error);
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
  
  addLandlord: async (l: Landlord) => {
    const { error } = await supabase.from('landlords').insert([{
      id: l.id,
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
    if (error) console.error("Error adding landlord:", error);
  },

  deleteLandlord: async (id: string) => {
    const { error } = await supabase.from('landlords').delete().eq('id', id);
    if (error) console.error("Error deleting landlord:", error);
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

  // Auth helpers (still using localStorage for local session tracking, but can be synced properly later)
  getCurrentLandlordId: (): string | null => {
    return localStorage.getItem("locahub_landlord_session");
  },
  setLandlordSession: (id: string | null) => {
    if (id) localStorage.setItem("locahub_landlord_session", id);
    else localStorage.removeItem("locahub_landlord_session");
  },
  isAdminLoggedIn: () => localStorage.getItem("locahub_admin") === "true",
  setAdminSession: (v: boolean) => {
    if (v) localStorage.setItem("locahub_admin", "true");
    else localStorage.removeItem("locahub_admin");
  }
};
