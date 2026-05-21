import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import PwaReloadPrompt from "@/components/PwaReloadPrompt";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import ProductFormPage from "./pages/ProductFormPage";
import CashRegister from "./pages/CashRegister";
import NewOrder from "./pages/NewOrder";
import OrdersPage from "./pages/OrdersPage";
import DaySummary from "./pages/DaySummary";
import NotFound from "./pages/NotFound";
import KitchenDisplay from "./pages/KitchenDisplay";
import CategoriesPage from "./pages/CategoriesPage";
import HistoryPage from "./pages/HistoryPage";
import PendingPayments from "./pages/PendingPayments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PwaReloadPrompt />
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/cocina" element={<KitchenDisplay />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/producto/nuevo" element={<ProductFormPage />} />
                  <Route path="/producto/editar/:id" element={<ProductFormPage />} />
                  <Route path="/caja" element={<CashRegister />} />
                  <Route path="/nuevo-pedido" element={<NewOrder />} />
                  <Route path="/pedidos" element={<OrdersPage />} />
                  <Route path="/resumen" element={<DaySummary />} />
                  <Route path="/resumen/:id" element={<DaySummary />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/historial" element={<HistoryPage />} />
                  <Route path="/pendientes" element={<PendingPayments />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
