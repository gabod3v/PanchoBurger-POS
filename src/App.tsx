import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import PwaReloadPrompt from "@/components/PwaReloadPrompt";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SuscripcionPage from "./pages/SuscripcionPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import OrgSetupWizard from "./pages/OrgSetupWizard";
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
import ConfiguracionPage from "./pages/ConfiguracionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PwaReloadPrompt />
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BranchProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Kitchen display - has its own layout */}
              <Route path="/cocina" element={
                <ProtectedRoute>
                  <KitchenDisplay />
                </ProtectedRoute>
              } />

              {/* Suscripcion */}
              <Route path="/suscripcion" element={
                <ProtectedRoute>
                  <Layout>
                    <SuscripcionPage />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin panel — standalone layout, no POS sidebar */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* Team management — redirect to Configuración */}
              <Route path="/equipo" element={<Navigate to="/configuracion" replace />} />

              {/* Profile */}
              <Route path="/perfil" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Org setup wizard */}
              <Route path="/setup" element={
                <ProtectedRoute>
                  <OrgSetupWizard />
                </ProtectedRoute>
              } />

              {/* POS routes with Layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout><Index /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/configuracion" element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'super_admin']}>
                  <Layout><ConfiguracionPage /></Layout>
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/producto/nuevo" element={<ProductFormPage />} />
                      <Route path="/producto/editar/:id" element={<ProductFormPage />} />
                      <Route path="/caja" element={<CashRegister />} />
                      <Route path="/nuevo-pedido" element={<NewOrder />} />
                      <Route path="/pedidos" element={<OrdersPage />} />
                      <Route path="/resumen" element={<DaySummary />} />
                      <Route path="/resumen/:id" element={<DaySummary />} />
                      <Route path="/categorias" element={<Navigate to="/menu" replace />} />
                      <Route path="/historial" element={<HistoryPage />} />
                      <Route path="/pendientes" element={<PendingPayments />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AppProvider>
        </BranchProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
