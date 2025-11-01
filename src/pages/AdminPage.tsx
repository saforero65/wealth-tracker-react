import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  isAutoSyncEnabled,
  isSyncingNow,
  loadAutoSyncConfig,
  saveAutoSyncConfig,
} from "@/lib/auto-sync";
import { useStore } from "@/store/useStore";
import type { Institucion } from "@/types/persistencia";
import {
  AlertTriangle,
  Bug,
  Building2,
  CheckCircle,
  Download,
  Edit,
  FileText,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGoogleAuth } from "../auth/google";

export function AdminPage() {
  const {
    instituciones,
    addInstitucion,
    updateInstitucion,
    deleteInstitucion,
    exportData,
    // importData,  // Para futuro uso
    // clearAllData,  // Para futuro uso
    syncToSheets,
    syncFromSheets,
    setGoogleAuth,
  } = useStore();

  const { user, isAuthenticated, signIn, signOut, isLoading, accessToken } =
    useGoogleAuth();

  // Sincronizar el estado de autenticación con el store
  useEffect(() => {
    setGoogleAuth({
      isAuthenticated,
      accessToken,
      expiresAt: null, // El hook maneja la expiración internamente
      user,
    });
  }, [isAuthenticated, accessToken, user, setGoogleAuth]);

  // Cargar configuración de auto-sync
  useEffect(() => {
    const config = loadAutoSyncConfig();
    setSpreadsheetId(config.spreadsheetId || "");
    setAutoSyncEnabledState(config.enabled);
    console.log("⚙️ Configuración auto-sync cargada:", config);
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitucion, setEditingInstitucion] =
    useState<Institucion | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "banco" as const,
  });
  const [isExporting, setIsExporting] = useState(false);
  // const [isImporting, setIsImporting] = useState(false)  // Para futuro uso
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInstitucion) {
      updateInstitucion(editingInstitucion.id, formData);
      toast.success("Institución actualizada");
    } else {
      addInstitucion(formData);
      toast.success("Institución creada");
    }

    // Reset form
    setFormData({
      nombre: "",
      tipo: "banco",
    });
    setEditingInstitucion(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (institucion: Institucion) => {
    setEditingInstitucion(institucion);
    setFormData({
      nombre: institucion.nombre,
      tipo: (institucion.tipo || "banco") as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta institución?")) {
      deleteInstitucion(id);
      toast.success("Institución eliminada");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finanzas-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Datos exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar los datos");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión con Google");
      return;
    }

    setIsSyncing(true);
    try {
      await syncToSheets();
      toast.success("Datos sincronizados a Google Sheets");
    } catch (error) {
      toast.error("Error al sincronizar a Google Sheets");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromSheets = async () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión con Google");
      return;
    }

    setIsSyncing(true);
    try {
      await syncFromSheets();
      toast.success("Datos sincronizados desde Google Sheets");
    } catch (error) {
      toast.error("Error al sincronizar desde Google Sheets");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSpreadsheetId = () => {
    if (!spreadsheetId.trim()) {
      toast.error("El ID del spreadsheet no puede estar vacío");
      return;
    }
    localStorage.setItem("spreadsheet_id", spreadsheetId.trim());
    toast.success("ID del spreadsheet guardado");
  };

  const handleToggleAutoSync = () => {
    const newEnabled = !autoSyncEnabled;
    setAutoSyncEnabledState(newEnabled);
    saveAutoSyncConfig(newEnabled);
    toast.success(`Auto-sync ${newEnabled ? "habilitado" : "deshabilitado"}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Administración
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configuraciones y gestión de instituciones
          </p>
        </div>
      </div>

      {/* Google Authentication */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            Autenticación Google
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">
                    {user?.name || "Usuario autenticado"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {user?.email || "Conectado con Google"}
                  </p>
                  {accessToken && (
                    <p className="text-xs text-green-600">
                      Token: {accessToken.substring(0, 15)}...
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                size="sm"
                className="w-full sm:w-auto"
              >
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Inicia sesión para sincronizar con Google Sheets
                </p>
                {isLoading && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">
                      Cargando Google Identity Services...
                    </span>
                    <span className="sm:hidden">Cargando...</span>
                  </p>
                )}
              </div>
              <Button
                onClick={signIn}
                disabled={isLoading}
                size="sm"
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Cargando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Iniciar Sesión con Google
                    </span>
                    <span className="sm:hidden">Iniciar con Google</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Sheets Configuration */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              Configuración Google Sheets
            </span>
            <span className="sm:hidden">Config. Sheets</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="spreadsheet-id" className="text-sm">
                ID del Spreadsheet
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  id="spreadsheet-id"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1A2B3C4D5E6F7G8H9I0J..."
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSaveSpreadsheetId}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="hidden sm:inline">
                  Copia el ID desde la URL de tu Google Sheet:
                  <code className="ml-1">
                    docs.google.com/spreadsheets/d/[ID]/edit
                  </code>
                </span>
                <span className="sm:hidden">
                  Copia el ID desde la URL del Google Sheet
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Auto-sincronización</p>
                <p className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">
                    Guarda automáticamente cada cambio en Google Sheets
                  </span>
                  <span className="sm:hidden">Auto-guarda en Sheets</span>
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {isSyncingNow() && (
                  <span className="text-xs sm:text-sm text-blue-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Sincronizando...</span>
                    <span className="sm:hidden">Sync...</span>
                  </span>
                )}
                <Button
                  variant={autoSyncEnabled ? "default" : "outline"}
                  onClick={handleToggleAutoSync}
                  disabled={!isAuthenticated || !spreadsheetId.trim()}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {autoSyncEnabled ? (
                    <>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Habilitado</span>
                      <span className="sm:hidden">ON</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Deshabilitado</span>
                      <span className="sm:hidden">OFF</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets Sync */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Sincronización Manual</span>
            <span className="sm:hidden">Sync Manual</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Sincroniza manualmente tus datos con Google Sheets para tener
                una copia de respaldo y poder editarlos desde la hoja de
                cálculo.
              </span>
              <span className="sm:hidden">
                Sincroniza tus datos con Google Sheets manualmente.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSyncToSheets}
                disabled={
                  !isAuthenticated || isSyncing || !spreadsheetId.trim()
                }
                size="sm"
                className="w-full sm:flex-1"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Sincronizando...</span>
                    <span className="sm:hidden">Sync...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Enviar a Sheets</span>
                    <span className="sm:hidden">Enviar</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncFromSheets}
                disabled={
                  !isAuthenticated || isSyncing || !spreadsheetId.trim()
                }
                size="sm"
                className="w-full sm:flex-1"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Sincronizando...</span>
                    <span className="sm:hidden">Sync...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Traer de Sheets</span>
                    <span className="sm:hidden">Traer</span>
                  </>
                )}
              </Button>
            </div>
            {!spreadsheetId.trim() && (
              <p className="text-xs sm:text-sm text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  Configura primero el ID del spreadsheet arriba
                </span>
                <span className="sm:hidden">
                  Configura primero el ID arriba
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Gestión de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-sm">Exportar Datos</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={isExporting}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="hidden sm:inline">Exportando...</span>
                      <span className="sm:hidden">Export...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Exportar JSON</span>
                      <span className="sm:hidden">Exportar</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                <span className="hidden sm:inline">
                  Descarga un respaldo completo de todos tus datos en formato
                  JSON.
                </span>
                <span className="sm:hidden">
                  Descarga respaldo completo en JSON.
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instituciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Instituciones Financieras ({instituciones.length})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingInstitucion(null);
                    setFormData({
                      nombre: "",
                      tipo: "banco",
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Institución
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg mx-3 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingInstitucion
                      ? "Editar Institución"
                      : "Nueva Institución"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Ej: Bancolombia"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, tipo: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="exchange">Exchange</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingInstitucion ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {instituciones.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">
                No tienes instituciones registradas.
              </p>
              <p className="text-xs sm:text-sm">
                ¡Agrega tu primera institución!
              </p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instituciones.map((institucion) => (
                      <TableRow key={institucion.id}>
                        <TableCell className="font-medium">
                          {institucion.nombre}
                        </TableCell>
                        <TableCell className="capitalize">
                          {institucion.tipo || "banco"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(institucion)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(institucion.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Mobile - Cards */}
              <div className="md:hidden space-y-3">
                {instituciones.map((institucion) => (
                  <Card
                    key={institucion.id}
                    className="p-3 border-l-4 border-l-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {institucion.nombre}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {institucion.tipo || "banco"}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(institucion)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(institucion.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>
              • Las instituciones te permiten organizar tus cuentas por banco o
              broker.
            </p>
            <p>
              • Puedes exportar todos tus datos como respaldo en cualquier
              momento.
            </p>
            <p>• Los datos se guardan localmente en tu navegador.</p>

            <div className="pt-3 sm:pt-4 border-t">
              <p className="font-medium text-foreground mb-2 text-sm">Debug:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔍 Estado actual:", {
                    isAuthenticated,
                    hasAccessToken: !!accessToken,
                    isLoading,
                    hasSpreadsheetId: !!localStorage.getItem("spreadsheet_id"),
                    autoSyncEnabled: isAutoSyncEnabled(),
                    autoSyncConfig: loadAutoSyncConfig(),
                  });
                  toast.success(
                    "Revisa la consola para ver el estado de debug"
                  );
                }}
                className="w-full sm:w-auto"
              >
                <Bug className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Debug Estado Auth</span>
                <span className="sm:hidden">Debug Auth</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
