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
  formatCurrency,
  getCurrencyPlaceholder,
  getCurrencyPrecision,
  getCurrencyStep,
} from "@/lib/currency";
import { useStore } from "@/store/useStore";
import type { Cuenta } from "@/types/persistencia";
import {
  Calendar,
  CreditCard,
  Edit,
  Loader2,
  Percent,
  Plus,
  Trash2,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";

export function CuentasPage() {
  const {
    cuentas,
    instituciones,
    addCuenta,
    updateCuenta,
    deleteCuenta,
    isLoadingExchangeRates,
    updateExchangeRatesCache,
  } = useStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);

  // 🌐 Cargar tasas de cambio al montar el componente
  useEffect(() => {
    updateExchangeRatesCache();
  }, [updateExchangeRatesCache]);
  const [formData, setFormData] = useState({
    nombre: "",
    institucionId: "",
    tipo: "ahorros" as
      | "ahorros"
      | "corriente"
      | "cdt"
      | "tarjeta"
      | "broker"
      | "exchange"
      | "otro",
    moneda: "COP" as "COP" | "USD" | "EUR" | "USDT" | "BTC" | "ETH",
    saldoInicial: 0,
    fechaApertura: "",
    // Campos específicos para CDT
    tasaInteres: 0,
    fechaVencimiento: "",
    renovacionAutomatica: false,
  });

  const getInstitucionNombre = (id?: string) => {
    if (!id) return "Sin institución";
    const institucion = instituciones.find((i) => i.id === id);
    return institucion?.nombre || "Institución eliminada";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCuenta) {
      updateCuenta(editingCuenta.id, formData);
    } else {
      addCuenta(formData);
    }

    // Reset form
    setFormData({
      nombre: "",
      institucionId: "",
      tipo: "ahorros",
      moneda: "COP",
      saldoInicial: 0,
      fechaApertura: "",
      tasaInteres: 0,
      fechaVencimiento: "",
      renovacionAutomatica: false,
    });
    setEditingCuenta(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (cuenta: Cuenta) => {
    setEditingCuenta(cuenta);
    setFormData({
      nombre: cuenta.nombre,
      institucionId: cuenta.institucionId || "",
      tipo: cuenta.tipo as any,
      moneda: cuenta.moneda as any,
      saldoInicial: cuenta.saldoInicial,
      fechaApertura: cuenta.fechaApertura || "",
      // Campos CDT - usar valores por defecto si no existen
      tasaInteres: (cuenta as any).tasaInteres || 0,
      fechaVencimiento: (cuenta as any).fechaVencimiento || "",
      renovacionAutomatica: (cuenta as any).renovacionAutomatica || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta cuenta?")) {
      deleteCuenta(id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2 sm:mb-3">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Cuentas
            {isLoadingExchangeRates && (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500" />
            )}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tus cuentas bancarias, CDT y de inversión
            </p>
            {isLoadingExchangeRates && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 sm:px-3 py-1 rounded w-fit">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  Actualizando tasas de cambio...
                </span>
                <span className="sm:hidden">Actualizando tasas...</span>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <strong>💡 Tipos de cuentas disponibles:</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-blue-600 dark:text-blue-400">
              <div>
                <strong>Ahorros/Corriente:</strong> Cuentas bancarias
                tradicionales
              </div>
              <div>
                <strong>CDT:</strong> Certificados de Depósito a Término (tasa
                fija)
              </div>
              <div>
                <strong>Tarjeta:</strong> Tarjetas de crédito
              </div>
              <div>
                <strong>Broker:</strong> Cuentas de inversión (acciones, bonos)
              </div>
              <div>
                <strong>Exchange:</strong> Plataformas de criptomonedas
              </div>
              <div>
                <strong>Otro:</strong> Cuentas personalizadas
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Precisión de decimales:</strong> COP (0), USD/EUR (2),
              USDT (6), BTC (8), ETH (18)
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              🌐 <strong>Tasas de cambio en tiempo real:</strong> Actualizadas
              cada 30 minutos desde CoinGecko y ExchangeRate-API
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto shrink-0"
              onClick={() => {
                setEditingCuenta(null);
                setFormData({
                  nombre: "",
                  institucionId: "",
                  tipo: "ahorros",
                  moneda: "COP",
                  saldoInicial: 0,
                  fechaApertura: "",
                  tasaInteres: 0,
                  fechaVencimiento: "",
                  renovacionAutomatica: false,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  placeholder="Ej: Cuenta Ahorros Bancolombia"
                  required
                />
              </div>

              <div>
                <Label htmlFor="institucion">Institución</Label>
                <Select
                  value={formData.institucionId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, institucionId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una institución" />
                  </SelectTrigger>
                  <SelectContent>
                    {instituciones.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="ahorros">Ahorros</SelectItem>
                    <SelectItem value="corriente">Corriente</SelectItem>
                    <SelectItem value="cdt">CDT</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={formData.moneda}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, moneda: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                <Input
                  id="saldoInicial"
                  type="number"
                  value={formData.saldoInicial}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      saldoInicial: Number(e.target.value),
                    }))
                  }
                  placeholder={getCurrencyPlaceholder(formData.moneda)}
                  min="0"
                  step={getCurrencyStep(formData.moneda)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.moneda} soporta hasta{" "}
                  {getCurrencyPrecision(formData.moneda)} decimales
                  {formData.moneda === "BTC" && " (satoshis)"}
                  {formData.moneda === "ETH" && " (wei)"}
                </p>
              </div>

              <div>
                <Label htmlFor="fechaApertura">Fecha de Apertura</Label>
                <Input
                  id="fechaApertura"
                  type="date"
                  value={formData.fechaApertura}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaApertura: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Campos específicos para CDT */}
              {formData.tipo === "cdt" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label
                        htmlFor="tasaInteres"
                        className="flex items-center gap-2 text-sm"
                      >
                        <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          Tasa de Interés (% anual)
                        </span>
                        <span className="sm:hidden">Tasa (%)</span>
                      </Label>
                      <Input
                        id="tasaInteres"
                        type="number"
                        value={formData.tasaInteres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tasaInteres: Number(e.target.value),
                          }))
                        }
                        placeholder="8.75"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="fechaVencimiento"
                        className="flex items-center gap-2 text-sm"
                      >
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          Fecha de Vencimiento
                        </span>
                        <span className="sm:hidden">Vencimiento</span>
                      </Label>
                      <Input
                        id="fechaVencimiento"
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fechaVencimiento: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="renovacionAutomatica"
                      checked={formData.renovacionAutomatica}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          renovacionAutomatica: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="renovacionAutomatica" className="text-sm">
                      <span className="hidden sm:inline">
                        Renovación automática al vencimiento
                      </span>
                      <span className="sm:hidden">Renovación automática</span>
                    </Label>
                  </div>
                </>
              )}

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
                  {editingCuenta ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            Tus Cuentas ({cuentas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {cuentas.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">
                No tienes cuentas registradas.
              </p>
              <p className="text-xs sm:text-sm">¡Agrega tu primera cuenta!</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead className="text-right">
                        Saldo Inicial
                      </TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">
                          {cuenta.nombre}
                        </TableCell>
                        <TableCell>
                          {getInstitucionNombre(cuenta.institucionId)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {cuenta.tipo}
                        </TableCell>
                        <TableCell>{cuenta.moneda}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cuenta.saldoInicial, cuenta.moneda)}
                        </TableCell>
                        <TableCell>
                          {cuenta.tipo === "cdt" && (
                            <div className="text-sm space-y-1">
                              {cuenta.tasaInteres && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Percent className="w-3 h-3" />
                                  {cuenta.tasaInteres}% anual
                                </div>
                              )}
                              {cuenta.fechaVencimiento && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    cuenta.fechaVencimiento
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(cuenta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(cuenta.id)}
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
                {cuentas.map((cuenta) => (
                  <Card
                    key={cuenta.id}
                    className="p-3 border-l-4 border-l-blue-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {cuenta.nombre}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {getInstitucionNombre(cuenta.institucionId)}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cuenta)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(cuenta.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Tipo</p>
                        <p className="font-medium capitalize">{cuenta.tipo}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Moneda</p>
                        <p className="font-medium">{cuenta.moneda}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">
                          Saldo Inicial
                        </p>
                        <p className="font-medium text-lg">
                          {formatCurrency(cuenta.saldoInicial, cuenta.moneda)}
                        </p>
                      </div>
                    </div>

                    {cuenta.tipo === "cdt" && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {cuenta.tasaInteres && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Percent className="w-3 h-3" />
                            <span>{cuenta.tasaInteres}% anual</span>
                          </div>
                        )}
                        {cuenta.fechaVencimiento && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(
                                cuenta.fechaVencimiento
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
