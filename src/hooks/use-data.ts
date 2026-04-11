import { useQuery } from "@tanstack/react-query";
import { store } from "@/lib/data";

// Hook para produtos com cache automático
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => store.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para locadores com cache automático
export function useLandlords() {
  return useQuery({
    queryKey: ["landlords"],
    queryFn: () => store.getLandlords(),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para formulários com cache automático
export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: () => store.getForms(),
    staleTime: 5 * 60 * 1000,
  });
}
