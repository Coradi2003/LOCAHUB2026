import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";

const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const LandlordLoginPage = lazy(() => import("./pages/LandlordLoginPage"));
const LandlordDashboard = lazy(() => import("./pages/LandlordDashboard"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Fallback de carregamento simples e elegante
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Configuração otimizada para reduzir requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
      gcTime: 10 * 60 * 1000, // 10 minutos - tempo no cache
      refetchOnWindowFocus: false, // Não refaz request ao focar janela
      refetchOnMount: false, // Não refaz request ao montar se tem cache
      retry: 1, // Apenas 1 retry em caso de erro
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/produto/:id" element={<ProductDetailPage />} />
            <Route path="/login-locador" element={<LandlordLoginPage />} />
            <Route path="/painel-locador" element={<LandlordDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
