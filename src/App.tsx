import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { loadAutoSyncConfig, setAutoSyncEnabled } from "@/lib/auto-sync";
import { ActivosPage } from "@/pages/ActivosPage";
import { AdminPage } from "@/pages/AdminPage";
import { CuentasPage } from "@/pages/CuentasPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TransaccionesPage } from "@/pages/TransaccionesPage";
import { useStore } from "@/store/useStore";
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  DollarSign,
  Menu,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "cuentas" | "activos" | "transacciones" | "admin"
  >("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loadFromLocalStorage = useStore((state) => state.loadFromLocalStorage);

  useEffect(() => {
    // Cargar datos locales
    loadFromLocalStorage();

    // Inicializar configuración de auto-sync
    const autoSyncConfig = loadAutoSyncConfig();
    if (autoSyncConfig.enabled && autoSyncConfig.spreadsheetId) {
      setAutoSyncEnabled(true);
      console.log("🔄 Auto-sync habilitado al iniciar la app");
    }
  }, [loadFromLocalStorage]);

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "cuentas":
        return <CuentasPage />;
      case "activos":
        return <ActivosPage />;
      case "transacciones":
        return <TransaccionesPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1 sm:gap-2">
                <DollarSign className="w-5 h-5 sm:w-7 sm:h-7" />
                <span className="hidden xs:inline">Mi Patrimonio</span>
                <span className="xs:hidden">Mi Patrimonio</span>
              </h1>

              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-2 items-center">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  onClick={() => setActiveTab("dashboard")}
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === "cuentas" ? "default" : "ghost"}
                  onClick={() => setActiveTab("cuentas")}
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cuentas
                </Button>
                <Button
                  variant={activeTab === "activos" ? "default" : "ghost"}
                  onClick={() => setActiveTab("activos")}
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Activos
                </Button>
                <Button
                  variant={activeTab === "transacciones" ? "default" : "ghost"}
                  onClick={() => setActiveTab("transacciones")}
                  size="sm"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Transacciones
                </Button>
                <Button
                  variant={activeTab === "admin" ? "default" : "ghost"}
                  onClick={() => setActiveTab("admin")}
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
                <ThemeToggle />
              </div>

              {/* Mobile Navigation Buttons */}
              <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-3 pb-3 border-t pt-3">
                <div className="flex flex-col space-y-1">
                  <Button
                    variant={activeTab === "dashboard" ? "default" : "ghost"}
                    onClick={() => {
                      setActiveTab("dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant={activeTab === "cuentas" ? "default" : "ghost"}
                    onClick={() => {
                      setActiveTab("cuentas");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                    size="sm"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Cuentas
                  </Button>
                  <Button
                    variant={activeTab === "activos" ? "default" : "ghost"}
                    onClick={() => {
                      setActiveTab("activos");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                    size="sm"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Activos
                  </Button>
                  <Button
                    variant={
                      activeTab === "transacciones" ? "default" : "ghost"
                    }
                    onClick={() => {
                      setActiveTab("transacciones");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                    size="sm"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Transacciones
                  </Button>
                  <Button
                    variant={activeTab === "admin" ? "default" : "ghost"}
                    onClick={() => {
                      setActiveTab("admin");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">{renderPage()}</main>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
